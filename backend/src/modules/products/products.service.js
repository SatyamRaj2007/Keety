const mongoose = require('mongoose');
const Product = require('../../models/Product');
const { ApiError } = require('../../utils/errors');

function ensureProductId(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Product ID is invalid');
  }
}

async function createProduct(businessId, input) {
  return Product.create({ ...input, businessId });
}

async function listProducts(businessId, { page, limit, category, status, search }) {
  const safePage = Math.max(Number.parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 20, 1), 100);
  const filter = { businessId };

  if (category) filter.category = category;
  if (status) filter.status = status;
  if (typeof search === 'string' && search.length > 0) {
    const safeSearch = search.slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.name = { $regex: safeSearch, $options: 'i' };
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit),
    Product.countDocuments(filter)
  ]);

  return { products, pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) } };
}

async function getProduct(businessId, id) {
  ensureProductId(id);
  const product = await Product.findOne({ _id: id, businessId });
  if (!product) throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
  return product;
}

async function updateProduct(businessId, id, input) {
  ensureProductId(id);
  const product = await Product.findOneAndUpdate(
    { _id: id, businessId },
    { $set: input },
    { new: true, runValidators: true }
  );
  if (!product) throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
  return product;
}

async function deleteProduct(businessId, id) {
  ensureProductId(id);
  const product = await Product.findOneAndDelete({ _id: id, businessId });
  if (!product) throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
}

module.exports = { createProduct, deleteProduct, getProduct, listProducts, updateProduct };