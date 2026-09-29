'use strict';

const aiService = require('./ai.service');
const { ApiError } = require('../../utils/errors');

async function ask(req, res) {
  const result = await aiService.ask(req.business, req.user, req.body.question);
  res.status(200).json({ success: true, data: result });
}

async function growthStrategy(req, res) {
  const result = await aiService.growthStrategy(req.business, req.user, req.body.goal);
  res.status(200).json({ success: true, data: result });
}

async function productAnalysis(req, res) {
  const { productId, question } = req.body;

  // Verify the product belongs to this business (IDOR guard — AI.md §17, §71)
  const Product = require('../../models/Product');
  const mongoose = require('mongoose');
  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'productId must be a valid ObjectId');
  }
  const product = await Product.findOne({ _id: productId, businessId: req.businessId });
  if (!product) {
    throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
  }

  const result = await aiService.productAnalysis(req.business, req.user, productId, question);
  res.status(200).json({ success: true, data: result });
}

async function businessSummary(req, res) {
  const { period } = req.body;
  const result = await aiService.businessSummary(req.business, req.user, period);
  res.status(200).json({ success: true, data: result });
}

module.exports = { ask, growthStrategy, productAnalysis, businessSummary };
