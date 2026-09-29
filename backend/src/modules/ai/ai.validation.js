'use strict';

const { z } = require('zod');

const VALID_PERIODS = ['daily', 'weekly', 'monthly'];

const askSchema = z.object({
  question: z.string().trim().min(3).max(1000)
}).strict();

const growthStrategySchema = z.object({
  goal: z.string().trim().min(3).max(500)
}).strict();

const productAnalysisSchema = z.object({
  productId: z.string().regex(/^[a-f\d]{24}$/i, 'productId must be a valid ObjectId'),
  question: z.string().trim().min(3).max(500).optional()
}).strict();

const summarySchema = z.object({
  period: z.enum(VALID_PERIODS).optional().default('monthly')
}).strict();

module.exports = { askSchema, growthStrategySchema, productAnalysisSchema, summarySchema };
