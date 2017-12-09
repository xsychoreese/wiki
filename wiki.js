/*
@project DorpWiki
@version 1.0.0
@author Carver Harrison
@licence bsd-3-clause
@site https://dorper.me/p/wiki
@file Javascript for DorpWiki
*/

// Globals
var katex;

// Special page handlers
var specialPages = {
  Search: function() {
    require(['lib/tinystache/tinystache.js'], function(mustache) {
      var t = window.location.hash;
      var cel = document.getElementById('content');
      if (t == '') {
        // Search page
        cel.innerHTML = mustache(document.getElementById("tp-search").innerHTML);
      } else {
        // Results page
        cel.innerHTML = mustache(document.getElementById("tp-results").innerHTML);
      }
    });
  }
};

// Variables
var config = {};

// AJAX - Get XMLHTTP object
function jobj() {
  if (window.XMLHttpRequest) {
      // code for modern browsers
      return new XMLHttpRequest();
   } else {
      // code for old IE browsers
      return new ActiveXObject("Microsoft.XMLHTTP");
  }
}

// AJAX - HTTP GET
function jget(url, cb) {
  var xhttp = jobj();
  xhttp.open('GET', url, true);
  xhttp.send();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      cb(this.responseText);
    }
    else if (this.readyState == 4 && this.status == 200) {
      console.error("AJAX Error: Could not GET '"+url+"'.");
    }
  };
}

// Initializing Message
console.log('Initializing...');

// Load non-state-specific libraries
require(['lib/prefixfree/prefixfree.js']);

jget('CONFIG', function(data) {
  // Load config
  data.split('\n').forEach(function(l) {
    var kv = l.split('=');
    config[kv[0]] = kv[1];
  });

  // Get wiki title
  var ptitle = window.location.href.split('?')[1];
  if (!ptitle) {
    ptitle = config.homepage;
  }

  // Special page handling
  if (ptitle.startsWith("Special/")) {
    specialPages[ptitle.split("Special/")[1]]();
  } else {
    // Load wiki page
    jget('pages/'+ptitle+'.md', function(pbody) {
      require(['lib/marked/marked.js'], function(marked) {
        // Convert the markdown to HTML
        var pbodym = marked(pbody);

        // Insert content into the DOM
        document.getElementById('title').innerHTML = ptitle;
        document.getElementById('content').innerHTML = pbodym;      

        // Setup KaTeX
        require(['https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.8.3/katex.min.js', 'lib/katex/autoload.js'], function(_katex, renderMathInElement) {
          // HACK: Set katex to _katex to define katex
          katex = _katex;
          renderMathInElement(document.body, { delimiters: [
            {left: "$$", right: "$$", display: true},
            {left: "$", right: "$", display: false}
          ]});
        });

        // Setup Highlight.js
        require(['https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/highlight.min.js'], function(hljs) {
          hljs.initHighlighting();
        });

        // Setup Bindings
        document.querySelectorAll('[data-bind="page markdown"]').forEach(function (i) {
          i.innerHTML = pbody;
        });

        document.querySelectorAll('[data-bind="page html"]').forEach(function (i) {
          i.innerHTML = pbodym;
        });

        document.querySelectorAll('[data-bind="title"]').forEach(function (i) {
          i.innerText = ptitle;
        });

        // Log success message to console
        console.log("Done loading wiki page '"+ptitle+"'.");
      });
    });
  }
});
