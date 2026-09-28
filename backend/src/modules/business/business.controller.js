const businessService = require('./business.service');

async function createBusiness(req, res) {
  const business = await businessService.createBusiness(req.user, req.body);
  res.status(201).json({ success: true, data: { business } });
}

async function getBusiness(req, res) {
  const business = await businessService.getBusiness(req.params.id, req.user._id);
  res.status(200).json({ success: true, data: { business } });
}

async function updateBusiness(req, res) {
  const business = await businessService.updateBusiness(req.business, req.body);
  res.status(200).json({ success: true, data: { business } });
}

module.exports = { createBusiness, getBusiness, updateBusiness };