'use strict';

/**
 * Unit tests — auth.middleware + business.middleware
 *
 * These tests exercise the middleware functions directly rather than through
 * the HTTP stack so edge cases (expired token, inactive user, business ID
 * resolution priority) can be asserted in isolation.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const { startDb, stopDb, clearDb } = require('../helpers/db');
const { makeAuthUser, makeUserWithBusiness } = require('../helpers/factories');
const { requireAuth } = require('../../src/middleware/auth.middleware');
const { requireBusiness } = require('../../src/middleware/business.middleware');

process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';
process.env.JWT_EXPIRES_IN = '7d';
process.env.MONGODB_URI = 'placeholder';

test.before(startDb);
test.after(stopDb);
test.beforeEach(clearDb);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Builds a minimal mock Express req object. */
function makeReq(authHeader, extras = {}) {
  return {
    get: (name) => (name === 'authorization' ? authHeader : undefined),
    ...extras
  };
}

/** Captures the value passed to next(). */
function makeNext() {
  let called = false;
  let value;
  const fn = (v) => { called = true; value = v; };
  fn.getCalled = () => called;
  fn.getValue = () => value;
  return fn;
}

// ---------------------------------------------------------------------------
// requireAuth — happy path
// ---------------------------------------------------------------------------

test('requireAuth — sets req.user and calls next() for a valid token', async () => {
  const { user, token } = await makeAuthUser();
  const req = makeReq(`Bearer ${token}`);
  const res = {};
  const next = makeNext();

  await requireAuth(req, res, next);

  assert.ok(!next.getValue(), 'next must be called without an error');
  assert.equal(String(req.user._id), String(user._id));
});

// ---------------------------------------------------------------------------
// requireAuth — missing / malformed token
// ---------------------------------------------------------------------------

test('requireAuth — calls next(ApiError 401) when Authorization header is absent', async () => {
  const req = makeReq(undefined);
  const next = makeNext();

  await requireAuth(req, {}, next);

  const err = next.getValue();
  assert.ok(err, 'next must be called with an error');
  assert.equal(err.statusCode, 401);
  assert.equal(err.code, 'UNAUTHORIZED');
});

test('requireAuth — calls next(ApiError 401) for a Basic scheme token', async () => {
  const { token } = await makeAuthUser();
  const next = makeNext();

  await requireAuth(makeReq(`Basic ${token}`), {}, next);

  assert.equal(next.getValue()?.statusCode, 401);
});

test('requireAuth — calls next(ApiError 401) for a bearer token with no value', async () => {
  const next = makeNext();
  await requireAuth(makeReq('Bearer '), {}, next);
  assert.equal(next.getValue()?.statusCode, 401);
});

// ---------------------------------------------------------------------------
// requireAuth — invalid / expired token
// ---------------------------------------------------------------------------

test('requireAuth — calls next(ApiError 401) for a tampered token', async () => {
  const { token } = await makeAuthUser();
  const tampered = token.slice(0, -4) + 'XXXX';
  const next = makeNext();

  await requireAuth(makeReq(`Bearer ${tampered}`), {}, next);

  assert.equal(next.getValue()?.statusCode, 401);
  assert.equal(next.getValue()?.code, 'UNAUTHORIZED');
});

test('requireAuth — calls next(ApiError 401) for an expired token', async () => {
  const expiredToken = jwt.sign(
    { role: 'OWNER' },
    process.env.JWT_SECRET,
    { subject: 'fake-id', expiresIn: -1 }
  );
  const next = makeNext();

  await requireAuth(makeReq(`Bearer ${expiredToken}`), {}, next);

  assert.equal(next.getValue()?.statusCode, 401);
});

test('requireAuth — calls next(ApiError 401) when token subject does not match any user', async () => {
  const fakeToken = jwt.sign(
    { role: 'OWNER' },
    process.env.JWT_SECRET,
    { subject: '507f1f77bcf86cd799439099', expiresIn: '1h' }
  );
  const next = makeNext();

  await requireAuth(makeReq(`Bearer ${fakeToken}`), {}, next);

  assert.equal(next.getValue()?.statusCode, 401);
});

// ---------------------------------------------------------------------------
// requireAuth — inactive user
// ---------------------------------------------------------------------------

test('requireAuth — calls next(ApiError 401) when the user account is inactive', async () => {
  const User = require('../../src/models/User');
  const { user, token } = await makeAuthUser();
  await User.updateOne({ _id: user._id }, { isActive: false });
  const next = makeNext();

  await requireAuth(makeReq(`Bearer ${token}`), {}, next);

  assert.equal(next.getValue()?.statusCode, 401);
  assert.equal(next.getValue()?.code, 'UNAUTHORIZED');
});

// ---------------------------------------------------------------------------
// requireBusiness — business ID resolution priority
// ---------------------------------------------------------------------------

test('requireBusiness — resolves businessId from x-business-id header', async () => {
  const { user, token, business } = await makeUserWithBusiness();
  const req = {
    get: (name) => name === 'x-business-id' ? String(business._id) : undefined,
    params: {},
    query: {},
    body: {},
    user
  };
  const next = makeNext();

  await requireBusiness(req, {}, next);

  assert.ok(!next.getValue(), 'next must be called without error');
  assert.equal(String(req.business._id), String(business._id));
});

test('requireBusiness — auto-selects the business when the user has exactly one', async () => {
  const { user, business } = await makeUserWithBusiness();
  const req = {
    get: () => undefined, // no header
    params: {},
    query: {},
    body: {},
    user
  };
  const next = makeNext();

  await requireBusiness(req, {}, next);

  assert.ok(!next.getValue(), 'next must be called without error');
  assert.equal(String(req.business._id), String(business._id));
});

test('requireBusiness — resolves businessId from req.params.businessId', async () => {
  const { user, business } = await makeUserWithBusiness();
  const req = {
    get: () => undefined,
    params: { businessId: String(business._id) },
    query: {},
    body: {},
    user
  };
  const next = makeNext();

  await requireBusiness(req, {}, next);

  assert.ok(!next.getValue());
  assert.equal(String(req.businessId), String(business._id));
});

test('requireBusiness — calls next(400 BUSINESS_REQUIRED) when user has multiple businesses and no ID is supplied', async () => {
  const { user } = await makeUserWithBusiness();
  // Add a second business ID to the user without creating a real Business doc —
  // we just need businessIds.length > 1 to trigger the missing-selection check.
  const mongoose = require('mongoose');
  const User = require('../../src/models/User');
  await User.updateOne({ _id: user._id }, {
    $push: { businessIds: new mongoose.Types.ObjectId() }
  });
  const freshUser = await User.findById(user._id);

  const req = {
    get: () => undefined,
    params: {},
    query: {},
    body: {},
    user: freshUser
  };
  const next = makeNext();

  await requireBusiness(req, {}, next);

  const err = next.getValue();
  assert.ok(err);
  assert.equal(err.statusCode, 400);
  assert.equal(err.code, 'BUSINESS_REQUIRED');
});

test('requireBusiness — calls next(400 VALIDATION_ERROR) for an invalid ObjectId', async () => {
  const { user } = await makeUserWithBusiness();
  const req = {
    get: () => 'not-valid-id',
    params: {},
    query: {},
    body: {},
    user
  };
  const next = makeNext();

  await requireBusiness(req, {}, next);

  const err = next.getValue();
  assert.equal(err.statusCode, 400);
  assert.equal(err.code, 'VALIDATION_ERROR');
});

test('requireBusiness — calls next(404 BUSINESS_NOT_FOUND) for another user\'s business', async () => {
  const ctx1 = await makeUserWithBusiness();
  const ctx2 = await makeUserWithBusiness();

  // ctx1's user trying to access ctx2's business.
  const req = {
    get: (name) => name === 'x-business-id' ? String(ctx2.business._id) : undefined,
    params: {},
    query: {},
    body: {},
    user: ctx1.user
  };
  const next = makeNext();

  await requireBusiness(req, {}, next);

  const err = next.getValue();
  assert.equal(err.statusCode, 404);
  assert.equal(err.code, 'BUSINESS_NOT_FOUND');
});
