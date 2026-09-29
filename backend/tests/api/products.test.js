'use strict';

/**
 * API integration tests — /api/products
 *
 * Covers: POST / (create), GET / (list + pagination + search), GET /:id,
 * PATCH /:id (update), DELETE /:id, IDOR protection.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
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

const VALID_PRODUCT = {
  name: 'Test Widget',
  price: 299,
  sku: 'WIDGET-001',
  category: 'Widgets',
  unit: 'piece',
  status: 'ACTIVE'
};

function authHeaders(token, businessId) {
  return {
    Authorization: `Bearer ${token}`,
    'x-business-id': String(businessId)
  };
}

// ---------------------------------------------------------------------------
// POST /api/products
// ---------------------------------------------------------------------------

test('POST /products — 201 creates product associated with the business', async () => {
  const { token, business } = await makeUserWithBusiness();
  const res = await request(app)
    .post('/api/products')
    .set(authHeaders(token, business._id))
    .send(VALID_PRODUCT);

  assert.equal(res.status, 201);
  assert.equal(res.body.data.product.name, 'Test Widget');
  assert.equal(String(res.body.data.product.businessId), String(business._id));
});

test('POST /products — 401 without token', async () => {
  const res = await request(app).post('/api/products').send(VALID_PRODUCT);
  assert.equal(res.status, 401);
});

test('POST /products — 400 VALIDATION_ERROR when price is negative', async () => {
  const { token, business } = await makeUserWithBusiness();
  const res = await request(app)
    .post('/api/products')
    .set(authHeaders(token, business._id))
    .send({ ...VALID_PRODUCT, price: -10 });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('POST /products — 400 VALIDATION_ERROR when name is missing', async () => {
  const { token, business } = await makeUserWithBusiness();
  const { name: _n, ...withoutName } = VALID_PRODUCT;
  const res = await request(app)
    .post('/api/products')
    .set(authHeaders(token, business._id))
    .send(withoutName);
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('POST /products — 404 when x-business-id belongs to a different user', async () => {
  const ctx1 = await makeUserWithBusiness();
  const ctx2 = await makeUserWithBusiness();

  const res = await request(app)
    .post('/api/products')
    .set(authHeaders(ctx1.token, ctx2.business._id)) // wrong business
    .send(VALID_PRODUCT);

  assert.equal(res.status, 404);
  assert.equal(res.body.error.code, 'BUSINESS_NOT_FOUND');
});

// ---------------------------------------------------------------------------
// GET /api/products (list)
// ---------------------------------------------------------------------------

test('GET /products — 200 returns only this business\'s products', async () => {
  const ctx1 = await makeUserWithBusiness();
  const ctx2 = await makeUserWithBusiness();
  await makeProduct(ctx1.business._id);
  await makeProduct(ctx1.business._id);
  await makeProduct(ctx2.business._id); // different business

  const res = await request(app)
    .get('/api/products')
    .set(authHeaders(ctx1.token, ctx1.business._id));

  assert.equal(res.status, 200);
  assert.equal(res.body.data.products.length, 2);
  for (const p of res.body.data.products) {
    assert.equal(String(p.businessId), String(ctx1.business._id));
  }
});

test('GET /products — pagination metadata is correct', async () => {
  const { token, business } = await makeUserWithBusiness();
  for (let i = 0; i < 5; i++) await makeProduct(business._id);

  const res = await request(app)
    .get('/api/products?page=1&limit=3')
    .set(authHeaders(token, business._id));

  assert.equal(res.status, 200);
  assert.equal(res.body.data.products.length, 3);
  assert.equal(res.body.data.pagination.total, 5);
  assert.equal(res.body.data.pagination.pages, 2);
});

test('GET /products — search filters by name (case-insensitive)', async () => {
  const { token, business } = await makeUserWithBusiness();
  await makeProduct(business._id, { name: 'Unique Gadget' });
  await makeProduct(business._id, { name: 'Other Item' });

  const res = await request(app)
    .get('/api/products?search=gadget')
    .set(authHeaders(token, business._id));

  assert.equal(res.status, 200);
  assert.equal(res.body.data.products.length, 1);
  assert.equal(res.body.data.products[0].name, 'Unique Gadget');
});

test('GET /products — search with regex special characters does not crash', async () => {
  const { token, business } = await makeUserWithBusiness();
  const res = await request(app)
    .get('/api/products?search=*.*')
    .set(authHeaders(token, business._id));
  assert.equal(res.status, 200);
});

test('GET /products — filters by status', async () => {
  const { token, business } = await makeUserWithBusiness();
  await makeProduct(business._id, { status: 'ACTIVE' });
  await makeProduct(business._id, { status: 'INACTIVE' });

  const res = await request(app)
    .get('/api/products?status=ACTIVE')
    .set(authHeaders(token, business._id));

  assert.equal(res.status, 200);
  assert.equal(res.body.data.products.length, 1);
  assert.equal(res.body.data.products[0].status, 'ACTIVE');
});

test('GET /products — returns empty array (not 404) when no products exist', async () => {
  const { token, business } = await makeUserWithBusiness();
  const res = await request(app)
    .get('/api/products')
    .set(authHeaders(token, business._id));

  assert.equal(res.status, 200);
  assert.equal(res.body.data.products.length, 0);
  assert.equal(res.body.data.pagination.total, 0);
});

// ---------------------------------------------------------------------------
// GET /api/products/:id
// ---------------------------------------------------------------------------

test('GET /products/:id — 200 returns the correct product', async () => {
  const { token, business } = await makeUserWithBusiness();
  const product = await makeProduct(business._id, { name: 'Specific Product' });

  const res = await request(app)
    .get(`/api/products/${product._id}`)
    .set(authHeaders(token, business._id));

  assert.equal(res.status, 200);
  assert.equal(res.body.data.product.name, 'Specific Product');
});

test('GET /products/:id — 404 PRODUCT_NOT_FOUND for a different business\'s product (IDOR)', async () => {
  const ctx1 = await makeUserWithBusiness();
  const ctx2 = await makeUserWithBusiness();
  const foreignProduct = await makeProduct(ctx2.business._id);

  const res = await request(app)
    .get(`/api/products/${foreignProduct._id}`)
    .set(authHeaders(ctx1.token, ctx1.business._id));

  assert.equal(res.status, 404);
  assert.equal(res.body.error.code, 'PRODUCT_NOT_FOUND');
});

test('GET /products/:id — 400 VALIDATION_ERROR for a malformed product ID', async () => {
  const { token, business } = await makeUserWithBusiness();
  const res = await request(app)
    .get('/api/products/not-valid-id')
    .set(authHeaders(token, business._id));
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

// ---------------------------------------------------------------------------
// PATCH /api/products/:id
// ---------------------------------------------------------------------------

test('PATCH /products/:id — 200 updates the product and returns the new document', async () => {
  const { token, business } = await makeUserWithBusiness();
  const product = await makeProduct(business._id, { price: 100 });

  const res = await request(app)
    .patch(`/api/products/${product._id}`)
    .set(authHeaders(token, business._id))
    .send({ price: 200, name: 'Updated Name' });

  assert.equal(res.status, 200);
  assert.equal(res.body.data.product.price, 200);
  assert.equal(res.body.data.product.name, 'Updated Name');
});

test('PATCH /products/:id — 404 PRODUCT_NOT_FOUND for a different business\'s product (IDOR)', async () => {
  const ctx1 = await makeUserWithBusiness();
  const ctx2 = await makeUserWithBusiness();
  const foreignProduct = await makeProduct(ctx2.business._id, { price: 100 });

  const res = await request(app)
    .patch(`/api/products/${foreignProduct._id}`)
    .set(authHeaders(ctx1.token, ctx1.business._id))
    .send({ price: 1 });

  assert.equal(res.status, 404);
  assert.equal(res.body.error.code, 'PRODUCT_NOT_FOUND');
});

test('PATCH /products/:id — 400 VALIDATION_ERROR for a negative price', async () => {
  const { token, business } = await makeUserWithBusiness();
  const product = await makeProduct(business._id);

  const res = await request(app)
    .patch(`/api/products/${product._id}`)
    .set(authHeaders(token, business._id))
    .send({ price: -50 });

  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

// ---------------------------------------------------------------------------
// DELETE /api/products/:id
// ---------------------------------------------------------------------------

test('DELETE /products/:id — 200 removes the product', async () => {
  const { token, business } = await makeUserWithBusiness();
  const product = await makeProduct(business._id);

  const delRes = await request(app)
    .delete(`/api/products/${product._id}`)
    .set(authHeaders(token, business._id));
  assert.equal(delRes.status, 200);

  // Confirm it's gone.
  const getRes = await request(app)
    .get(`/api/products/${product._id}`)
    .set(authHeaders(token, business._id));
  assert.equal(getRes.status, 404);
});

test('DELETE /products/:id — 404 PRODUCT_NOT_FOUND for a different business\'s product (IDOR)', async () => {
  const ctx1 = await makeUserWithBusiness();
  const ctx2 = await makeUserWithBusiness();
  const foreignProduct = await makeProduct(ctx2.business._id);

  const res = await request(app)
    .delete(`/api/products/${foreignProduct._id}`)
    .set(authHeaders(ctx1.token, ctx1.business._id));

  assert.equal(res.status, 404);
  assert.equal(res.body.error.code, 'PRODUCT_NOT_FOUND');

  // Confirm it still exists in its actual business.
  const Product = require('../../src/models/Product');
  const still = await Product.findById(foreignProduct._id);
  assert.ok(still, 'product must still exist after failed cross-business delete');
});
