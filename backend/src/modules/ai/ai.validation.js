'use strict';

/**
 * ai.validation.js — Zod input schemas for all AI endpoints.
 * All schemas accept an optional `period` so context is anchored to the
 * correct analytics window (AI.md §11).
 */

const { z } = require('zod');

const VALID_PERIODS = ['daily', 'weekly', 'monthly'];

const askSchema = z.object({
  question: z.string().trim().min(3).max(1000),
  period:   z.enum(VALID_PERIODS).optional().default('monthly')
}).strict();

const growthStrategySchema = z.object({
  goal:   z.string().trim().min(3).max(500),
  period: z.enum(VALID_PERIODS).optional().default('monthly')
}).strict();

const productAnalysisSchema = z.object({
  productId: z.string().regex(/^[a-f\d]{24}$/i, 'productId must be a valid ObjectId'),
  question:  z.string().trim().min(3).max(500).optional(),
  period:    z.enum(VALID_PERIODS).optional().default('monthly')
}).strict();

const summarySchema = z.object({
  period: z.enum(VALID_PERIODS).optional().default('monthly')
}).strict();

module.exports = { askSchema, growthStrategySchema, productAnalysisSchema, summarySchema };
