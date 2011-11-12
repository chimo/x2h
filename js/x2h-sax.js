// Tested on:
//  * Firefox 3.6.21, 6.0.2, 7.0.1, 8.0a2
//  * Chromium 14.0.835.186

var x2h = {
    msgs: [],

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

    /**
     * Performs multiple operations to convert a XHTML 1.0 Strict to HTML5
     *
     * @param html  String containing valid XHTML 1.0 Strict code
     * @returns     String containing valid HTML5
     */
    xhtmlToHtml5: function(html, filename) {
        x2h.msgs = [];

        // htmlparser.js chokes on Doctypes, so remove it and add HTML5 Doctype at the end
        var dtd_re = /<!doctype.*\r?\n?.*\.dtd">/i; // FIXME: That's one sucky regex right there...
        var dtd = dtd_re.exec(html);

        if(dtd != null) {
            dtd = dtd[0];
        }

        html = html.replace(dtd_re, '');

        var results = '';

        HTMLParser(html, {
            start: function(tag, attrs, unary) {
                var hasClass = false;
                
                switch(tag) {
                    // Replace <acronym> with <abbr>
                    case 'acronym':
                        results += '<abbr';

                        for ( var i = 0; i < attrs.length; i++ ) {
                            results += " " + attrs[i].name + '="' + attrs[i].escaped + '"';
                        }                    
                    break;
                    
                    // Replace <big> and <tt> with <span class="(big|tt)">
                    case 'big':
                    case 'tt':
                        results += '<span';
                        for ( var i = 0; i < attrs.length; i++ ) {
                            if(attrs[i].name == 'class') {
                                results += " " + attrs[i].name + '="' + attrs[i].escaped + ' ' + tag + '"';
                                hasClass = true;
                            }
                            else {
                                results += " " + attrs[i].name + '="' + attrs[i].escaped + '"';
                            }
                        }

                        if(!hasClass) {
                            results += ' class="' + tag + '"';
                        }
                    break;
                    
                    // Remove @summary from <table> and convert cellpadding/cellspacing attributes to classes (ex: "cellpadding=5" to class="cellpadding5")
                    case 'table':
                        results += '<table';
                        var clss = '', cs = '', cp = '';
                        for ( var i = 0; i < attrs.length; i++ ) {
                            if(attrs[i].name == 'summary') {
                                continue;
                            }
                        
                            if(attrs[i].name == 'class') {
                                clss = attrs[i].escaped;
                            }
                            else {
                                if(attrs[i].name == 'cellspacing') {
                                    cs = 'cellspacing' + attrs[i].escaped;
                                    x2h.msgs.push(filename + ' is using class: ' + cs);
                                }
                                else {
                                    if(attrs[i].name == 'cellpadding') {
                                        cp = 'cellpadding' + attrs[i].escaped;
                                        x2h.msgs.push(filename + ' is using class: ' + cp);
                                    }
                                    else {
                                        results += " " + attrs[i].name + '="' + attrs[i].escaped + '"';
                                    }
                                }
                            }
                        }

                        if(clss != '' || cs != '' || cp != '') { // FIXME: can end up with weird spacing: class="  cellpadding5", for example
                            results += ' class="' + clss + ' ' + cs + ' ' + cp + '"';
                        }
                    break;
                    default:
                        if(x2h.deprecated[tag]) { // If tag is one that had some of its attributes deprecated by HTML5
                            results += '<' + tag;
                            for(var i=0; i<attrs.length; i++) { // Check all its attributes
                                var skip = false;
                                for(var j=0; j<x2h.deprecated[tag].length; j++) { // Compare them to the list of deprecated attributes
                                    if(x2h.deprecated[tag][j] == attrs[i].name) { // If it's one if the deprecated attrs.
                                        skip = true; // flag it
                                        break; // stop looping through the deprecated list
                                    }
                                }
                                if(!skip) { // If the current attribute was _not_ flagged as a deprecated one, keep it.
                                    results += " " + attrs[i].name + '="' + attrs[i].escaped + '"';
                                }
                            }
                        }
                        else { // If the tag and all its attributes are still valid in HTML5, keep as-is
                            results += "<" + tag;
                            for(var i=0; i<attrs.length; i++) {
                                results += " " + attrs[i].name + '="' + attrs[i].escaped + '"';
                            }                        
                        }
                }

                results += (unary ? " /" : "") + ">";
            },
            end: function(tag) {
                if(tag == 'acronym') {
                    results += '</abbr>';
                }
                else {
                    if (tag == 'big' || tag == 'tt') {
                        results += '</span>'
                    }
                    else {
                        results += '</' + tag + '>';
                    }
                }
            },
            chars: function(text) {
                results += text;
            },
            comment: function(text) {
                results += '<!--' + text + '-->';
            }
        });

        // If we removed the original dtd, put the HTML5 in its place
        if(dtd != null) {
            results  = '<!DOCTYPE html>' + results;
        }

        return results;
    }
}
