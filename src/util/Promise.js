var Promise = require('mpromise');

Promise.when = function when() {
  var count = arguments.length;
  var promise = new Promise();
  var results = {};

  Array.prototype.slice.call(arguments).forEach(function(argument, index) {
    if (argument instanceof Promise) {
      argument.onResolve(function(err, item) {
        if (err) return promise.reject(err, results);
        results[index] = item;
        if (count === Object.keys(results).length) {
          promise.fulfill(results);
        }
      })
    } else {
      count--;
      if (count === Object.keys(results).length) {
        promise.fulfill(results);
      }
    }
  });

  return promise;
};

module.exports = Promise;