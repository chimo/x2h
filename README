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

* Replaces <acronym> with <abbr>
* Replaces <big> with <span class="big">
* Replaces <tt> with <span class="tt">
* Removes @summary from <table>
* Replaces @cellpadding/@cellspacing with a class (ex: class="cellpadding5" instead of cellpadding="5") on <table>
* Removes @nohref from <area>
* Removes @profile from <head>
* Removes @archive, @classid, @codebase, @codetype, @declare, @standby from <object>
* Removes @type and @valuetype from <param>
* Removes @charset, @name, @rev and @shape from <a>
* Removes @charset and @rev from <link>
* Removes @abbr, @axis, @valid from <td> and <th>
* Removes @scope from <td>
* Removes @scheme from <meta>
* Removes @longdesc from <img>

