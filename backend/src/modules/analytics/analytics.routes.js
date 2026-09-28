const express = require('express');
const analyticsController = require('./analytics.controller');
const { requireAuth } = require('../../middleware/auth.middleware');
const { requireBusiness } = require('../../middleware/business.middleware');

const router = express.Router();

router.get('/', requireAuth, requireBusiness, analyticsController.getAnalytics);

module.exports = router;