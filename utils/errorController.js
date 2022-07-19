const errorController = (err, req, res, next) => {
  const error = { ...err };
  error.stack = err.stack;
  error.statusCode = err.statusCode || 500;
  error.status = err.status || 'error';
  error.message = err.message || 'sory, something went very wrong';

  res.status(error.statusCode).json({
    status: error.status,
    statusCode: err.statusCode,
    message: err.message,
    stack: error.stack,
  });
};

module.exports = errorController;
