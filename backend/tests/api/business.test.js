'use strict';

/**
 * API integration tests — /api/business
 *
 * Covers: POST / (create), GET /:id, PATCH /:id
 * Also covers ownership isolation — a user cannot read or update another
 * user's business.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../../src/app');
const { startDb, stopDb, clearDb } = require('../helpers/db');
const { makeAuthUser, makeBusiness } = require('../helpers/factories');

process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';
process.env.JWT_EXPIRES_IN = '7d';
process.env.MONGODB_URI = 'placeholder';

const app = createApp();

test.before(startDb);
test.after(stopDb);
test.beforeEach(clearDb);

const VALID_BIZ = {
  name: 'Test Shop',
  businessType: 'CLOTHING',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  location: { address: '1 Main St', city: 'Mumbai', state: 'MH', country: 'India' }
};

// ---------------------------------------------------------------------------
// POST /api/business
// ---------------------------------------------------------------------------

test('POST /business — 201 creates a business linked to the authenticated owner', async () => {
  const { user, token } = await makeAuthUser();
  const res = await request(app)
    .post('/api/business')
    .set('Authorization', `Bearer ${token}`)
    .send(VALID_BIZ);

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.business.name, 'Test Shop');
  assert.equal(String(res.body.data.business.ownerId), String(user._id));
});

test('POST /business — 401 without a token', async () => {
  const res = await request(app).post('/api/business').send(VALID_BIZ);
  assert.equal(res.status, 401);
});

test('POST /business — 400 VALIDATION_ERROR when name is missing', async () => {
  const { token } = await makeAuthUser();
  const { name: _n, ...withoutName } = VALID_BIZ;
  const res = await request(app)
    .post('/api/business')
    .set('Authorization', `Bearer ${token}`)
    .send(withoutName);
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('POST /business — 400 VALIDATION_ERROR for an invalid businessType', async () => {
  const { token } = await makeAuthUser();
  const res = await request(app)
    .post('/api/business')
    .set('Authorization', `Bearer ${token}`)
    .send({ ...VALID_BIZ, businessType: 'INVALID_TYPE' });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('POST /business — adds the new business ID to the user\'s businessIds', async () => {
  const User = require('../../src/models/User');
  const { user, token } = await makeAuthUser();
  const res = await request(app)
    .post('/api/business')
    .set('Authorization', `Bearer ${token}`)
    .send(VALID_BIZ);

  const updated = await User.findById(user._id);
  assert.ok(
    updated.businessIds.some((id) => String(id) === String(res.body.data.business._id)),
    'business ID must be added to user.businessIds'
  );
});

// ---------------------------------------------------------------------------
// GET /api/business/:id
// ---------------------------------------------------------------------------

test('GET /business/:id — 200 returns the business for its owner', async () => {
  const { user, token } = await makeAuthUser();
  const biz = await makeBusiness(user);

  const res = await request(app)
    .get(`/api/business/${biz._id}`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.equal(String(res.body.data.business._id), String(biz._id));
});

test('GET /business/:id — 404 BUSINESS_NOT_FOUND for another user\'s business', async () => {
  const owner = await makeAuthUser();
  const intruder = await makeAuthUser();
  const biz = await makeBusiness(owner.user);

  const res = await request(app)
    .get(`/api/business/${biz._id}`)
    .set('Authorization', `Bearer ${intruder.token}`);

  assert.equal(res.status, 404);
  assert.equal(res.body.error.code, 'BUSINESS_NOT_FOUND');
});

test('GET /business/:id — 400 for a malformed business ID', async () => {
  const { token } = await makeAuthUser();
  const res = await request(app)
    .get('/api/business/not-an-id')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 400);
});

test('GET /business/:id — 401 without authentication', async () => {
  const { user } = await makeAuthUser();
  const biz = await makeBusiness(user);
  const res = await request(app).get(`/api/business/${biz._id}`);
  assert.equal(res.status, 401);
});

// ---------------------------------------------------------------------------
// PATCH /api/business/:id
// ---------------------------------------------------------------------------

test('PATCH /business/:id — 200 updates allowed fields', async () => {
  const { user, token } = await makeAuthUser();
  const biz = await makeBusiness(user);

  const res = await request(app)
    .patch(`/api/business/${biz._id}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Updated Shop Name' });

  assert.equal(res.status, 200);
  assert.equal(res.body.data.business.name, 'Updated Shop Name');
});

test('PATCH /business/:id — 404 when an intruder tries to update another business', async () => {
  const owner = await makeAuthUser();
  const intruder = await makeAuthUser();
  const biz = await makeBusiness(owner.user);

  const res = await request(app)
    .patch(`/api/business/${biz._id}`)
    .set('Authorization', `Bearer ${intruder.token}`)
    .send({ name: 'Hijacked Name' });

  assert.equal(res.status, 404);
  assert.equal(res.body.error.code, 'BUSINESS_NOT_FOUND');

  // Verify name was NOT changed.
  const unchanged = await request(app)
    .get(`/api/business/${biz._id}`)
    .set('Authorization', `Bearer ${owner.token}`);
  assert.equal(unchanged.body.data.business.name, biz.name);
});

test('PATCH /business/:id — 400 VALIDATION_ERROR for an invalid businessType update', async () => {
  const { user, token } = await makeAuthUser();
  const biz = await makeBusiness(user);

  const res = await request(app)
    .patch(`/api/business/${biz._id}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ businessType: 'INVALID' });

  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('PATCH /business/:id — 401 without authentication', async () => {
  const { user } = await makeAuthUser();
  const biz = await makeBusiness(user);
  const res = await request(app)
    .patch(`/api/business/${biz._id}`)
    .send({ name: 'No Token' });
  assert.equal(res.status, 401);
});
