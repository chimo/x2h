var x2hweb = {
    // Global counter FIXME: global?
    completedCount: 0,
    
    init: function() {
        // Messages

        x2hweb.output = document.getElementById('output');
        // Setup the dnd listeners.
        x2hweb.dropZone = document.getElementById('drop_zone'),
        x2hweb.dropZone.addEventListener('dragover', x2hweb.handleDragOver, false);
        x2hweb.dropZone.addEventListener('drop', x2hweb.handleFileSelect, false);

        /**
         * Returns whether the zip file is empty or not
         *
         * @returns  true if the zip file is empty false otherwise
         */
        JSZip.prototype.isEmpty = function() {
           for (var filename in this.files) {
               return false;
           }

           return true;
        }            
    },

    finalize: function() {
        if(!x2hweb.zip.isEmpty()) {
            x2hweb.output.innerHTML += '<li>Done!</li>';
            content = x2hweb.zip.generate();
            location.href='data:application/zip;base64,'+content
        }
        else {
            x2hweb.output.innerHTML += '<li>All given files were skipped. Nothing to download.</li>';
        }
        
        // Re-apply event listener so that we can drop more files
        x2hweb.dropZone.addEventListener('dragover', x2hweb.handleDragOver, false);
        x2hweb.dropZone.addEventListener('drop', x2hweb.handleFileSelect, false);
        x2hweb.dropZone.innerHTML = 'Drop XHTML files here';
    },

    handleFileSelect: function(evt) {
        evt.stopPropagation();
        evt.preventDefault();

        // FileList object
        var files = evt.dataTransfer.files;
        // This sometimes happen for whatever reason (with Thunar + Firefox, for example)
        if(files.length == 0) {
            x2hweb.output.innerHTML = 'Number of files dropped was zero';
            return;
        }

        // Clear old messages
        x2hweb.output.innerHTML = '';
        
        // Initialize the resulting zip file
        x2hweb.zip = new JSZip();

        // Remove event listener so that we can't drop more files until we're done.    
        x2hweb.dropZone.removeEventListener('dragover', x2hweb.handleDragOver, false);
        x2hweb.dropZone.removeEventListener('drop', x2hweb.handleFileSelect, false);    
        
        x2hweb.dropZone.innerHTML = 'Please wait...';
        x2hweb.completedCount = 0; // Ensure we're starting from zero when we're given a new batch of files to process

        // files is a FileList of File objects
        for (var i = 0, f; f = files[i]; i++) {
            // Skip non-HTML files
            if (!f.type.match('text/html')) {
                x2hweb.output.innerHTML += '<li>File <em>' + f.name + '</em> doesn\'t seem to be an HTML file. Skipping.</li>';

                x2hweb.completedCount++;
                if(x2hweb.completedCount == files.length) {
                    x2hweb.finalize();
                }

                continue;
            }
            var reader = new FileReader();

            // FIXME: I could not get Firefox to use the onerror event handler. Even when getting: 
            // Component returned failure code: 0x80520012 (NS_ERROR_FILE_NOT_FOUND) [nsIDOMFileReader.readAsText]
            reader.onerror = (function(theFile) {
                return function(e) {
                    var msg = '';
                    switch(e.target.error.code) {
                        case FileError.NOT_FOUND_ERR:
                            msg = 'File not found';
                            break;
                        case FileError.SECURITY_ERR:
                            msg = 'Security error';
                            break;
                        case FileError.ABORT_ERR:
                            msg = 'Operation aborted';
                            break;
                        case FileError.NOT_READABLE_ERR:
                            msg = 'File not readable';
                            break;
                        case FileError.ENCODING_ERR:
                            msg = 'Encoding error';
                            break;
                        default:
                            msg = 'Unknown error code: ' + e.target.error.code;
                    }

                    x2hweb.output.innerHTML += '<li>Error reading file: <em>' + theFile.name + '</em> (' + msg + '). Skipping.</li>';
                };
            })(f);

            // Callback function after the file is read
            reader.onload = (function(theFile) {
                return function(e) { 
                    // XHTML 1.0 Strict to HTML5 cleanup
                    var html5Content = ''; 
                    
                    try {
                        html5Content = x2h.xhtmlToHtml5(e.target.result, theFile.name);
                        for(var i=0; i<x2h.msgs.length; i++) {
                            x2hweb.output.innerHTML += '<li>' + x2h.msgs[i] + '</li>';
                        }
                        // Add the clean file to the zip archive
                        x2hweb.zip.add(theFile.name, html5Content);
                        x2hweb.dropZone.innerHTML = 'File ' + (x2hweb.completedCount+1) + ' of ' + files.length + ' completed';
                    }
                    catch(err) {
                        var srcTxt = err.getElementsByTagName('sourcetext')[0];

                        var perr = err.getElementsByTagName('parsererror')[0];
                        var srcTxt = perr.removeChild(srcTxt);

                        var li = x2hweb.output.appendChild(document.createElement('li'));

                        var arr = perr.textContent.split('\n');
                        for(var i=0; i<arr.length; i++) {
                            li.appendChild(document.createTextNode(arr[i]));
                            li.appendChild(document.createElement('br'));
                        }

                        arr = srcTxt.textContent.split('\n');
                        for(var i=0; i<arr.length; i++) {
                            li.appendChild(document.createTextNode(arr[i]));
                            li.appendChild(document.createElement('br'));
                        }
                    }

                    // Keep track of how many files have been processed
                    x2hweb.completedCount++; 
                    
                    // If this is the last file, generate the .zip and offer the download
                    if(x2hweb.completedCount == files.length) {
                        x2hweb.finalize();
                    }
                };
            })(f);

            // Read the file
            reader.readAsText(f);        
        }
    },

    // From here: http://www.html5rocks.com/en/tutorials/file/dndfiles/#toc-selecting-files-dnd
    /**
     * Prevents propagation and default behavior an event (in our case the "dragover" event)
     *
     * @param evt   Event fired (in our case the "dragover" event)
     */
    handleDragOver: function(evt) {
        evt.stopPropagation();
        evt.preventDefault();
    }
}

// Init Call at Runtime
document.onreadystatechange = function () {
    if (document.readyState == 'complete') {
        x2hweb.init();
    }
}