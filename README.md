# XHTML 1.0 Strict to HTML5 batch conversion

I came across a situation where I needed to convert a bunch of XHTML 1.0 Strict documents (or snippets) to valid HTML5.  
This tool automates the process.

Note that this will not _add_ any new HTML5 elements/features to your pages.  
It merely gets rid of deprecated XHTML 1.0 Strict elements/attributes or replaces them with conforming ones.

## Usage

There are two "products" in here:

1. Browser-based, drag-and-drop batch conversion:
    1. Download and extract the files. (or use the [demo here](http://chimo.github.com/x2h/))
    1. Visit index.html in Firefox 3.6+ (if you are using Chrome/Chromium, see note below)
    1. Drag/drop your valid XHTML 1.0 Strict files in the marked area.
    1. If everything goes according to plan you'll be asked to download a zip file containing the HTML5 equivalent of your files.
    1. For more information (or if the conversion failed), take a look at the "Output" area. Messages will be added there as the files are processed.
1. Dreamweaver extension
    1. Open "dw-x2h.mxi" with the "Adobe Extension Manager"
    1. Access 'XHTML to HTML5' entry in the 'Commands' menu
    1. Select the folder containing your XHTML files
    1. Wait while DW converts the files
    1. At the end, you'll be left with an opened document containing notes and information on the conversion, if applicable.

## What exacly does this do to my documents?

* Replaces &lt;acronym&gt; with &lt;abbr&gt;
* Replaces &lt;big&gt; with &lt;span class="big"&gt;
* Replaces &lt;tt&gt; with &lt;span class="tt"&gt;
* Removes @summary from &lt;table&gt;
* Replaces @cellpadding/@cellspacing with a class (ex: class="cellpadding5" instead of cellpadding="5") on &lt;table&gt;
* Removes @nohref from &lt;area&gt;
* Removes @profile from &lt;head&gt;
* Removes @archive, @classid, @codebase, @codetype, @declare, @standby from &lt;object&gt;
* Removes @type and @valuetype from &lt;param&gt;
* Removes @charset, @name, @rev and @shape from &lt;a&gt;
* Removes @charset and @rev from &lt;link&gt;
* Removes @abbr, @axis, @valid from &lt;td&gt; and &lt;th&gt;
* Removes @scope from &lt;td&gt;
* Removes @scheme from &lt;meta&gt;
* Removes @longdesc from &lt;img&gt;

## Notes

* If you want to use this locally (file://) with Chrome/Chromium you need to start the browser with: _--allow-file-access-from-files --allow-file-access_
  Otherwise you'll get "Security error".
* The tool has been tested with: 
    * Firefox 3.6.21, 6.0.2, 7.0.1, 8.0.1
    * Chromium 14.0.835.186
    * Opera 11.50
    * Dreamweaver CS5

## 3rd Party

Using sax.js by Isaac Z. Schlueter as a JS SAX library: https://github.com/isaacs/sax-js  
Using jszip by Stuart Knightley: http://jszip.stuartk.co.uk/

## Flattr this project
[![Flattr this git repo](http://api.flattr.com/button/flattr-badge-large.png)](https://flattr.com/submit/auto?user_id=chimo&url=https://github.com/chimo/x2h&title=XHTML 1.0 Strict to HTML5&language=&tags=github&category=software) 