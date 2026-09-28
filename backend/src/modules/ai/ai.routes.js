const express = require('express');
const aiController = require('./ai.controller');
const { askSchema, growthStrategySchema } = require('./ai.validation');
const { requireAuth } = require('../../middleware/auth.middleware');
const { requireBusiness } = require('../../middleware/business.middleware');
const { validate } = require('../../middleware/validate.middleware');

const router = express.Router();

router.use(requireAuth, requireBusiness);
router.post('/ask', validate(askSchema), aiController.ask);
router.post('/growth-strategy', validate(growthStrategySchema), aiController.growthStrategy);

module.exports = router;