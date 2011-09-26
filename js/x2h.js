// Tested on:
//  * Firefox 3.6.21, 6.0.2, 8.0a2
//  * Chromium 14.0.835.186

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

var x2h = {
    // Global counter
    completedCount: 0,

    // Init
    init: function() {
        // Messages
        x2h.output = document.getElementById('output');
        
        // Setup the dnd listeners.
        x2h.dropZone = document.getElementById('drop_zone'),
        x2h.dropZone.addEventListener('dragover', x2h.handleDragOver, false);
        x2h.dropZone.addEventListener('drop', x2h.handleFileSelect, false);
    },

    // Package the results in a zip file and offer download (or show notice if nothing to download)
    finalize: function() {
        if(!x2h.zip.isEmpty()) {
            x2h.output.innerHTML += '<li>Done!</li>';
            content = x2h.zip.generate();
            location.href='data:application/zip;base64,'+content
        }
        else {
            x2h.output.innerHTML += '<li>All given files were skipped. Nothing to download.</li>';
        }
        
        // Re-apply event listener so that we can drop more files
        x2h.dropZone.addEventListener('dragover', x2h.handleDragOver, false);
        x2h.dropZone.addEventListener('drop', x2h.handleFileSelect, false);
        x2h.dropZone.innerHTML = 'Drop XHTML files here';
    },

    // Modified from here: http://www.html5rocks.com/en/tutorials/file/dndfiles/#toc-selecting-files-dnd
    handleFileSelect: function(evt) {
        evt.stopPropagation();
        evt.preventDefault();

        // FileList object
        var files = evt.dataTransfer.files;
        // This sometimes happen for whatever reason (with Thunar + Firefox, for example)
        if(files.length == 0) {
            x2h.output.innerHTML = 'Number of files dropped was zero';
            return;
        }

        // Clear old messages
        x2h.output.innerHTML = '';
        
        // Initialize the resulting zip file
        x2h.zip = new JSZip();

        // Remove event listener so that we can't drop more files until we're done.    
        x2h.dropZone.removeEventListener('dragover', x2h.handleDragOver, false);
        x2h.dropZone.removeEventListener('drop', x2h.handleFileSelect, false);    
        
        x2h.dropZone.innerHTML = 'Please wait...';
        x2h.completedCount = 0; // Ensure we're starting from zero when we're given a new batch of files to process

        // files is a FileList of File objects
        for (var i = 0, f; f = files[i]; i++) {
            // Skip non-HTML files
            if (!f.type.match('text/html')) {
                x2h.output.innerHTML += '<li>File <em>' + f.name + '</em> doesn\'t seem to be an HTML file. Skipping.</li>';

                x2h.completedCount++;
                if(x2h.completedCount == files.length) {
                    x2h.finalize();
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

                    x2h.output.innerHTML += '<li>Error reading file: <em>' + theFile.name + '</em> (' + msg + '). Skipping.</li>';
                };
            })(f);

            // Callback function after the file is read
            reader.onload = (function(theFile) {
                return function(e) { 
                    // XHTML 1.0 Strict to HTML5 cleanup
                    var html5Content = ''; 
                    
                    try {
                        html5Content = x2h.xhtmlToHtml5(e.target.result, theFile.name);
    
                        // Add the clean file to the zip archive
                        x2h.zip.add(theFile.name, html5Content);
                        x2h.dropZone.innerHTML = 'File ' + (x2h.completedCount+1) + ' of ' + files.length + ' completed';
                    }
                    catch(err) {
                        var srcTxt = err.getElementsByTagName('sourcetext')[0]; // TODO: Arrow doesn't point at correct location

                        var perr = err.getElementsByTagName('parsererror')[0];
                        var srcTxt = perr.removeChild(srcTxt);

                        x2h.output.innerHTML += '<li>' + perr.textContent.replace(/\n/g, '<br />') + '<br />'
                            + x2h.htmlentities(srcTxt.textContent).replace(/\n/, '<br />') + '</li>';
                    }

                    // Keep track of how many files have been processed
                    x2h.completedCount++; 
                    
                    // If this is the last file, generate the .zip and offer the download
                    if(x2h.completedCount == files.length) {
                        x2h.finalize();
                    }
                };
            })(f);

            // Read the file
            reader.readAsText(f);        
        }
    },

    // Quick, lazy, printable html
    htmlentities: function(str) {
        str = str.replace(/</g, '&lt;');
        return str.replace(/</g, '&gt;');
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
    },

    // TODO: Accept a 'map' of elements/attributes
    /**
     * Removes one or more attribtues on one or more elements
     *
     * @param elems     Element or Array of Element to remove attributes from
     * @param attrs     String or Array of String that names the attribute(s) to remove
     */
    rmAttrs: function(elems, attrs) {
        if(elems === undefined || attrs === undefined)
            return;
            
        if(typeof(elems) === 'object' && elems.length !== undefined) { // HTMLCollection of Nodes, array of attributes
            if((Array.isArray !== undefined && Array.isArray(attrs)) || (attrs instanceof Array)) {
                for(var j=0; j<attrs.length; j++) {
                    for(var i=0; i<elems.length; i++) {
                        elems[i].removeAttribute(attrs[j]);
                    }
                }
            }
            else { // HTMLCollection of Nodes, a single attribute
                for(var i=0; i<elems.length; i++) {
                    elems[i].removeAttribute(attrs);
                }        
            }
        }
        else { // Single node, array of attributes
            if((Array.isArray !== undefined && Array.isArray(attrs)) || (attrs instanceof Array)) {
                for(var j=0; j<attrs.length; j++) {
                    elems.removeAttribute(attrs[j]);
                }
            }
            else { // Single node, single attribute
                elems.removeAttribute(attrs);
            }
        }
    },

    /**
     * Performs multiple operations to convert a XHTML 1.0 Strict to HTML5
     *
     * @param html  String containing valid XHTML 1.0 Strict code
     * @returns     String containing valid HTML5
     */
    xhtmlToHtml5: function(html, filename) {

        // DOMParser() chokes on Doctypes, so remove it and add HTML5 Doctype at the end
        var dtd_re = /<!doctype.*\r?\n?.*\.dtd">/i; // FIXME: That's one sucky regex right there...
        var dtd = dtd_re.exec(html);

        if(dtd != null) {
            dtd = dtd[0];
        }

        html = html.replace(dtd_re, '');

        // Seems like it's easier to "rename" an element with regexes than DOM, so do these operations first

        // Replace <acronym> with <abbr>
        html =  html.replace(/<acronym/g, '<abbr');
        html =  html.replace(/<\/acronym/g, '</abbr');
 
        // Replace <big> with existing @class with <span> with existing @class plus "x2h-big"
        // Regex is a modification of one found in htmlparser.js (http://ejohn.org/blog/pure-javascript-html-parser/)
        html = html.replace(/<big((?:\s+\w+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)((?:\s+class(?:\s*=\s*(?:(?:"([^"]*)")|(?:'([^']*)')|[^>\s]+))?))((?:\s+\w+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/g, '<span$1 class="$3$4 big"$5>');

        // Replace class-less <big> with <span class="big">
        html =  html.replace(/<big/g, '<span class="big"');
        html =  html.replace(/<\/big/g, '</span');

        // Replace <tt> with existing @class with <span> with existing @class plus "x2h-tt"
        // Regex is a modification of one found in htmlparser.js (http://ejohn.org/blog/pure-javascript-html-parser/)
        html = html.replace(/<tt((?:\s+\w+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)((?:\s+class(?:\s*=\s*(?:(?:"([^"]*)")|(?:'([^']*)')|[^>\s]+))?))((?:\s+\w+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/g, '<span$1 class="$3$4 tt"$5>');
        
        // Replace class-less <tt> with <span>
        html =  html.replace(/<tt/g, '<span class="tt"');
        html =  html.replace(/<\/tt/g, '</span');    

        var parser = new DOMParser();
        html = parser.parseFromString(html, "text/xml");

        if(html.getElementsByTagName('parsererror').length) {
            throw(html);
        }

        var tbls = html.getElementsByTagName('table');
        var cells = '';
        var attr = '';
        var clss = '';

        // Processing <table>s
        for(var i=0; i<tbls.length; i++) {
            tbls[i].removeAttribute('summary'); // Remove @summary
            if((attr = tbls[i].getAttribute('cellspacing')) != null && attr != '') { // Add @class equivalent to @cellspacing
                if((clss = tbls[i].getAttribute('class')) == null) {
                    clss = ''; 
                }
                else {
                    clss = clss + ' ';
                }
                tbls[i].setAttribute('class', clss + 'cellspacing' + attr);
                x2h.output.innerHTML += '<li><em>' + filename + '</em> is using class: <em>cellspacing' + attr + '</em></li>';
                tbls[i].removeAttribute('cellspacing'); // Remove @cellspacing
            }

            if((attr = tbls[i].getAttribute('cellpadding')) != null && attr != '') { // Add @class equivalent to @cellpadding
                if((clss = tbls[i].getAttribute('class')) == null) {
                    clss = ''; 
                }
                else {
                    clss = clss + ' ';
                }
                tbls[i].setAttribute('class', clss + 'cellpadding' + attr);
                x2h.output.innerHTML += '<li><em>' + filename + '</em> is using class: <em>cellpadding' + attr + '</em></li>';
                tbls[i].removeAttribute('cellpadding'); // Remove @cellpadding
            }
        }

//        x2h.rmAttrs(html.getElementsByTagName('table'), ['summary','cellpadding','cellspacing']); // Replaced with the above block
        x2h.rmAttrs(html.getElementsByTagName('area'), 'nohref');
        x2h.rmAttrs(html.getElementsByTagName('head'), 'profile');
        x2h.rmAttrs(html.getElementsByTagName('object'), ['archive','classid','codebase','codetype','declare','standby']);
        x2h.rmAttrs(html.getElementsByTagName('param'), ['valuetype', 'type']);
        x2h.rmAttrs(html.getElementsByTagName('a'), ['name','rev','charset','shape','coords']); // TODO: Check if the doc has an id.value of this.name.value somewhere. If not, add an @id of this.name.value to this element
        x2h.rmAttrs(html.getElementsByTagName('link'), ['rev', 'charset']);
        x2h.rmAttrs(html.getElementsByTagName('td'), ['axis', 'abbr', 'scope', 'valign']);
        x2h.rmAttrs(html.getElementsByTagName('th'), ['axis', 'abbr', 'valign']);
        x2h.rmAttrs(html.getElementsByTagName('meta'), 'scheme');
        x2h.rmAttrs(html.getElementsByTagName('img'), 'longdesc');

        var results = '';

        var s = new XMLSerializer();
        results = s.serializeToString(html);

        // If we removed the original dtd, put the HTML5 in its place
        if(dtd != null) {
            results  = '<!DOCTYPE html>' + results;
        }

        return results;
    },
}

// Init Call at Runtime
document.onreadystatechange = function () {
    if (document.readyState == 'complete') {
        x2h.init();
    }
}
