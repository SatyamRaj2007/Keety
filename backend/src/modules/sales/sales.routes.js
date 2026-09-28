const express = require('express');
const salesController = require('./sales.controller');
const { createSaleSchema } = require('./sales.validation');
const { requireAuth } = require('../../middleware/auth.middleware');
const { requireBusiness } = require('../../middleware/business.middleware');
const { validate } = require('../../middleware/validate.middleware');

const router = express.Router();

router.use(requireAuth, requireBusiness);
router.post('/', validate(createSaleSchema), salesController.createSale);
router.get('/', salesController.listSales);
router.get('/:id', salesController.getSale);

module.exports = router;