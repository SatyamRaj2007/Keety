const express = require('express');
const authController = require('./auth.controller');
const { loginSchema, registerSchema } = require('./auth.validation');
const { requireAuth } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');

const router = express.Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', requireAuth, authController.getCurrentUser);

module.exports = router;