const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getEnv } = require('../config/env');
const { ApiError } = require('../utils/errors');

async function requireAuth(req, res, next) {
  const authorization = req.get('authorization');
  const [scheme, token] = authorization ? authorization.split(' ') : [];

  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'UNAUTHORIZED', 'A valid bearer token is required'));
  }

  try {
    const payload = jwt.verify(token, getEnv().JWT_SECRET);
    const user = await User.findById(payload.sub).select('_id role isActive businessIds');

    if (!user || !user.isActive) {
      return next(new ApiError(401, 'UNAUTHORIZED', 'The authenticated user is unavailable'));
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return next(new ApiError(401, 'UNAUTHORIZED', 'The bearer token is invalid or expired'));
    }

    return next(error);
  }
}

module.exports = { requireAuth };