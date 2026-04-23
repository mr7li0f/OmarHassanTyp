(function () {
  var target = './public/index.html';
  var query = window.location.search || '';
  var hash = window.location.hash || '';
  window.location.replace(target + query + hash);
})();
