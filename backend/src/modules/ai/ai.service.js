'use strict';

/**
 * ai.service.js — KEETY AI orchestration layer
 *
 * Architecture (AI.md §4, §5, §123):
 *   User prompt
 *     → Context assembly (deterministic business data, correct period)
 *     → Gemini call (interpretation + explanation)
 *     → Output validation (structured JSON parsing)
 *     → Token usage + cost tracking
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

// ─── Cost estimation ─────────────────────────────────────────────────────────

/**
 * Estimate USD cost from token counts.
 * Gemini 2.0 Flash pricing as of Sept 2026 (≤128K context):
 *   Input:  $0.075 / 1M tokens
 *   Output: $0.30  / 1M tokens
 * Per AI.md §75 — track cost; do not claim exact billing accuracy.
 */
function estimateCostUsd(inputTokens, outputTokens) {
  const inputCost  = (inputTokens  / 1_000_000) * 0.075;
  const outputCost = (outputTokens / 1_000_000) * 0.30;
  return Number((inputCost + outputCost).toFixed(8));
}

/**
 * Extract token counts from the Gemini SDK response object.
 * The SDK may or may not include usageMetadata depending on model / SDK version.
 */
function extractTokenUsage(geminiResult) {
  const meta = geminiResult?.response?.usageMetadata;
  if (!meta) return { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  const inputTokens  = meta.promptTokenCount     ?? 0;
  const outputTokens = meta.candidatesTokenCount ?? 0;
  const totalTokens  = meta.totalTokenCount       ?? (inputTokens + outputTokens);
  return { inputTokens, outputTokens, totalTokens };
}

// ─── Core orchestrator ─────────────────────────────────────────────────────

/**
 * @param {object}  opts
 * @param {object}  opts.business      - req.business (Mongoose doc, ownership already verified)
 * @param {object}  opts.user          - req.user
 * @param {string}  opts.prompt        - The user-provided text prompt
 * @param {'ASK'|'GROWTH_STRATEGY'|'PRODUCT_ANALYSIS'|'SUMMARY'} opts.requestType
 * @param {string}  [opts.period]      - Analytics period (daily/weekly/monthly) — AI.md §11
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

  // Normalise period — default to 'monthly' so it is always explicit (AI.md §11)
  const resolvedPeriod = period || 'monthly';

  // Map requestType enum → context type string used by assembleContext
  const contextType = {
    ASK: 'ask',
    GROWTH_STRATEGY: 'growth',
    PRODUCT_ANALYSIS: 'product',
    SUMMARY: 'summary'
  }[requestType] || 'ask';

  // 1. Assemble deterministic business context (AI.md §46, §56)
  //    Pass resolvedPeriod so the AI always analyses the period the user selected.
  let contextResult;
  try {
    contextResult = await assembleContext(business, contextType, {
      period: resolvedPeriod,
      productId
    });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    // Structured error — no raw stack in production; full err available for local debugging
    throw new ApiError(500, 'CONTEXT_BUILD_ERROR', 'Could not assemble business context');
  }

  const { context } = contextResult;
  const systemInstruction = getSystemInstruction(contextType);
  const userMessage = buildUserMessage(context, prompt);
  const startedAt = Date.now();

  try {
    // 2. Call Gemini (AI.md §122 — low temperature for factual business answers)
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

    // 4. Extract token usage and estimate cost (AI.md §74–§75)
    const tokenUsage = extractTokenUsage(result);
    const estimatedCostUsd = estimateCostUsd(tokenUsage.inputTokens, tokenUsage.outputTokens);

    // 5. Persist SUCCESS log (AI.md §58, §59, §102)
    await AILog.create({
      businessId: business._id,
      userId: user._id,
      requestType,
      period: resolvedPeriod,
      userPrompt: prompt,
      context,
      response: validated.answer,
      model: env.GEMINI_MODEL,
      promptVersion: PROMPT_VERSION,
      latencyMs: Date.now() - startedAt,
      status: 'SUCCESS',
      tokenUsage,
      estimatedCostUsd
    });

    return validated;

  } catch (error) {
    if (error instanceof ApiError) throw error;

    // 6. Persist FAILED log so every provider error is observable (AI.md §58)
    //    Guard with its own try/catch — a log-write failure must not mask the original error.
    try {
      await AILog.create({
        businessId: business._id,
        userId: user._id,
        requestType,
        period: resolvedPeriod,
        userPrompt: prompt,
        context,
        response: '',
        model: env.GEMINI_MODEL,
        promptVersion: PROMPT_VERSION,
        latencyMs: Date.now() - startedAt,
        status: 'FAILED',
        tokenUsage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        estimatedCostUsd: 0
      });
    } catch {
      // Non-fatal — the original error still propagates below.
    }

    throw new ApiError(503, 'AI_SERVICE_UNAVAILABLE', 'KEETY AI is temporarily unavailable. Please try again.');
  }
}

// ─── Public endpoint handlers ──────────────────────────────────────────────

/**
 * POST /ai/ask — answer a specific business question.
 * Accepts an optional `period` so the context matches what the user is viewing (AI.md §11).
 */
async function ask(business, user, question, period) {
  return generateResponse({ business, user, prompt: question, requestType: 'ASK', period });
}

/**
 * POST /ai/growth-strategy — produce an evidence-based growth plan.
 * Accepts an optional `period` so strategy is anchored to the correct window (AI.md §11).
 */
async function growthStrategy(business, user, goal, period) {
  return generateResponse({
    business,
    user,
    prompt: `Create a practical growth strategy for this business goal: ${goal}`,
    requestType: 'GROWTH_STRATEGY',
    period
  });
}

/**
 * POST /ai/product-analysis — analyse a specific product (AI.md §126–§127)
 */
async function productAnalysis(business, user, productId, question, period) {
  const prompt = question
    ? `${question} (regarding this product)`
    : 'Analyse this product — its sales performance, inventory status, pricing signals, and what the business should consider.';

  return generateResponse({
    business,
    user,
    prompt,
    requestType: 'PRODUCT_ANALYSIS',
    period,
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
