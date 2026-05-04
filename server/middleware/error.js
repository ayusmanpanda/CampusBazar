// Global error handler. Express recognises 4-arg signature.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error('[error]', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && err.stack ? { stack: err.stack } : {})
  });
}

function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

module.exports = { errorHandler, notFound };
