'use strict';

/**
 * Regression tests for confirmed KEETY defects.
 *
 * Each test is written to FAIL on the original code and PASS after the fix.
 * The root-cause analysis for each bug is documented inline.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * BUG-001  P1  business.middleware — req.body crash on bodyless requests
 * BUG-002  P2  business.controller — getBusiness executes a redundant DB query
 * BUG-003  P2  ai.service — failed Gemini calls are never logged
 * ─────────────────────────────────────────────────────────────────────────────
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

// Stub Gemini before any app import so ai.service picks it up.
const generativeAiModule = require('@google/generative-ai');
let _geminiImpl = null;
generativeAiModule.GoogleGenerativeAI = class {
  getGenerativeModel() {
    return { generateContent: async (p) => _geminiImpl ? _geminiImpl(p) : (() => { throw new Error('no stub'); })() };
  }
};

const { createApp } = require('../../src/app');
const { startDb, stopDb, clearDb } = require('../helpers/db');
const { makeUserWithBusiness, makeProduct } = require('../helpers/factories');

process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';
process.env.JWT_EXPIRES_IN = '7d';
process.env.MONGODB_URI = 'placeholder';

const app = createApp();

test.before(startDb);
test.after(stopDb);
test.beforeEach(clearDb);

function authHdr(token) { return { Authorization: `Bearer ${token}` }; }
function bizHdr(token, bId) { return { Authorization: `Bearer ${token}`, 'x-business-id': String(bId) }; }

// ─────────────────────────────────────────────────────────────────────────────
// BUG-001: business.middleware.js — req.body.businessId TypeError on GET/DELETE
//
// Root cause:
//   requireBusiness reads `req.body.businessId` (line 9) before checking
//   whether `req.body` exists.  express.json() only sets req.body when the
//   request carries a JSON Content-Type.  GET and DELETE requests sent without
//   a Content-Type header arrive with req.body === undefined, so
//   `req.body.businessId` throws a TypeError which reaches the error middleware
//   as a 500 INTERNAL_SERVER_ERROR instead of the correct 400 BUSINESS_REQUIRED.
//
// Affected routes: any protected GET/DELETE that goes through requireBusiness
//   when the user has more than one business and no x-business-id is supplied.
//
// Fix: change `req.body.businessId` → `req.body?.businessId`
// ─────────────────────────────────────────────────────────────────────────────

test('BUG-001 — GET /products returns 400 BUSINESS_REQUIRED (not 500) for a multi-business user with no x-business-id', async () => {
  // Arrange: user with two businesses, no header identifying which one to use.
  const { user, token, business: biz1 } = await makeUserWithBusiness();
  const Business = require('../../src/models/Business');
  const User = require('../../src/models/User');
  const { faker } = require('@faker-js/faker');
  await Business.create({
    ownerId: user._id, name: faker.company.name(), businessType: 'OTHER',
    currency: 'INR', timezone: 'UTC',
    location: { address: '', city: '', state: '', country: '' }
  }).then((b) => User.updateOne({ _id: user._id }, { $addToSet: { businessIds: b._id } }));

  // Act: GET without x-business-id — req.body is undefined on a bare GET.
  const res = await request(app)
    .get('/api/products')
    .set(authHdr(token));

  // Assert: must be 400, not 500.
  assert.equal(res.status, 400, `expected 400 BUSINESS_REQUIRED but got ${res.status}`);
  assert.equal(res.body.error.code, 'BUSINESS_REQUIRED');
});

test('BUG-001 — DELETE /products/:id returns 400 BUSINESS_REQUIRED (not 500) for a multi-business user with no x-business-id', async () => {
  const { user, token } = await makeUserWithBusiness();
  const Business = require('../../src/models/Business');
  const User = require('../../src/models/User');
  const { faker } = require('@faker-js/faker');
  await Business.create({
    ownerId: user._id, name: faker.company.name(), businessType: 'OTHER',
    currency: 'INR', timezone: 'UTC',
    location: { address: '', city: '', state: '', country: '' }
  }).then((b) => User.updateOne({ _id: user._id }, { $addToSet: { businessIds: b._id } }));

  const fakeId = '507f1f77bcf86cd799439011';
  const res = await request(app)
    .delete(`/api/products/${fakeId}`)
    .set(authHdr(token));   // no x-business-id, no Content-Type

  assert.equal(res.status, 400, `expected 400 BUSINESS_REQUIRED but got ${res.status}`);
  assert.equal(res.body.error.code, 'BUSINESS_REQUIRED');
});

test('BUG-001 — GET /analytics returns 400 BUSINESS_REQUIRED (not 500) for a multi-business user with no x-business-id', async () => {
  const { user, token } = await makeUserWithBusiness();
  const Business = require('../../src/models/Business');
  const User = require('../../src/models/User');
  const { faker } = require('@faker-js/faker');
  await Business.create({
    ownerId: user._id, name: faker.company.name(), businessType: 'OTHER',
    currency: 'INR', timezone: 'UTC',
    location: { address: '', city: '', state: '', country: '' }
  }).then((b) => User.updateOne({ _id: user._id }, { $addToSet: { businessIds: b._id } }));

  const res = await request(app)
    .get('/api/analytics')
    .set(authHdr(token));

  assert.equal(res.status, 400, `expected 400 BUSINESS_REQUIRED but got ${res.status}`);
  assert.equal(res.body.error.code, 'BUSINESS_REQUIRED');
});

// ─────────────────────────────────────────────────────────────────────────────
// BUG-002: business.controller.js — getBusiness executes a redundant DB query
//
// Root cause:
//   `GET /api/business/:id` passes through requireBusinessFromRouteParam which
//   already fetches the business and stores it on req.business.  The controller
//   then calls businessService.getBusiness(req.params.id, req.user._id), which
//   runs an identical Business.findOne query a second time.
//
//   This doubles the DB round-trips for every GET /business/:id request.
//   It also means the returned document comes from the second query, not
//   req.business, so any in-memory mutations that middlewares might have made
//   are silently discarded.
//
// Fix: return req.business directly from the controller instead of calling the
//      service again.
// ─────────────────────────────────────────────────────────────────────────────

test('BUG-002 — GET /business/:id returns the correct business with exactly one DB query', async () => {
  const mongoose = require('mongoose');
  const { user, token, business } = await makeUserWithBusiness();

  // Spy on Business.findOne to count how many times it is called.
  const Business = require('../../src/models/Business');
  let queryCount = 0;
  const original = Business.findOne.bind(Business);
  Business.findOne = function (...args) {
    queryCount++;
    return original(...args);
  };

  try {
    const res = await request(app)
      .get(`/api/business/${business._id}`)
      .set(authHdr(token));

    assert.equal(res.status, 200);
    assert.equal(String(res.body.data.business._id), String(business._id));

    // After the fix this must be 1 (middleware) not 2 (middleware + service).
    assert.equal(queryCount, 1, `Business.findOne was called ${queryCount} times — expected 1 after fix`);
  } finally {
    Business.findOne = original; // always restore
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// BUG-003: ai.service.js — failed Gemini calls are never persisted in AILog
//
// Root cause:
//   generateBusinessResponse wraps the Gemini call in try/catch. On any
//   non-ApiError exception the catch block rethrows a new ApiError(503) without
//   first creating an AILog with status: 'FAILED'.  This means every Gemini
//   timeout, rate-limit error, or provider outage is silently lost — there is
//   no record in the database, so failed AI requests are invisible to
//   monitoring, dashboards, and debugging.
//
// Fix: in the catch block, persist an AILog with status: 'FAILED' before
//      rethrowing, guarded so a log-write failure doesn't mask the original
//      error.
// ─────────────────────────────────────────────────────────────────────────────

test('BUG-003 — a failed Gemini call is persisted as an AILog with status FAILED', async () => {
  process.env.GEMINI_API_KEY = 'test-key';

  // Arrange: Gemini always throws a network error.
  _geminiImpl = async () => { throw new Error('upstream timeout'); };

  const { token, business, user } = await makeUserWithBusiness();

  await request(app)
    .post('/api/ai/ask')
    .set(bizHdr(token, business._id))
    .send({ question: 'How are my sales trending?' });

  // Assert: an AILog with status FAILED must exist.
  const AILog = require('../../src/models/AILog');
  const log = await AILog.findOne({ businessId: business._id, status: 'FAILED' });
  assert.ok(log, 'AILog with status FAILED must be created when Gemini throws');
  assert.equal(log.requestType, 'ASK');
  assert.equal(String(log.userId), String(user._id));
});

test('BUG-003 — the FAILED AILog contains the user prompt and business context', async () => {
  process.env.GEMINI_API_KEY = 'test-key';
  _geminiImpl = async () => { throw new Error('rate limit'); };

  const { token, business } = await makeUserWithBusiness();
  const question = 'What are my top products this month?';

  await request(app)
    .post('/api/ai/ask')
    .set(bizHdr(token, business._id))
    .send({ question });

  const AILog = require('../../src/models/AILog');
  const log = await AILog.findOne({ businessId: business._id, status: 'FAILED' });
  assert.ok(log, 'FAILED AILog must exist');
  assert.equal(log.userPrompt, question);
  assert.ok(log.context, 'context must be recorded even for failed requests');
  assert.ok(log.latencyMs >= 0, 'latencyMs must be present');
});

test('BUG-003 — a successful Gemini call is still logged as SUCCESS (no regression)', async () => {
  process.env.GEMINI_API_KEY = 'test-key';
  _geminiImpl = async () => ({ response: { text: () => 'Revenue is up.' } });

  const { token, business } = await makeUserWithBusiness();

  await request(app)
    .post('/api/ai/ask')
    .set(bizHdr(token, business._id))
    .send({ question: 'How is my revenue?' });

  const AILog = require('../../src/models/AILog');
  const log = await AILog.findOne({ businessId: business._id, status: 'SUCCESS' });
  assert.ok(log, 'SUCCESS AILog must still be created after the fix');
});
