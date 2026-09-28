const productsService = require('./products.service');

async function createProduct(req, res) {
  const product = await productsService.createProduct(req.businessId, req.body);
  res.status(201).json({ success: true, data: { product } });
}

async function listProducts(req, res) {
  const result = await productsService.listProducts(req.businessId, req.query);
  res.status(200).json({ success: true, data: result });
}

async function getProduct(req, res) {
  const product = await productsService.getProduct(req.businessId, req.params.id);
  res.status(200).json({ success: true, data: { product } });
}

async function updateProduct(req, res) {
  const product = await productsService.updateProduct(req.businessId, req.params.id, req.body);
  res.status(200).json({ success: true, data: { product } });
}

async function deleteProduct(req, res) {
  await productsService.deleteProduct(req.businessId, req.params.id);
  res.status(200).json({ success: true, data: { deleted: true } });
}

module.exports = { createProduct, deleteProduct, getProduct, listProducts, updateProduct };