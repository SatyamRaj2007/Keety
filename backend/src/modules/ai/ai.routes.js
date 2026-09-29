'use strict';

/**
 * ai.routes.js — AI endpoint definitions with dedicated rate limiting.
 *
 * AI.md §73: "AI requests are potentially expensive. Limit:
 *   - Requests per user
 *   - Requests per tenant
 *   - Concurrent generations"
 *
 * Two rate limiters are applied to generation endpoints:
 *   1. perIpAiLimiter   — 30 AI calls per IP per 15 min (abuse prevention)
 *   2. perUserAiLimiter — 20 AI calls per authenticated user per 15 min
 *
 * These limits are intentionally conservative for MVP. They should be tuned
 * once real usage patterns are measured (AI.md §73, §38).
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const aiController = require('./ai.controller');
const { askSchema, growthStrategySchema, productAnalysisSchema, summarySchema } = require('./ai.validation');
const { requireAuth } = require('../../middleware/auth.middleware');
const { requireBusiness } = require('../../middleware/business.middleware');
const { validate } = require('../../middleware/validate.middleware');

const router = express.Router();

// ─── Dedicated AI rate limiters ────────────────────────────────────────────

const AI_RATE_LIMIT_RESPONSE = {
  success: false,
  error: {
    code: 'AI_RATE_LIMIT_EXCEEDED',
    message: 'Too many AI requests. Please wait before trying again.'
  }
};

/** Per-IP limiter — first line of defence against anonymous abuse */
const perIpAiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: AI_RATE_LIMIT_RESPONSE,
  skip: (req) => req.method === 'GET'
});

/** Per-user limiter — prevents one authenticated user from exhausting the budget.
 *  Uses the user's MongoDB _id as the key when available (avoids IPv6 issues
 *  that arise from using raw req.ip as a fallback). */
const perUserAiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  limit: 20,
  keyGenerator: (req) => {
    // User is always set by requireAuth before this limiter runs on POST routes.
    // For the GET /history route this limiter is skipped entirely.
    return req.user?._id?.toString() ?? 'anonymous';
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'AI_RATE_LIMIT_EXCEEDED',
      message: 'You have made too many AI requests. Please wait a moment and try again.'
    }
  },
  skip: (req) => req.method === 'GET'
});

// ─── Route definitions ─────────────────────────────────────────────────────

// All AI routes require authentication + an identified business
router.use(requireAuth, requireBusiness);

// Generation endpoints — rate limited
router.post('/ask',
  perIpAiLimiter, perUserAiLimiter, validate(askSchema), aiController.ask
);
router.post('/growth-strategy',
  perIpAiLimiter, perUserAiLimiter, validate(growthStrategySchema), aiController.growthStrategy
);
router.post('/product-analysis',
  perIpAiLimiter, perUserAiLimiter, validate(productAnalysisSchema), aiController.productAnalysis
);
router.post('/summary',
  perIpAiLimiter, perUserAiLimiter, validate(summarySchema), aiController.businessSummary
);

// History endpoint — read-only, no generation rate limit (AI.md §59)
router.get('/history', aiController.getHistory);

module.exports = router;
