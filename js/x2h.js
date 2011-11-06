// Tested on:
//  * Firefox 3.6.21, 6.0.2, 7.0.1, 8.0a2
//  * Chromium 14.0.835.186

var x2h = {
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
    
    msgs: [],

    /**
     * Performs multiple operations to convert a XHTML 1.0 Strict to HTML5
     *
     * @param html  String containing valid XHTML 1.0 Strict code
     * @returns     String containing valid HTML5
     */
    xhtmlToHtml5: function(html, filename) {
        x2h.msgs = [];

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
 
        // Replace <big> with existing @class with <span> with existing @class plus "big"
        // Regex is a modification of one found in htmlparser.js (http://ejohn.org/blog/pure-javascript-html-parser/)
        html = html.replace(/<big((?:\s+\w+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)((?:\s+class(?:\s*=\s*(?:(?:"([^"]*)")|(?:'([^']*)')|[^>\s]+))?))((?:\s+\w+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/g, '<span$1 class="$3$4 big"$5>');

        // Replace class-less <big> with <span class="big">
        html =  html.replace(/<big/g, '<span class="big"');
        html =  html.replace(/<\/big/g, '</span');

        // Replace <tt> with existing @class with <span> with existing @class plus "tt"
        // Regex is a modification of one found in htmlparser.js (http://ejohn.org/blog/pure-javascript-html-parser/)
        html = html.replace(/<tt((?:\s+\w+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)((?:\s+class(?:\s*=\s*(?:(?:"([^"]*)")|(?:'([^']*)')|[^>\s]+))?))((?:\s+\w+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/g, '<span$1 class="$3$4 tt"$5>');
        
        // Replace class-less <tt> with <span>
        html =  html.replace(/<tt/g, '<span class="tt"');
        html =  html.replace(/<\/tt/g, '</span');    

        // Build the DOM
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
                x2h.msgs.push(filename + ' is using class: cellspacing' + attr);
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
                x2h.msgs.push(filename + ' is using class: cellpadding' + attr);
                tbls[i].removeAttribute('cellpadding'); // Remove @cellpadding
            }
        }

//        this.rmAttrs(html.getElementsByTagName('table'), ['summary','cellpadding','cellspacing']); // Replaced with the above block
        this.rmAttrs(html.getElementsByTagName('area'), 'nohref');
        this.rmAttrs(html.getElementsByTagName('head'), 'profile');
        this.rmAttrs(html.getElementsByTagName('object'), ['archive','classid','codebase','codetype','declare','standby']);
        this.rmAttrs(html.getElementsByTagName('param'), ['valuetype', 'type']);
        this.rmAttrs(html.getElementsByTagName('a'), ['name','rev','charset','shape','coords']); // TODO: Check if the doc has an id.value of this.name.value somewhere. If not, add an @id of this.name.value to this element
        this.rmAttrs(html.getElementsByTagName('link'), ['rev', 'charset']);
        this.rmAttrs(html.getElementsByTagName('td'), ['axis', 'abbr', 'scope', 'valign']);
        this.rmAttrs(html.getElementsByTagName('th'), ['axis', 'abbr', 'valign']);
        this.rmAttrs(html.getElementsByTagName('meta'), 'scheme');
        this.rmAttrs(html.getElementsByTagName('img'), 'longdesc');

        var results = '';

        // DOM to String
        var s = new XMLSerializer();
        results = s.serializeToString(html);
            
        // If we removed the original dtd, put the HTML5 in its place
        if(dtd != null) {
            results  = '<!DOCTYPE html>' + results;
        }

        return results;
    }
}