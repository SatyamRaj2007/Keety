const express = require('express');
const customersController = require('./customers.controller');
const { createCustomerSchema, updateCustomerSchema } = require('./customers.validation');
const { requireAuth } = require('../../middleware/auth.middleware');
const { requireBusiness } = require('../../middleware/business.middleware');
const { validate } = require('../../middleware/validate.middleware');

const router = express.Router();

router.use(requireAuth, requireBusiness);
router.route('/')
  .post(validate(createCustomerSchema), customersController.createCustomer)
  .get(customersController.listCustomers);
router.route('/:id')
  .get(customersController.getCustomer)
  .patch(validate(updateCustomerSchema), customersController.updateCustomer)
  .delete(customersController.deleteCustomer);

module.exports = router;
