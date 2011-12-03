// Tested on:
//  * Firefox 3.6.21, 6.0.2, 7.0.1, 8.0a2
//  * Chromium 14.0.835.186

if(typeof(isDW) == "undefined") { // If we're not running in Dreamweaver, use Web Workers
    self.addEventListener('message', function(e) {
        // Only import the script once
        if(typeof(sax) == 'undefined') {
            self.importScripts('lib/sax.js'); /* https://github.com/isaacs/sax-js */
        }
        
        var json = {html: x2h.xhtmlToHtml5(e.data.xhtml, e.data.filename), filename: e.data.filename, msgs: x2h.msgs};
        self.postMessage(json);
    }, false);
}

var x2h = {
    msgs: [],

    // Allowed XHTML 1.0 Strict attributes that are deprecated in HTML5
    deprecated: {
        area: ['nohref'],
        head: ['profile'],
        object: ['archive', 'classid', 'codebase', 'codetype', 'declare', 'standby'],
        param: ['valuetype', 'type'],
        a: ['name', 'rev', 'charset', 'shape', 'coords'],
        link: ['rev', 'charset'],
        td: ['axis', 'abbr', 'scope', 'valign'],
        th: ['axis', 'abbr', 'valign'],
        meta: ['scheme'],
        img: ['longdesc']
    },

    makeMap: function(arr) { // From http://ejohn.org/files/htmlparser.js
        var obj = {}, items = arr;
        for ( var i = 0; i < items.length; i++ )
            obj[ items[i] ] = true;
            return obj;
    },

    selfClose: ['area','base','basefont','br','col','frame','hr','img','input','isindex','link','meta','param','embed'],

    /**
     * Performs multiple operations to convert a XHTML 1.0 Strict to HTML5
     *
     * @param html  String containing valid XHTML 1.0 Strict code
     * @returns     String containing valid HTML5
     */
    xhtmlToHtml5: function(html, filename) {
        x2h.msgs = [];

        x2h.selfClose = x2h.makeMap(x2h.selfClose);

        // htmlparser.js chokes on Doctypes, so remove it and add HTML5 Doctype at the end
        var dtd_re = /<!doctype.*\r?\n?.*\.dtd">/i; // FIXME: That's one sucky regex right there...
        var dtd = dtd_re.exec(html);

        if(dtd != null) {
            dtd = dtd[0];
        }

        html = html.replace(dtd_re, '');

        var results = '';

        var parser = sax.parser(false, {lowercasetags: true});

        parser.onopentag = function(tag) {
                var hasClass = false;
                
                switch(tag.name) {
                    // Replace <acronym> with <abbr>
                    case 'acronym':
                        results += '<abbr';

                        for(key in tag.attributes) {
                            results += " " + key + '="' + tag.attributes[key] + '"';
                        }                    
                    break;
                    
                    // Replace <big> and <tt> with <span class="(big|tt)">
                    case 'big':
                    case 'tt':
                        results += '<span';
                        for(key in tag.attributes) {
                            if(key == 'class') {
                                results += " " + key + '="' + tag.attributes[key] + ' ' + tag.name + '"';
                                hasClass = true;
                            }
                            else {
                                results += " " + key + '="' + tag.attributes[key] + '"';
                            }
                        }

                        if(!hasClass) {
                            results += ' class="' + tag.name + '"';
                        }
                    break;
                    
                    // Remove @summary from <table> and convert cellpadding/cellspacing attributes to classes (ex: "cellpadding=5" to class="cellpadding5")
                    case 'table':
                        results += '<table';
                        var clss = '', cs = '', cp = '';
                        for(key in tag.attributes) {
                            if(key == 'summary') {
                                continue;
                            }
                        
                            if(key == 'class') {
                                clss = tag.attributes[key];
                            }
                            else {
                                if(key == 'cellspacing') {
                                    cs = 'cellspacing' + tag.attributes[key];
                                    x2h.msgs.push(filename + ' is using class: ' + cs);
                                }
                                else {
                                    if(key == 'cellpadding') {
                                        cp = 'cellpadding' + tag.attributes[key];
                                        x2h.msgs.push(filename + ' is using class: ' + cp);
                                    }
                                    else {
                                        results += " " + key + '="' + tag.attributes[key] + '"';
                                    }
                                }
                            }
                        }

                        if(clss != '' || cs != '' || cp != '') { // FIXME: can end up with weird spacing: class="  cellpadding5", for example
                            results += ' class="' + clss + ' ' + cs + ' ' + cp + '"';
                        }
                    break;
                    default:
                        if(x2h.deprecated[tag.name]) { // If tag is one that had some of its attributes deprecated by HTML5
                            results += '<' + tag.name;
                            for(key in tag.attributes) {
                                var skip = false;
                                for(var j=0; j<x2h.deprecated[tag.name].length; j++) { // Compare them to the list of deprecated attributes
                                    if(x2h.deprecated[tag.name][j] == key) { // If it's one if the deprecated attrs.
                                        skip = true; // flag it
                                        break; // stop looping through the deprecated list
                                    }
                                }
                                if(!skip) { // If the current attribute was _not_ flagged as a deprecated one, keep it.
                                    results += " " + key + '="' + tag.attributes[key] + '"';
                                }
                            }
                        }
                        else { // If the tag and all its attributes are still valid in HTML5, keep as-is
                            results += "<" + tag.name;
                            for(key in tag.attributes) {
                                results += " " + key + '="' + tag.attributes[key] + '"';
                            }                        
                        }
                }

                results += (x2h.selfClose[tag.name] ? " /" : "") + ">";

            };

            parser.onclosetag = function(tag) {
                if(tag == 'acronym') {
                    results += '</abbr>';
                }
                else {
                    if (tag == 'big' || tag == 'tt') {
                        results += '</span>'
                    }
                    else {
                        if(!x2h.selfClose[tag]) {
                            results += '</' + tag + '>';
                        }
                    }
                }
            };

            parser.ontext = function(text) {
                results += text;
            };

            parser.oncomment = function(text) {
                results += '<!--' + text + '-->';
            };

            parser.onerror = function(e) {
                console.log('Error: ' + e); // TODO: true error handling
            };

            parser.onscript = function(text) {
                results += text;
            };

            parser.write(html).close();

        // If we removed the original dtd, put the HTML5 in its place
        if(dtd != null) {
            results  = '<!DOCTYPE html>' + results;
        }

        return results;
    }
}
