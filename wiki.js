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

function ghGetFiles(path) {
  var out = [];
  jget('https://api.github.com/repos/carverh/wiki/contents/pages/'+path, function(data) {
    var dato = JSON.parse(data);
    dato.forEach(function(i) {
      if (i.type == 'file') {
        out.push(i.path.split('pages/')[1].split('.md')[0]);
      } else {
        var fl = ghGetFiles(i.path.split('pages/')[1]);
        out = out.concat(fl);
      }
    });
  });
  return out;
}

// Requires all libraries that are loaded after the page is loaded
function requireRemaining() {
  // Setup PrefixFree
  require(['lib/prefixfree/prefixfree.js']);

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

  // Setup Hypothesis
  require(['https://hypothes.is/embed.js']);
}

// Special page handlers
var specialPages = {
  Search: function() {
    require(['lib/mustache/mustache.js'], function(Mustache) {
      var t = window.location.hash.slice(1);
      var cel = document.getElementById('content');
      var cet = document.getElementById('title');
      cet.innerText = 'Special/Search';
      
      // Search page
      cel.innerHTML = Mustache.render(document.getElementById('tp-search').innerHTML);
      var sform = document.getElementById('sform');
      var ssubmit = document.getElementById('ssubmit');
      var squery = document.getElementById('squery');
      var sresults = document.getElementById('sresults');
      
      // Update the search box's value
      if (t != '') squery.value = t;
      
      // Submition handler
      function handleSubmit(ev) {
        window.location.replace('?Special/Search#'+squery.value);
        window.location.reload();
        ev.preventDefault();
        return false;
      }
      
      // Handlers
      sform.addEventListener('submit', handleSubmit, false);
      ssubmit.addEventListener('click', handleSubmit, false);
      
      if (t != '') {
        // Results page
        /*
        jget('https://api.github.com/repos/carverh/wiki/contents/pages', function(data) {
          var dato = JSON.parse(data);
          var rfiles = ghGetFiles('/');
          cel.innerHTML = Mustache.render(document.getElementById('tp-results').innerHTML, {
            query: rquery,
            results: rfiles
          });
        });
        */

        jget('FILES', function(data) {
          var afiles = data.split('\n');
          var files = [];
          afiles.forEach(function(file) {
            if (RegExp(t.toLowerCase()).test(file.toLowerCase())) {
              files.push(file);
            }
          });
          sresults.innerHTML = Mustache.render(document.getElementById('tp-results').innerHTML, {
            query: t,
            results: files
          });
        });
      }
      requireRemaining();
    });
  },
  Listing: function() {
    require(['lib/mustache/mustache.js'], function(Mustache) {
      var cel = document.getElementById('content');
      var cet = document.getElementById('title');
      cet.innerText = 'Special/Listing';
      jget('FILES', function(data) {
        var files = data.split('\n');
        cel.innerHTML = Mustache.render(document.getElementById('tp-listing').innerHTML, {
          results: files
        }); 
      });
    });
    requireRemaining();
  }
};

// Initializing Message
console.log('Initializing...');

jget('CONFIG', function(data) {
  // Load config
  data.split('\n').forEach(function(l) {
    var kv = l.split('=');
    config[kv[0]] = kv[1];
  });

  // Get wiki title
  var ptitle;
  if (window.location.href.split('?').length > 1) {
    ptitle = window.location.href.split('?')[1].split('#')[0];
  }
  if (!ptitle) {
    ptitle = config.homepage;
  }

  // Special page handling
  if (ptitle.startsWith('Special/')) {
    specialPages[ptitle.split('Special/')[1]]();
  } else {
    // Load wiki page
    jget('pages/'+ptitle+'.md', function(pbody) {
      require(['lib/marked/marked.js'], function(marked) {
        // Convert the markdown to HTML
        var pbodym = marked(pbody);

        // Insert content into the DOM
        document.getElementById('title').innerHTML = ptitle;
        document.getElementById('content').innerHTML = pbodym;

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
        
        // Require the rest of the libraries
        requireRemaining();

        // Log success message to console
        console.log("Done loading wiki page '"+ptitle+"'.");
      });
    });
  }
});
