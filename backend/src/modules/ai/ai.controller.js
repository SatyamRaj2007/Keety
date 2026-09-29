'use strict';

const mongoose = require('mongoose');
const Product = require('../../models/Product');
const AILog = require('../../models/AILog');
const aiService = require('./ai.service');
const { ApiError } = require('../../utils/errors');

// ─── Generation handlers ───────────────────────────────────────────────────

async function ask(req, res) {
  const { question, period } = req.body;
  const result = await aiService.ask(req.business, req.user, question, period);
  res.status(200).json({ success: true, data: result });
}

async function growthStrategy(req, res) {
  const { goal, period } = req.body;
  const result = await aiService.growthStrategy(req.business, req.user, goal, period);
  res.status(200).json({ success: true, data: result });
}

async function productAnalysis(req, res) {
  const { productId, question, period } = req.body;

  // IDOR guard — the product must belong to this business (AI.md §17, §71)
  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'productId must be a valid ObjectId');
  }
  const product = await Product.findOne({ _id: productId, businessId: req.businessId });
  if (!product) {
    throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
  }

  const result = await aiService.productAnalysis(req.business, req.user, productId, question, period);
  res.status(200).json({ success: true, data: result });
}

async function businessSummary(req, res) {
  const { period } = req.body;
  const result = await aiService.businessSummary(req.business, req.user, period);
  res.status(200).json({ success: true, data: result });
}

// ─── History handler (AI.md §59 — traceability) ────────────────────────────

/**
 * GET /ai/history
 * Returns the AI request log for the authenticated business.
 * Per AI.md §59: "A production AI request should be traceable."
 *
 * Query params:
 *   page      number (default 1)
 *   limit     number (default 20, max 50)
 *   status    'SUCCESS' | 'FAILED'
 *   type      requestType filter
 */
async function getHistory(req, res) {
  const page  = Math.max(Number.parseInt(req.query.page,  10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 50);

  const filter = { businessId: req.businessId };
  if (req.query.status && ['SUCCESS', 'FAILED'].includes(req.query.status)) {
    filter.status = req.query.status;
  }
  if (req.query.type && ['ASK', 'GROWTH_STRATEGY', 'PRODUCT_ANALYSIS', 'SUMMARY'].includes(req.query.type)) {
    filter.requestType = req.query.type;
  }

  const [logs, total] = await Promise.all([
    AILog.find(filter)
      .select('-context')           // omit the full context blob — can be large
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    AILog.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    data: {
      logs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    }
  });
}

module.exports = { ask, growthStrategy, productAnalysis, businessSummary, getHistory };
