const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const { ApiError } = require('../../utils/errors');
const { createToken } = require('../../utils/jwt');

function toPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    businessIds: user.businessIds,
    createdAt: user.createdAt
  };
}

async function register({ name, email, password }) {
  const normalizedEmail = email.toLowerCase();
  const existingUser = await User.exists({ email: normalizedEmail });

  if (existingUser) {
    throw new ApiError(409, 'EMAIL_IN_USE', 'An account with this email already exists');
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    passwordHash: await bcrypt.hash(password, 12)
  });

  return { user: toPublicUser(user), token: createToken(user) };
}

async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  const passwordMatches = user && await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches || !user.isActive) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect');
  }

  user.lastLoginAt = new Date();
  await user.save();

  return { user: toPublicUser(user), token: createToken(user) };
}

module.exports = { login, register, toPublicUser };