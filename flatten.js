/**
 * Copied from https://github.com/hughsk/flat
 * copied to enable use on client
 */

 function isBuffer(value) {
  if (typeof Buffer === 'undefined') return false;
  return Buffer.isBuffer(value);
}

 flatten = function flatten(target, opts) {
  opts = opts || {};

  var delimiter = opts.delimiter || '.';
  var maxDepth = opts.maxDepth;
  var currentDepth = 1;
  var output = {};

  function step(object, prev) {
    Object.keys(object).forEach(function(key) {
      var value = object[key];
      var isarray = opts.safe && Array.isArray(value);
      var type = Object.prototype.toString.call(value);
      var isbuffer = isBuffer(value);
      var isobject = (
        type === "[object Object]" ||
        type === "[object Array]"
      );

      var newKey = prev ? prev + delimiter + key : key;

      if (!opts.maxDepth) {
        maxDepth = currentDepth + 1;
      }

      if (!isarray && !isbuffer && isobject && Object.keys(value).length && currentDepth < maxDepth) {
        ++currentDepth;
        return step(value, newKey);
      }

      output[newKey] = value;
    });
  }

  step(target);

  return output;
};