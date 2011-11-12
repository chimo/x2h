Experiments.

SAX implementation of https://github.com/chimo/x2h

Interestingly, it seems to be slower and consume more memory than the DOM alternative.
Might have something to do with the fact that DOMParser() is native to the browser and htmlparser.js isn't.

And/or my code is crap, which wouldn't surprise me.

Crude "benchmarks" performed with Firefox 7 feeding it 1000 copies of snippet.html