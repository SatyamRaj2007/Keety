function notFoundMiddleware(req, res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  error.code = 'NOT_FOUND';
  next(error);
}

function errorMiddleware(error, req, res, next) {
  let statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
  let code = error.code || 'INTERNAL_SERVER_ERROR';
  let errorMessage = error.message || 'An unexpected error occurred';

  if (error.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_RESOURCE';
    errorMessage = 'A record with this value already exists';
  } else if (error.name === 'ValidationError' || error.name === 'CastError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
  } else if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    statusCode = 400;
    code = 'INVALID_JSON';
    errorMessage = 'Request body must be valid JSON';
  }

  const message = statusCode >= 500 && process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred'
    : errorMessage;

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    error: { code, message }
  });
}

module.exports = { errorMiddleware, notFoundMiddleware };