const express = require('express');
const productsController = require('./products.controller');
const { createProductSchema, updateProductSchema } = require('./products.validation');
const { requireAuth } = require('../../middleware/auth.middleware');
const { requireBusiness } = require('../../middleware/business.middleware');
const { validate } = require('../../middleware/validate.middleware');

const router = express.Router();

router.use(requireAuth, requireBusiness);
router.route('/')
  .post(validate(createProductSchema), productsController.createProduct)
  .get(productsController.listProducts);
router.route('/:id')
  .get(productsController.getProduct)
  .patch(validate(updateProductSchema), productsController.updateProduct)
  .delete(productsController.deleteProduct);

module.exports = router;