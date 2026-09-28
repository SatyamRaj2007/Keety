const jwt = require('jsonwebtoken');
const { getEnv } = require('../config/env');

function createToken(user) {
  const env = getEnv();
  return jwt.sign({ role: user.role }, env.JWT_SECRET, {
    subject: user.id,
    expiresIn: env.JWT_EXPIRES_IN
  });
}

module.exports = { createToken };