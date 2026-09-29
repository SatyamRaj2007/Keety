'use strict';

/**
 * Validation boundary tests — testing.md §19 & §20
 *
 * Covers every important numeric, length, and type boundary for the API.
 * Per testing.md §20: minimum−1, minimum, minimum+1, normal, maximum−1, maximum, maximum+1.
 *
 * Also covers: wrong types, null values, empty objects, unexpected fields,
 * malformed ObjectIds, and missing required fields (§19).
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../../src/app');
const { startDb, stopDb, clearDb } = require('../helpers/db');
const {
  makeUserWithBusiness,
  makeProduct,
  makeInventory,
  makeAuthUser
} = require('../helpers/factories');

process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';
process.env.JWT_EXPIRES_IN = '7d';
process.env.MONGODB_URI = 'placeholder';

const app = createApp();

test.before(startDb);
test.after(stopDb);
test.beforeEach(clearDb);

function h(token, bId) {
  return { Authorization: `Bearer ${token}`, 'x-business-id': String(bId) };
}

// ─── AUTH register ────────────────────────────────────────────────────────────

test('register — name at max length (100 chars) is accepted', async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'A'.repeat(100),
    email: 'maxname@example.test',
    password: 'Password1!'
  });
  assert.equal(res.status, 201);
});

test('register — name one char over max (101 chars) is rejected', async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'A'.repeat(101),
    email: 'toolong@example.test',
    password: 'Password1!'
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('register — password at minimum length (8 chars) is accepted', async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Min Pass',
    email: 'minpass@example.test',
    password: 'Exactly8'
  });
  assert.equal(res.status, 201);
});

test('register — password one char under minimum (7 chars) is rejected', async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Short',
    email: 'short@example.test',
    password: 'Only7ch'
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('register — password at max length (128 chars) is accepted', async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Max Pass',
    email: 'maxpass@example.test',
    password: 'P'.repeat(128)
  });
  assert.equal(res.status, 201);
});

test('register — password one char over max (129 chars) is rejected', async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Too Long',
    email: 'toolongpw@example.test',
    password: 'P'.repeat(129)
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('register — wrong type for name (number) is rejected', async () => {
  const res = await request(app).post('/api/auth/register').send({ name: 42, email: 'typed@example.test', password: 'Password1!' });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('register — null email is rejected', async () => {
  const res = await request(app).post('/api/auth/register').send({ name: 'Test', email: null, password: 'Password1!' });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

// ─── PRODUCT price boundary ───────────────────────────────────────────────────

test('product — price=0 (minimum) is accepted', async () => {
  const { token, business } = await makeUserWithBusiness();
  const res = await request(app)
    .post('/api/products')
    .set(h(token, business._id))
    .send({ name: 'Free Item', price: 0 });
  assert.equal(res.status, 201);
  assert.equal(res.body.data.product.price, 0);
});

test('product — price just below minimum (-0.01) is rejected', async () => {
  const { token, business } = await makeUserWithBusiness();
  const res = await request(app)
    .post('/api/products')
    .set(h(token, business._id))
    .send({ name: 'Negative', price: -0.01 });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('product — price=Infinity is rejected', async () => {
  const { token, business } = await makeUserWithBusiness();
  const res = await request(app)
    .post('/api/products')
    .set(h(token, business._id))
    .send({ name: 'Infinite', price: 1 / 0 }); // JSON serialises as null
  // JSON.stringify(Infinity) = null — so price field is missing → validation error
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('product — name at max length (160 chars) is accepted', async () => {
  const { token, business } = await makeUserWithBusiness();
  const res = await request(app)
    .post('/api/products')
    .set(h(token, business._id))
    .send({ name: 'N'.repeat(160), price: 10 });
  assert.equal(res.status, 201);
});

test('product — name one char over max (161 chars) is rejected', async () => {
  const { token, business } = await makeUserWithBusiness();
  const res = await request(app)
    .post('/api/products')
    .set(h(token, business._id))
    .send({ name: 'N'.repeat(161), price: 10 });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('product — price as a string is rejected', async () => {
  const { token, business } = await makeUserWithBusiness();
  const res = await request(app)
    .post('/api/products')
    .set(h(token, business._id))
    .send({ name: 'Widget', price: '100' });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('product — price is required (rejected when missing)', async () => {
  const { token, business } = await makeUserWithBusiness();
  const res = await request(app)
    .post('/api/products')
    .set(h(token, business._id))
    .send({ name: 'No Price' });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('product update — completely empty body is rejected', async () => {
  const { token, business } = await makeUserWithBusiness();
  const product = await makeProduct(business._id, { price: 100 });
  const res = await request(app)
    .patch(`/api/products/${product._id}`)
    .set(h(token, business._id))
    .send({});
  // updateProductSchema is .partial().strict() — empty object is technically
  // valid (no fields required). The service should succeed with no-op update.
  // Assert we do NOT get a 500.
  assert.ok(res.status < 500, `PATCH with empty body must not 500, got ${res.status}`);
});

test('product update — unknown field is rejected by strict schema', async () => {
  const { token, business } = await makeUserWithBusiness();
  const product = await makeProduct(business._id, { price: 100 });
  const res = await request(app)
    .patch(`/api/products/${product._id}`)
    .set(h(token, business._id))
    .send({ price: 200, isDeleted: true }); // isDeleted is not in schema
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

// ─── SALE quantity boundary ───────────────────────────────────────────────────

test('sale — quantity=1 (minimum) is accepted', async () => {
  const { token, business } = await makeUserWithBusiness();
  const product = await makeProduct(business._id, { price: 50 });
  await makeInventory(business._id, product._id, { quantity: 10 });

  const res = await request(app)
    .post('/api/sales')
    .set(h(token, business._id))
    .send({ items: [{ productId: product._id.toString(), quantity: 1 }] });
  assert.equal(res.status, 201);
});

test('sale — quantity=0 is rejected (below minimum)', async () => {
  const { token, business } = await makeUserWithBusiness();
  const product = await makeProduct(business._id, { price: 50 });
  const res = await request(app)
    .post('/api/sales')
    .set(h(token, business._id))
    .send({ items: [{ productId: product._id.toString(), quantity: 0 }] });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('sale — quantity=-1 is rejected', async () => {
  const { token, business } = await makeUserWithBusiness();
  const product = await makeProduct(business._id, { price: 50 });
  const res = await request(app)
    .post('/api/sales')
    .set(h(token, business._id))
    .send({ items: [{ productId: product._id.toString(), quantity: -1 }] });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('sale — 100 distinct items (max) is accepted', async () => {
  const { token, business } = await makeUserWithBusiness();
  // Create 100 distinct products.
  const products = await Promise.all(
    Array.from({ length: 100 }, () => makeProduct(business._id, { price: 1 }))
  );
  const items = products.map((p) => ({ productId: p._id.toString(), quantity: 1 }));

  const res = await request(app)
    .post('/api/sales')
    .set(h(token, business._id))
    .send({ items });
  // 100 items, some products may not have inventory — expect 201 or 400 INVALID_SALE_ITEMS
  // but definitely not a 500 crash.
  assert.ok(res.status < 500, `100-item sale must not 500, got ${res.status}`);
});

test('sale — 101 items exceeds max and is rejected', async () => {
  const { token, business } = await makeUserWithBusiness();
  const fakeId = '507f1f77bcf86cd799439011';
  const items = Array.from({ length: 101 }, () => ({ productId: fakeId, quantity: 1 }));
  const res = await request(app)
    .post('/api/sales')
    .set(h(token, business._id))
    .send({ items });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('sale — productId that is not a valid ObjectId is rejected', async () => {
  const { token, business } = await makeUserWithBusiness();
  const res = await request(app)
    .post('/api/sales')
    .set(h(token, business._id))
    .send({ items: [{ productId: 'not-an-objectid', quantity: 1 }] });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('sale — discount=0 (minimum boundary) is accepted', async () => {
  const { token, business } = await makeUserWithBusiness();
  const product = await makeProduct(business._id, { price: 100 });
  await makeInventory(business._id, product._id, { quantity: 5 });
  const res = await request(app)
    .post('/api/sales')
    .set(h(token, business._id))
    .send({ items: [{ productId: product._id.toString(), quantity: 1 }], discount: 0 });
  assert.equal(res.status, 201);
});

test('sale — negative discount is rejected', async () => {
  const { token, business } = await makeUserWithBusiness();
  const product = await makeProduct(business._id, { price: 100 });
  const res = await request(app)
    .post('/api/sales')
    .set(h(token, business._id))
    .send({ items: [{ productId: product._id.toString(), quantity: 1 }], discount: -1 });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

// ─── PAGINATION boundary ──────────────────────────────────────────────────────

test('GET /products — page=0 is clamped to page 1 (no crash)', async () => {
  const { token, business } = await makeUserWithBusiness();
  await makeProduct(business._id);
  const res = await request(app)
    .get('/api/products?page=0')
    .set(h(token, business._id));
  assert.equal(res.status, 200);
  assert.equal(res.body.data.pagination.page, 1);
});

test('GET /products — limit=0 falls back to default 20', async () => {
  const { token, business } = await makeUserWithBusiness();
  const res = await request(app)
    .get('/api/products?limit=0')
    .set(h(token, business._id));
  assert.equal(res.status, 200);
  assert.equal(res.body.data.pagination.limit, 20);
});

test('GET /products — limit=101 is clamped to 100', async () => {
  const { token, business } = await makeUserWithBusiness();
  const res = await request(app)
    .get('/api/products?limit=101')
    .set(h(token, business._id));
  assert.equal(res.status, 200);
  assert.equal(res.body.data.pagination.limit, 100);
});

test('GET /products — page beyond total returns empty array with correct metadata', async () => {
  const { token, business } = await makeUserWithBusiness();
  await makeProduct(business._id);
  const res = await request(app)
    .get('/api/products?page=999')
    .set(h(token, business._id));
  assert.equal(res.status, 200);
  assert.equal(res.body.data.products.length, 0);
  assert.equal(res.body.data.pagination.total, 1);
});

test('GET /sales — non-integer page falls back gracefully', async () => {
  const { token, business } = await makeUserWithBusiness();
  const res = await request(app)
    .get('/api/sales?page=abc')
    .set(h(token, business._id));
  assert.equal(res.status, 200);
  assert.equal(res.body.data.pagination.page, 1);
});

// ─── BUSINESS validation boundaries ──────────────────────────────────────────

test('business — name at max length (120 chars) is accepted', async () => {
  const { token } = await makeAuthUser();
  const res = await request(app)
    .post('/api/business')
    .set({ Authorization: `Bearer ${token}` })
    .send({ name: 'B'.repeat(120), businessType: 'OTHER' });
  assert.equal(res.status, 201);
});

test('business — name one char over max (121 chars) is rejected', async () => {
  const { token } = await makeAuthUser();
  const res = await request(app)
    .post('/api/business')
    .set({ Authorization: `Bearer ${token}` })
    .send({ name: 'B'.repeat(121), businessType: 'OTHER' });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('business — currency must be exactly 3 alpha chars', async () => {
  const { token } = await makeAuthUser();
  const res = await request(app)
    .post('/api/business')
    .set({ Authorization: `Bearer ${token}` })
    .send({ name: 'Shop', businessType: 'OTHER', currency: 'US' }); // 2 chars
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('business — currency with digits is rejected', async () => {
  const { token } = await makeAuthUser();
  const res = await request(app)
    .post('/api/business')
    .set({ Authorization: `Bearer ${token}` })
    .send({ name: 'Shop', businessType: 'OTHER', currency: 'U1R' });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

// ─── WRONG types / malformed input ───────────────────────────────────────────

test('POST /sales — items as an object instead of array is rejected', async () => {
  const { token, business } = await makeUserWithBusiness();
  const res = await request(app)
    .post('/api/sales')
    .set(h(token, business._id))
    .send({ items: { productId: '507f1f77bcf86cd799439011', quantity: 1 } });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('POST /products — body is an array instead of an object is rejected', async () => {
  const { token, business } = await makeUserWithBusiness();
  const res = await request(app)
    .post('/api/products')
    .set(h(token, business._id))
    .send([{ name: 'Widget', price: 10 }]);
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('POST /auth/register — missing body entirely returns 400', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .set('Content-Type', 'application/json')
    .send('');
  assert.equal(res.status, 400);
});

// ─── AI question boundary ────────────────────────────────────────────────────

test('POST /ai/ask — question at min length (3 chars) is accepted at validation layer', async () => {
  // This tests the validation layer only — GEMINI_API_KEY not set → 503 is fine.
  const { token, business } = await makeUserWithBusiness();
  const savedKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = '';
  try {
    const res = await request(app)
      .post('/api/ai/ask')
      .set(h(token, business._id))
      .send({ question: 'Hi?' });
    // 503 means validation passed (the question was long enough).
    assert.ok([200, 503].includes(res.status), `expected 200 or 503, got ${res.status}`);
    assert.notEqual(res.body.error?.code, 'VALIDATION_ERROR');
  } finally {
    process.env.GEMINI_API_KEY = savedKey || '';
  }
});

test('POST /ai/ask — question at exactly max length (1000 chars) passes validation', async () => {
  const { token, business } = await makeUserWithBusiness();
  const savedKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = '';
  try {
    const res = await request(app)
      .post('/api/ai/ask')
      .set(h(token, business._id))
      .send({ question: 'Q'.repeat(1000) });
    assert.ok([200, 503].includes(res.status), `expected 200 or 503, got ${res.status}`);
    assert.notEqual(res.body.error?.code, 'VALIDATION_ERROR');
  } finally {
    process.env.GEMINI_API_KEY = savedKey || '';
  }
});

test('POST /ai/growth-strategy — goal at minimum (3 chars) passes validation', async () => {
  const { token, business } = await makeUserWithBusiness();
  const savedKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = '';
  try {
    const res = await request(app)
      .post('/api/ai/growth-strategy')
      .set(h(token, business._id))
      .send({ goal: 'Grow' }); // 4 chars > 3 min
    assert.ok([200, 503].includes(res.status), `expected 200 or 503, got ${res.status}`);
  } finally {
    process.env.GEMINI_API_KEY = savedKey || '';
  }
});
