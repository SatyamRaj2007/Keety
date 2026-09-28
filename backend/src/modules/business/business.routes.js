const express = require('express');
const businessController = require('./business.controller');
const { createBusinessSchema, updateBusinessSchema } = require('./business.validation');
const { requireAuth } = require('../../middleware/auth.middleware');
const { requireBusinessFromRouteParam } = require('../../middleware/business.middleware');
const { validate } = require('../../middleware/validate.middleware');

const router = express.Router();

router.use(requireAuth);
router.post('/', validate(createBusinessSchema), businessController.createBusiness);
router.get('/:id', requireBusinessFromRouteParam, businessController.getBusiness);
router.patch('/:id', requireBusinessFromRouteParam, validate(updateBusinessSchema), businessController.updateBusiness);

module.exports = router;