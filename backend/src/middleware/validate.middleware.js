const { ApiError } = require('../utils/errors');

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`)
        .join('; ');
      return next(new ApiError(400, 'VALIDATION_ERROR', message));
    }

    req.body = result.data;
    return next();
  };
}

module.exports = { validate };