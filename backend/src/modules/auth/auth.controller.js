const authService = require('./auth.service');

async function register(req, res) {
  const result = await authService.register(req.body);
  res.status(201).json({ success: true, data: result });
}

async function login(req, res) {
  const result = await authService.login(req.body);
  res.status(200).json({ success: true, data: result });
}

function getCurrentUser(req, res) {
  res.status(200).json({
    success: true,
    data: { user: authService.toPublicUser(req.user) }
  });
}

module.exports = { getCurrentUser, login, register };