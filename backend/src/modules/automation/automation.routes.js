const express = require('express');
const controller = require('./automation.controller');
const { createAutomationSchema, runAutomationSchema } = require('./automation.validation');
const { requireAuth } = require('../../middleware/auth.middleware');
const { requireBusiness } = require('../../middleware/business.middleware');
const { validate } = require('../../middleware/validate.middleware');

const router = express.Router();

router.use(requireAuth, requireBusiness);

router.route('/')
  .post(validate(createAutomationSchema), controller.createAutomation)
  .get(controller.listAutomations);

router.route('/definitions')
  .post(validate(createAutomationSchema), controller.createAutomation)
  .get(controller.listAutomations);

router.route('/definitions/:id')
  .get(controller.getAutomation);

router.route('/definitions/:id/run')
  .post(validate(runAutomationSchema), controller.enqueueAutomationRun);

router.route('/runs')
  .get(controller.listRuns);

router.route('/runs/:id')
  .get(controller.getRun);

module.exports = router;
