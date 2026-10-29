// This script creates a special redirect for GitHub Pages SPA routing
// It's based on the technique from https://github.com/rafgraph/spa-github-pages

// This is used when GitHub Pages serves a 404 for a non-root path
// It saves the URL and redirects to the homepage
// The script in index.html then restores the URL

(function() {
  var segmentCount = 0;
  var location = window.location;
  var redirect = sessionStorage.redirect;
  delete sessionStorage.redirect;
  
  if (redirect && redirect !== location.href) {
    history.replaceState(null, null, redirect);
  }
})(); 