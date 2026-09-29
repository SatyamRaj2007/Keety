'use strict';

const mongoose = require('mongoose');

/**
 * AILog — persists every AI request for traceability, observability, and cost tracking.
 *
 * AI.md §58: "Log enough information to debug AI behavior."
 * AI.md §74: "tenant → AI requests → tokens → cost"
 * AI.md §59: "A production AI request should be traceable."
 */
const aiLogSchema = new mongoose.Schema({
  businessId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requestType:   { type: String, required: true, enum: ['ASK', 'GROWTH_STRATEGY', 'PRODUCT_ANALYSIS', 'SUMMARY'] },
  period:        { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'monthly' },
  userPrompt:    { type: String, required: true, maxlength: 2000 },
  context:       { type: mongoose.Schema.Types.Mixed, default: {} },
  response:      { type: String, default: '' },
  model:         { type: String, default: '' },
  promptVersion: { type: String, default: '' },
  latencyMs:     { type: Number, min: 0, default: 0 },
  status:        { type: String, enum: ['SUCCESS', 'FAILED'], required: true },

  // Token usage for cost tracking (AI.md §74–§75)
  tokenUsage: {
    inputTokens:  { type: Number, min: 0, default: 0 },
    outputTokens: { type: Number, min: 0, default: 0 },
    totalTokens:  { type: Number, min: 0, default: 0 }
  },
  // Estimated cost in USD at Gemini 2.0 Flash pricing (AI.md §75)
  estimatedCostUsd: { type: Number, min: 0, default: 0 }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  collection: 'ai_logs'
});

// Primary access: list a business's AI history newest-first
aiLogSchema.index({ businessId: 1, createdAt: -1 });
// Cost/usage analytics per business
aiLogSchema.index({ businessId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.models.AILog || mongoose.model('AILog', aiLogSchema);
