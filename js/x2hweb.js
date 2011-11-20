var x2hweb = {
    // Counter
    completedCount: 0,

    // Worker
    worker: null,
    
    init: function() {
        // Check for FileReader support
        if(typeof FileReader === undefined) {
            return; // Exit if not supported
        }
    
        x2hweb.output = document.getElementById('output'); // Output for on-screen messages
        x2hweb.dropZone = document.getElementById('drop_zone'); // Drag and drop target
        x2hweb.input = document.getElementById('input'); // Form input

        var dnd = false, input = false;
        
        // If the browser supports drag-and-drop
        if('draggable' in document.createElement('span')) {
            dnd = true;
            x2hweb.dropZone.removeAttribute('class'); // Make drop_zone visible
            x2hweb.dropZone.addEventListener('dragover', x2hweb.handleDragOver, false); // Setup drag listener
            x2hweb.dropZone.addEventListener('drop', x2hweb.handleFileSelect, false); // Setup drop listener
        }
        
        var i = document.createElement('input');
        i.setAttribute('type', 'file');
        if(i.type == 'file') { // If the browser supports <input type="file">
            input = true;
            document.getElementById('frm').setAttribute('class', ''); // Make form visible        
            x2hweb.input.addEventListener('change', x2hweb.handleFileSelect, false); // Setup form input listener
        }

        if(dnd && input) {
            document.getElementById('or').removeAttribute('class');
        }
        
        if(dnd || input) { // Drag-and-drop or <input type="file"> is supported, hide the error message
            document.getElementById('unsupported').setAttribute('class', 'hide');
        }

        x2hweb.worker = new Worker('js/x2h-sax.js');

        x2hweb.worker.addEventListener('message', function(e) {
            var txt = null,
                li = null;

            // Print messages
            for(var i=0; i<e.data.msgs.length; i++) {
                txt = document.createTextNode(e.data.msgs[i]);
                li = document.createElement('li');
                li.appendChild(txt);
                x2hweb.output.appendChild(li);
            }

            // Add HTML5 content to the zip file
            x2hweb.zip.add(e.data.filename, e.data.html);

            // Keep track of how many files have been processed
            x2hweb.dropZone.innerHTML = 'File ' + (x2hweb.completedCount+1) + ' of ' + x2hweb.nbFiles + ' completed';
            x2hweb.completedCount++; 
                    
            // If this is the last file, generate the .zip and offer the download
            if(x2hweb.completedCount == x2hweb.nbFiles) {
               x2hweb.finalize();
            }
        }, false);

        x2hweb.worker.addEventListener('error', function(e) {
            // Print error message
            var li = document.createElement('li');
            li.innerHTML = 'Error: ' + e.message + '<br />Filename: ' + e.filename + '<br />Line: ' + e.lineno;
            x2hweb.output.appendChild(li);
        }, false);

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
        
        // Re-enable form field
        x2hweb.input.removeAttribute('disabled');
    },

    handleFileSelect: function(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        
        var files = null;
        if(evt.dataTransfer === undefined) { // Form input
            files = evt.target.files;
        }
        else { // Drag and drop
            files = evt.dataTransfer.files;
        }
        
        // This sometimes happen for whatever reason (with Thunar + Firefox, for example)
        if(files.length == 0) {
            x2hweb.output.innerHTML = 'Number of files dropped was zero';
            return;
        }

        x2hweb.nbFiles = files.length;

        // Clear old messages
        x2hweb.output.innerHTML = '';
        
        // Initialize the resulting zip file
        x2hweb.zip = new JSZip();

        // Remove event listener so that we can't drop more files until we're done.    
        x2hweb.dropZone.removeEventListener('dragover', x2hweb.handleDragOver, false);
        x2hweb.dropZone.removeEventListener('drop', x2hweb.handleFileSelect, false);    
        
        // Disable form field
        x2hweb.input.setAttribute('disabled', 'disabled');
        
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
            reader.onerror = (function(theFile) { // TODO: Use addEventListener
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
                    
                    // Keep track of how many files have been processed
                    x2hweb.completedCount++; 
                    
                    // If this is the last file, generate the .zip and offer the download
                    if(x2hweb.completedCount == files.length) {
                        x2hweb.finalize();
                    }                    
                };
            })(f);
            
            // Callback function after the file is read
            reader.onload = (function(theFile) { // TODO: Use addEventListener
                return function(e) { 
                    // XHTML 1.0 Strict to HTML5 cleanup
                    var html5Content = ''; 
                    
                    try {
                        // Send XHTML to Worker
                        var json = {xhtml: e.target.result, filename: theFile.name};
                        x2hweb.worker.postMessage(json);

                        var txt = null;
                        var li = null;
                    }
                    catch(err) {
                        console.log(err); // TODO: Proper error handling
                        /* var srcTxt = err.getElementsByTagName('sourcetext')[0];

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
                        } */
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
