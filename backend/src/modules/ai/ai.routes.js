'use strict';

const express = require('express');
const aiController = require('./ai.controller');
const { askSchema, growthStrategySchema, productAnalysisSchema, summarySchema } = require('./ai.validation');
const { requireAuth } = require('../../middleware/auth.middleware');
const { requireBusiness } = require('../../middleware/business.middleware');
const { validate } = require('../../middleware/validate.middleware');

const router = express.Router();

// All AI routes require authentication and an identified business
router.use(requireAuth, requireBusiness);

router.post('/ask', validate(askSchema), aiController.ask);
router.post('/growth-strategy', validate(growthStrategySchema), aiController.growthStrategy);
router.post('/product-analysis', validate(productAnalysisSchema), aiController.productAnalysis);
router.post('/summary', validate(summarySchema), aiController.businessSummary);

module.exports = router;
