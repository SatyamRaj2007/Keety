const salesService = require('./sales.service');

async function createSale(req, res) {
  const sale = await salesService.createSale(req.businessId, req.body);
  res.status(201).json({ success: true, data: { sale } });
}

async function listSales(req, res) {
  const result = await salesService.listSales(req.businessId, req.query);
  res.status(200).json({ success: true, data: result });
}

async function getSale(req, res) {
  const sale = await salesService.getSale(req.businessId, req.params.id);
  res.status(200).json({ success: true, data: { sale } });
}

module.exports = { createSale, getSale, listSales };