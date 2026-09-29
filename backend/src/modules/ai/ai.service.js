'use strict';

/**
 * ai.service.js — KEETY AI orchestration layer
 *
 * Architecture (AI.md §4, §5, §123):
 *   User prompt
 *     → Context assembly (deterministic business data)
 *     → Gemini call (interpretation + explanation)
 *     → Output validation (structured JSON parsing)
 *     → AILog persistence (success or failure)
 *     → Structured response to controller
 *
 * Golden rules enforced here (AI.md §155):
 *   1. Database is the source of truth — numbers come from analytics service.
 *   2. Backend is the security boundary — tenant scoping in assembleContext.
 *   3. AI explains; deterministic systems verify.
 *   5. Never fabricate missing business information.
 *   9. AI failure must be safe and honest.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const AILog = require('../../models/AILog');
const { getEnv } = require('../../config/env');
const { ApiError } = require('../../utils/errors');
const { assembleContext } = require('./ai.context');
const { PROMPT_VERSION, getSystemInstruction, buildUserMessage } = require('./ai.prompts');
const { parseAndValidateOutput } = require('./ai.output');

// ─── Core orchestrator ─────────────────────────────────────────────────────

/**
 * @param {object}  opts
 * @param {object}  opts.business      - req.business (Mongoose doc, ownership already verified)
 * @param {object}  opts.user          - req.user
 * @param {string}  opts.prompt        - The user-provided text prompt
 * @param {'ASK'|'GROWTH_STRATEGY'|'PRODUCT_ANALYSIS'|'SUMMARY'} opts.requestType
 * @param {string}  [opts.period]      - Analytics period override
 * @param {string}  [opts.productId]   - For PRODUCT_ANALYSIS requests
 */
async function generateResponse({ business, user, prompt, requestType, period, productId }) {
  const env = getEnv();

  // Respect business.settings.aiEnabled (AI.md §16, §105)
  if (business.settings && business.settings.aiEnabled === false) {
    throw new ApiError(403, 'AI_DISABLED', 'AI features are disabled for this business');
  }

  if (!env.GEMINI_API_KEY) {
    throw new ApiError(503, 'AI_SERVICE_UNAVAILABLE', 'KEETY AI is not configured yet');
  }

  // Map requestType enum → context type string used by assembleContext
  const contextType = {
    ASK: 'ask',
    GROWTH_STRATEGY: 'growth',
    PRODUCT_ANALYSIS: 'product',
    SUMMARY: 'summary'
  }[requestType] || 'ask';

  // 1. Assemble deterministic business context (AI.md §46, §56)
  let contextResult;
  try {
    contextResult = await assembleContext(business, contextType, { period, productId });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    console.error('[ai.service] assembleContext error:', err);
    throw new ApiError(500, 'CONTEXT_BUILD_ERROR', 'Could not assemble business context');
  }

  const { context } = contextResult;
  const systemInstruction = getSystemInstruction(contextType);
  const userMessage = buildUserMessage(context, prompt);
  const startedAt = Date.now();

  try {
    // 2. Call Gemini (AI.md §122 — use appropriate temperature for factual tasks)
    const model = new GoogleGenerativeAI(env.GEMINI_API_KEY).getGenerativeModel({
      model: env.GEMINI_MODEL,
      systemInstruction,
      generationConfig: {
        temperature: 0.3,      // Low temperature for factual business answers
        maxOutputTokens: 1500  // Bounded to control cost (AI.md §76, §97)
      }
    });

    const result = await model.generateContent(userMessage);
    const rawText = result.response.text();

    // 3. Parse and validate structured output (AI.md §51–§52)
    const validated = parseAndValidateOutput(rawText);

    // 4. Persist SUCCESS log (AI.md §58, §59, §102)
    await AILog.create({
      businessId: business._id,
      userId: user._id,
      requestType,
      userPrompt: prompt,
      context,
      response: validated.answer,
      model: env.GEMINI_MODEL,
      promptVersion: PROMPT_VERSION,
      latencyMs: Date.now() - startedAt,
      status: 'SUCCESS'
    });

    return validated;

  } catch (error) {
    if (error instanceof ApiError) throw error;

    // 5. Persist FAILED log (AI.md §58) — guard so log-write failure doesn't mask original error
    try {
      await AILog.create({
        businessId: business._id,
        userId: user._id,
        requestType,
        userPrompt: prompt,
        context,
        response: '',
        model: env.GEMINI_MODEL,
        promptVersion: PROMPT_VERSION,
        latencyMs: Date.now() - startedAt,
        status: 'FAILED'
      });
    } catch {
      // Non-fatal
    }

    throw new ApiError(503, 'AI_SERVICE_UNAVAILABLE', 'KEETY AI is temporarily unavailable. Please try again.');
  }
}

// ─── Public endpoint handlers ─────────────────────────────────────────────

/**
 * POST /ai/ask — answer a specific business question
 */
async function ask(business, user, question) {
  return generateResponse({ business, user, prompt: question, requestType: 'ASK' });
}

/**
 * POST /ai/growth-strategy — produce an evidence-based growth plan
 */
async function growthStrategy(business, user, goal) {
  return generateResponse({
    business,
    user,
    prompt: `Create a practical growth strategy for this business goal: ${goal}`,
    requestType: 'GROWTH_STRATEGY'
  });
}

/**
 * POST /ai/product-analysis — analyse a specific product (AI.md §126–§127)
 */
async function productAnalysis(business, user, productId, question) {
  const prompt = question
    ? `${question} (regarding this product)`
    : 'Analyse this product — its sales performance, inventory status, pricing signals, and what the business should consider.';

  return generateResponse({
    business,
    user,
    prompt,
    requestType: 'PRODUCT_ANALYSIS',
    productId
  });
}

/**
 * POST /ai/summary — generate a period business summary (AI.md §147 item 5)
 */
async function businessSummary(business, user, period) {
  return generateResponse({
    business,
    user,
    prompt: `Generate a concise ${period || 'monthly'} business performance summary. Highlight the most important signals, what changed, and what the business owner should pay attention to.`,
    requestType: 'SUMMARY',
    period: period || 'monthly'
  });
}

module.exports = { ask, growthStrategy, productAnalysis, businessSummary };
