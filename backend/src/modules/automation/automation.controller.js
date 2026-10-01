const automationService = require('./automation.service');

async function createAutomation(req, res) {
  const automation = await automationService.createAutomation(req.businessId, req.user._id, req.body);
  res.status(201).json({ success: true, data: { automation } });
}

async function listAutomations(req, res) {
  const automations = await automationService.listAutomations(req.businessId);
  res.status(200).json({ success: true, data: { automations } });
}

async function getAutomation(req, res) {
  const automation = await automationService.getAutomation(req.businessId, req.params.id);
  res.status(200).json({ success: true, data: { automation } });
}

async function enqueueAutomationRun(req, res) {
  const { run, duplicate } = await automationService.enqueueAutomationRun(req.businessId, req.params.id, {
    ...req.body,
    userId: req.user._id
  });

  res.status(duplicate ? 200 : 201).json({ success: true, data: { run } });
}

async function listRuns(req, res) {
  const runs = await automationService.listRuns(req.businessId, req.query);
  res.status(200).json({ success: true, data: { runs } });
}

async function getRun(req, res) {
  const run = await automationService.getRun(req.businessId, req.params.id);
  res.status(200).json({ success: true, data: { run } });
}

module.exports = {
  createAutomation,
  listAutomations,
  getAutomation,
  enqueueAutomationRun,
  listRuns,
  getRun
};
