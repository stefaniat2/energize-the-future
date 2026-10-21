// Lets controllers be async functions: any thrown error or rejected promise goes to the
// Express error handler instead of becoming an unhandled rejection.
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { asyncHandler };
