var Q = require('q');
var jsdom = require('jsdom');

exports.dom = function dom(html, func) {
  var deferred = Q.defer();

  jsdom.env({
      html: html, 
      done: function(err, win) { 
        if (err) {
          deferred.reject(err);
          return;
        }

        deferred.resolve(win.document.body.firstChild);
      }
  });

  return func ? deferred.promise.then(func) : deferred.promise;
}

exports.promised = function promised(func) {
  return function(done) {
    (func() || Q.resolve())
    .then(done)
    .catch(function(err) {
      done(err);
    })
  };
}

