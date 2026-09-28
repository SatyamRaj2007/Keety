const { GoogleGenerativeAI } = require('@google/generative-ai');
const AILog = require('../../models/AILog');
const { getEnv } = require('../../config/env');
const { ApiError } = require('../../utils/errors');
const analyticsService = require('../analytics/analytics.service');

async function generateBusinessResponse({ business, user, prompt, requestType }) {
  const env = getEnv();
  if (!env.GEMINI_API_KEY) {
    throw new ApiError(503, 'AI_SERVICE_UNAVAILABLE', 'KEETY AI is not configured yet');
  }

  const analytics = await analyticsService.getAnalytics(business._id, {});
  const context = {
    business: { name: business.name, type: business.businessType, currency: business.currency },
    analytics: {
      revenue: analytics.revenue,
      salesCount: analytics.salesCount,
      averageOrderValue: analytics.averageOrderValue,
      growthPercent: analytics.growthPercent,
      topProducts: analytics.topProducts,
      lowStockProducts: analytics.lowStockProducts,
      expenseSummary: analytics.expenseSummary,
      customerSummary: analytics.customerSummary
    },
    prompt
  };
  const systemInstruction = [
    'You are KEETY, a practical business intelligence assistant.',
    'Use only facts in the supplied JSON. Never invent metrics or claim missing data exists.',
    'Separate verified facts from interpretations and recommendations.',
    'If the data is insufficient, say so clearly. Respect the business type.',
    'Return concise plain text, not JSON.'
  ].join(' ');
  const startedAt = Date.now();

  try {
    const model = new GoogleGenerativeAI(env.GEMINI_API_KEY).getGenerativeModel({
      model: env.GEMINI_MODEL,
      systemInstruction
    });
    const result = await model.generateContent(JSON.stringify(context));
    const response = result.response.text().trim();

    if (!response) throw new Error('The AI provider returned an empty response');

    await AILog.create({
      businessId: business._id,
      userId: user._id,
      requestType,
      userPrompt: prompt,
      context,
      response,
      model: env.GEMINI_MODEL,
      latencyMs: Date.now() - startedAt,
      status: 'SUCCESS'
    });
    return { answer: response, insights: [], recommendations: [] };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(503, 'AI_SERVICE_UNAVAILABLE', 'KEETY AI is temporarily unavailable. Please try again.');
  }
}

async function ask(business, user, question) {
  return generateBusinessResponse({ business, user, prompt: question, requestType: 'ASK' });
}

async function growthStrategy(business, user, goal) {
  return generateBusinessResponse({
    business,
    user,
    prompt: `Create a practical growth strategy for this goal: ${goal}`,
    requestType: 'GROWTH_STRATEGY'
  });
}

module.exports = { ask, growthStrategy };