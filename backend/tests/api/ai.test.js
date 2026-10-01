'use strict';

/**
 * API integration tests — /api/ai
 *
 * The Gemini SDK is monkey-patched at the module level before the app
 * is imported so the stub is in place for all test cases.  Tests cover:
 *   - validation (ask / growth-strategy schemas)
 *   - missing API key → 503
 *   - Gemini error → controlled 503
 *   - empty Gemini response → controlled 503
 *   - successful response shape and AILog persistence
 *   - business-context isolation (only the requesting business's data is used)
 *   - auth / business guards
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

// ---------------------------------------------------------------------------
// Stub GEMINI SDK before any application code imports it.
// The ai.service module imports GoogleGenerativeAI at require time, so we
// must patch the exports object that is already in the cache.
// ---------------------------------------------------------------------------
const generativeAiModule = require('@google/generative-ai');

let _geminiImpl = null; // set per-test via setGemini / failGemini
let _geminiRequestOptions = null;

generativeAiModule.GoogleGenerativeAI = class {
  getGenerativeModel(_modelParams, requestOptions) {
    _geminiRequestOptions = requestOptions;
    return {
      generateContent: async (payload) => {
        if (!_geminiImpl) throw new Error('Gemini stub not configured');
        return _geminiImpl(payload);
      }
    };
  }
};

function setGemini(text) {
  _geminiImpl = async () => ({ response: { text: () => text } });
}

function failGemini(error) {
  _geminiImpl = async () => { throw error; };
}

function captureGemini(onCall) {
  _geminiImpl = async (payload) => {
    onCall(payload);
    return { response: { text: () => 'Captured response' } };
  };
}

// ---------------------------------------------------------------------------
// Now load app & helpers
// ---------------------------------------------------------------------------
const { createApp } = require('../../src/app');
const { startDb, stopDb, clearDb } = require('../helpers/db');
const { makeUserWithBusiness, makeProduct, makeSale } = require('../helpers/factories');
const { ingestDocument } = require('../../src/modules/rag/rag.service');

process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';
process.env.JWT_EXPIRES_IN = '7d';
process.env.MONGODB_URI = 'placeholder';

const app = createApp();

test.before(startDb);
test.after(stopDb);
test.beforeEach(clearDb);

function authHeaders(token, businessId) {
  return {
    Authorization: `Bearer ${token}`,
    'x-business-id': String(businessId)
  };
}

// ---------------------------------------------------------------------------
// POST /api/ai/ask — input validation
// ---------------------------------------------------------------------------

test('POST /ai/ask — 400 VALIDATION_ERROR when question is below minimum length', async () => {
  const { token, business } = await makeUserWithBusiness();
  setGemini('ok');

  const res = await request(app)
    .post('/api/ai/ask')
    .set(authHeaders(token, business._id))
    .send({ question: 'Hi' }); // < 3 chars

  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('POST /ai/ask — 400 VALIDATION_ERROR when question exceeds maximum length', async () => {
  const { token, business } = await makeUserWithBusiness();
  setGemini('ok');

  const res = await request(app)
    .post('/api/ai/ask')
    .set(authHeaders(token, business._id))
    .send({ question: 'a'.repeat(1001) });

  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('POST /ai/ask — 400 VALIDATION_ERROR when question field is missing', async () => {
  const { token, business } = await makeUserWithBusiness();
  const res = await request(app)
    .post('/api/ai/ask')
    .set(authHeaders(token, business._id))
    .send({});
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

// ---------------------------------------------------------------------------
// POST /api/ai/ask — missing API key
// ---------------------------------------------------------------------------

test('POST /ai/ask — 503 AI_SERVICE_UNAVAILABLE when GEMINI_API_KEY is not set', async () => {
  const { token, user, business } = await makeUserWithBusiness();
  const saved = process.env.GEMINI_API_KEY;
  const savedNodeEnv = process.env.NODE_ENV;
  process.env.GEMINI_API_KEY = '';
  process.env.NODE_ENV = 'production';

  try {
    const res = await request(app)
      .post('/api/ai/ask')
      .set(authHeaders(token, business._id))
      .send({ question: 'How is my business doing?' });

    assert.equal(res.status, 503);
    assert.equal(res.body.error.code, 'AI_SERVICE_UNAVAILABLE');
    assert.equal(res.body.error.message, 'KEETY AI is not configured yet');

    const AILog = require('../../src/models/AILog');
    const failedLog = await AILog.findOne({ businessId: business._id, requestType: 'ASK', status: 'FAILED' });
    assert.ok(failedLog, 'missing provider configuration should be visible in AI history');
    assert.equal(String(failedLog.userId), String(user._id));
  } finally {
    process.env.GEMINI_API_KEY = saved || '';
    process.env.NODE_ENV = savedNodeEnv;
  }
});

// ---------------------------------------------------------------------------
// POST /api/ai/ask — Gemini failure scenarios
// ---------------------------------------------------------------------------

test('POST /ai/ask — 503 AI_SERVICE_UNAVAILABLE when Gemini throws a network error', async () => {
  process.env.GEMINI_API_KEY = 'test-key';
  failGemini(new Error('Network timeout'));

  const { token, business } = await makeUserWithBusiness();
  const res = await request(app)
    .post('/api/ai/ask')
    .set(authHeaders(token, business._id))
    .send({ question: 'How are my sales trending?' });

  assert.equal(res.status, 503);
  assert.equal(res.body.error.code, 'AI_SERVICE_UNAVAILABLE');
  // Must not leak internal error details to the client.
  assert.ok(!JSON.stringify(res.body).toLowerCase().includes('network timeout'));
});

test('POST /ai/ask — Gemini rate limits return a safe unavailable response', async () => {
  process.env.GEMINI_API_KEY = 'test-key';
  failGemini(new Error('429 RESOURCE_EXHAUSTED: quota exceeded'));

  const { token, business } = await makeUserWithBusiness();
  const res = await request(app)
    .post('/api/ai/ask')
    .set(authHeaders(token, business._id))
    .send({ question: 'Summarise my monthly sales.' });

  assert.equal(res.status, 503);
  assert.equal(res.body.error.code, 'AI_SERVICE_UNAVAILABLE');
  assert.ok(!JSON.stringify(res.body).includes('RESOURCE_EXHAUSTED'));
});

test('POST /ai/ask — 503 AI_SERVICE_UNAVAILABLE when Gemini returns an empty response', async () => {
  process.env.GEMINI_API_KEY = 'test-key';
  setGemini(''); // empty string triggers the guard in ai.service

  const { token, business } = await makeUserWithBusiness();
  const res = await request(app)
    .post('/api/ai/ask')
    .set(authHeaders(token, business._id))
    .send({ question: 'What are my top products?' });

  assert.equal(res.status, 503);
  assert.equal(res.body.error.code, 'AI_SERVICE_UNAVAILABLE');
});

// ---------------------------------------------------------------------------
// POST /api/ai/ask — successful response
// ---------------------------------------------------------------------------

test('POST /ai/ask — 200 returns answer from Gemini and persists an AILog', async () => {
  process.env.GEMINI_API_KEY = 'test-key';
  setGemini('Your revenue is growing at 15% month-on-month.');

  const { token, business, user } = await makeUserWithBusiness();
  const res = await request(app)
    .post('/api/ai/ask')
    .set(authHeaders(token, business._id))
    .send({ question: 'How is my revenue growing?' });

  assert.equal(res.status, 200);
  assert.equal(res.body.data.answer, 'Your revenue is growing at 15% month-on-month.');
  assert.equal(_geminiRequestOptions.timeout, 30_000);

  const AILog = require('../../src/models/AILog');
  const log = await AILog.findOne({ businessId: business._id });
  assert.ok(log, 'AILog must be created on success');
  assert.equal(log.status, 'SUCCESS');
  assert.equal(log.requestType, 'ASK');
  assert.equal(String(log.userId), String(user._id));
});

test('POST /ai/ask — empty business data is passed as zero metrics, not invented facts', async () => {
  process.env.GEMINI_API_KEY = 'test-key';
  let capturedPayload = null;
  captureGemini((raw) => { capturedPayload = JSON.parse(raw); });

  const { token, business } = await makeUserWithBusiness();
  const res = await request(app)
    .post('/api/ai/ask')
    .set(authHeaders(token, business._id))
    .send({ question: 'How are my sales performing?' });

  assert.equal(res.status, 200);
  assert.equal(capturedPayload.businessContext.analytics.revenue, 0);
  assert.equal(capturedPayload.businessContext.analytics.salesCount, 0);
  assert.deepEqual(capturedPayload.businessContext.analytics.topProducts, []);
  assert.equal(capturedPayload.businessContext.capabilities.HAS_SALES, false);
});

test('POST /ai/summary — business figures match the analytics endpoint', async () => {
  process.env.GEMINI_API_KEY = 'test-key';
  let capturedPayload = null;
  captureGemini((raw) => { capturedPayload = JSON.parse(raw); });

  const { token, business } = await makeUserWithBusiness();
  const product = await makeProduct(business._id, { price: 321 });
  await makeSale(business._id, [{ product, quantity: 2 }]);
  const headers = authHeaders(token, business._id);
  const analytics = await request(app).get('/api/analytics?period=monthly').set(headers);
  const summary = await request(app)
    .post('/api/ai/summary')
    .set(headers)
    .send({ period: 'monthly' });

  assert.equal(summary.status, 200);
  assert.equal(capturedPayload.businessContext.analytics.revenue, analytics.body.data.revenue);
  assert.equal(capturedPayload.businessContext.analytics.salesCount, analytics.body.data.salesCount);
  assert.equal(capturedPayload.businessContext.analytics.averageOrderValue, analytics.body.data.averageOrderValue);
});

test('POST /ai/product-analysis — only analyzes a product owned by the active business', async () => {
  process.env.GEMINI_API_KEY = 'test-key';
  setGemini('Product analysis is available.');

  const owner = await makeUserWithBusiness();
  const ownedProduct = await makeProduct(owner.business._id, { name: 'Owned product' });
  const other = await makeUserWithBusiness();
  const foreignProduct = await makeProduct(other.business._id, { name: 'Foreign product' });
  const ownResponse = await request(app)
    .post('/api/ai/product-analysis')
    .set(authHeaders(owner.token, owner.business._id))
    .send({ productId: String(ownedProduct._id), period: 'monthly' });
  const foreignResponse = await request(app)
    .post('/api/ai/product-analysis')
    .set(authHeaders(owner.token, owner.business._id))
    .send({ productId: String(foreignProduct._id), period: 'monthly' });

  assert.equal(ownResponse.status, 200);
  assert.equal(foreignResponse.status, 404);
  assert.equal(foreignResponse.body.error.code, 'PRODUCT_NOT_FOUND');
});

test('POST /ai/ask — response never exposes raw Gemini error messages to the client', async () => {
  process.env.GEMINI_API_KEY = 'test-key';
  failGemini(new Error('SENSITIVE_INTERNAL_ERROR'));

  const { token, business } = await makeUserWithBusiness();
  const res = await request(app)
    .post('/api/ai/ask')
    .set(authHeaders(token, business._id))
    .send({ question: 'Tell me about my business.' });

  assert.ok(!JSON.stringify(res.body).includes('SENSITIVE_INTERNAL_ERROR'));
});

// ---------------------------------------------------------------------------
// POST /api/ai/growth-strategy — validation
// ---------------------------------------------------------------------------

test('POST /ai/growth-strategy — 400 VALIDATION_ERROR when goal is missing', async () => {
  const { token, business } = await makeUserWithBusiness();
  const res = await request(app)
    .post('/api/ai/growth-strategy')
    .set(authHeaders(token, business._id))
    .send({});
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('POST /ai/growth-strategy — 400 VALIDATION_ERROR when goal exceeds 500 chars', async () => {
  const { token, business } = await makeUserWithBusiness();
  const res = await request(app)
    .post('/api/ai/growth-strategy')
    .set(authHeaders(token, business._id))
    .send({ goal: 'g'.repeat(501) });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('POST /ai/growth-strategy — 200 returns answer when Gemini succeeds', async () => {
  process.env.GEMINI_API_KEY = 'test-key';
  setGemini('Expand your online presence to reach new customers.');

  const { token, business } = await makeUserWithBusiness();
  const res = await request(app)
    .post('/api/ai/growth-strategy')
    .set(authHeaders(token, business._id))
    .send({ goal: 'Double revenue in 6 months' });

  assert.equal(res.status, 200);
  assert.ok(res.body.data.answer);
});

test('POST /ai/growth-strategy — provider timeout returns a controlled unavailable response', async () => {
  process.env.GEMINI_API_KEY = 'test-key';
  failGemini(new Error('Provider request timed out'));

  const { token, business } = await makeUserWithBusiness();
  const res = await request(app)
    .post('/api/ai/growth-strategy')
    .set(authHeaders(token, business._id))
    .send({ goal: 'Improve repeat customer activity', period: 'monthly' });

  assert.equal(res.status, 503);
  assert.equal(res.body.error.code, 'AI_SERVICE_UNAVAILABLE');
  assert.ok(!JSON.stringify(res.body).includes('Provider request timed out'));
});

// ---------------------------------------------------------------------------
// Business-context isolation
// ---------------------------------------------------------------------------

test('POST /ai/ask — AI context includes only the requesting business\'s data', async () => {
  process.env.GEMINI_API_KEY = 'test-key';

  let capturedPayload = null;
  captureGemini((raw) => { capturedPayload = JSON.parse(raw); });

  const ctx1 = await makeUserWithBusiness();
  const ctx2 = await makeUserWithBusiness();
  // Give business B a high-value sale so its presence would stand out if leaked.
  const p2 = await makeProduct(ctx2.business._id, { price: 9999 });
  await makeSale(ctx2.business._id, [{ product: p2, quantity: 1 }]);

  await request(app)
    .post('/api/ai/ask')
    .set(authHeaders(ctx1.token, ctx1.business._id))
    .send({ question: 'Summarise my performance.' });

  assert.ok(capturedPayload, 'Gemini must have been called');
  assert.equal(capturedPayload.businessContext.business.name, ctx1.business.name, 'context must be for business A');
  assert.notEqual(capturedPayload.businessContext.business.name, ctx2.business.name, 'context must NOT reference business B');
  // Revenue from business B (9999) must not appear.
  assert.notEqual(capturedPayload.businessContext?.analytics?.revenue, 9999);
});

test('POST /ai/ask — includes relevant tenant-scoped business document evidence', async () => {
  process.env.GEMINI_API_KEY = 'test-key';

  let capturedPayload = null;
  captureGemini((raw) => { capturedPayload = JSON.parse(raw); });

  const { token, business, user } = await makeUserWithBusiness();
  await ingestDocument(business._id, user._id, {
    name: 'Return policy',
    description: 'Store return rules',
    sourceType: 'TEXT',
    text: 'Customers can return unused items within 30 days and request a refund after inspection.'
  });

  await request(app)
    .post('/api/ai/ask')
    .set(authHeaders(token, business._id))
    .send({ question: 'What is our return policy?' });

  assert.ok(capturedPayload, 'Gemini must have been called');
  assert.ok(Array.isArray(capturedPayload.businessContext.relevantDocuments));
  assert.ok(capturedPayload.businessContext.relevantDocuments.some((doc) => doc.name === 'Return policy'));
});

test('GET /ai/history — returns logs only for the selected business', async () => {
  const first = await makeUserWithBusiness();
  const second = await makeUserWithBusiness();
  const AILog = require('../../src/models/AILog');
  await AILog.create([
    { businessId: first.business._id, userId: first.user._id, requestType: 'ASK', userPrompt: 'First business prompt', status: 'SUCCESS' },
    { businessId: second.business._id, userId: second.user._id, requestType: 'ASK', userPrompt: 'Second business prompt', status: 'SUCCESS' }
  ]);

  const response = await request(app)
    .get('/api/ai/history')
    .set(authHeaders(first.token, first.business._id));

  assert.equal(response.status, 200);
  assert.equal(response.body.data.pagination.total, 1);
  assert.deepEqual(response.body.data.logs.map((log) => log.userPrompt), ['First business prompt']);
});

// ---------------------------------------------------------------------------
// Auth & business guards
// ---------------------------------------------------------------------------

test('POST /ai/ask — 401 without a token', async () => {
  const res = await request(app)
    .post('/api/ai/ask')
    .send({ question: 'How is my business?' });
  assert.equal(res.status, 401);
});

test('POST /ai/ask — 404 BUSINESS_NOT_FOUND when using another user\'s business ID', async () => {
  process.env.GEMINI_API_KEY = 'test-key';
  setGemini('ok');

  const ctx1 = await makeUserWithBusiness();
  const ctx2 = await makeUserWithBusiness();

  const res = await request(app)
    .post('/api/ai/ask')
    .set(authHeaders(ctx1.token, ctx2.business._id)) // wrong business
    .send({ question: 'Show me the numbers.' });

  assert.equal(res.status, 404);
  assert.equal(res.body.error.code, 'BUSINESS_NOT_FOUND');
});
