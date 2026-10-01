// Central error handler. Any error passed to next(err) ends up here.
function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || "Something went wrong on the server.",
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
