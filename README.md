# Browser-based XHTML 1.0 Strict to HTML5 batch conversion

I came across a situation where I needed to convert a bunch of XHTML 1.0 Strict documents (or snippets) to valid HTML5.
This tool automates the process.

Note that this will not _add_ any new HTML5 elements/features to your pages. It merely gets rid of deprecated XHTML 1.0 Strict elements/attributes.

## Steps

1. Download and extract the files.
1. Visit index.html in Firefox 3.6+
1. Drag/drop your valid XHTML 1.0 Strict files in the marked area.
1. If everything goes according to plan you'll be asked to download a zip file containing the HTML5 equivalent of your files.
1. For more information (or if the conversion failed), take a look at the "Output" area. Messages will be added there as the files are processed.

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