// Central error handler. Any error passed to next(err) ends up here.
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  // Only unexpected server errors deserve a full stack trace in the logs.
  if (status >= 500) console.error(err);

  res.status(status).json({
    success: false,
    // Never leak internal error details for unexpected failures.
    message: status >= 500 ? "Something went wrong on the server." : err.message,
  });
}

// Handles requests to routes that don't exist.
function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} was not found.`,
  });
}

module.exports = { errorHandler, notFound };
