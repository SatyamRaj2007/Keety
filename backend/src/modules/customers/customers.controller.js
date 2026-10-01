const customersService = require('./customers.service');

async function createCustomer(req, res) {
  const customer = await customersService.createCustomer(req.businessId, req.body);
  res.status(201).json({ success: true, data: { customer } });
}

async function listCustomers(req, res) {
  const result = await customersService.listCustomers(req.businessId, req.query);
  res.status(200).json({ success: true, data: result });
}

async function getCustomer(req, res) {
  const customer = await customersService.getCustomer(req.businessId, req.params.id);
  res.status(200).json({ success: true, data: { customer } });
}

async function updateCustomer(req, res) {
  const customer = await customersService.updateCustomer(req.businessId, req.params.id, req.body);
  res.status(200).json({ success: true, data: { customer } });
}

async function deleteCustomer(req, res) {
  await customersService.deleteCustomer(req.businessId, req.params.id);
  res.status(200).json({ success: true, data: { deleted: true } });
}

module.exports = { createCustomer, deleteCustomer, getCustomer, listCustomers, updateCustomer };
