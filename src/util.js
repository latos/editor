exports.assert = function(truth, message) {
  if (!truth) {
    throw new Error(message || "Assertion Failed");
  }
};
