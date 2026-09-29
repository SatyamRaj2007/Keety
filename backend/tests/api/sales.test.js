'use strict';

/**
 * API integration tests — /api/sales
 *
 * Covers: POST / (create), GET / (list), GET /:id, duplicate product
 * validation, IDOR protection, input validation.
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
  makeCustomer,
  makeSale
} = require('../helpers/factories');

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

async function setupSaleContext() {
  const { user, token, business } = await makeUserWithBusiness();
  const product = await makeProduct(business._id, { price: 500, status: 'ACTIVE' });
  await makeInventory(business._id, product._id, { quantity: 100 });
  return { user, token, business, product };
}

// ---------------------------------------------------------------------------
// POST /api/sales
// ---------------------------------------------------------------------------

test('POST /sales — 201 creates a sale with correct totals', async () => {
  const { token, business, product } = await setupSaleContext();

  const res = await request(app)
    .post('/api/sales')
    .set(authHeaders(token, business._id))
    .send({
      items: [{ productId: product._id.toString(), quantity: 2 }],
      discount: 50,
      tax: 25,
      paymentMethod: 'CASH'
    });

  assert.equal(res.status, 201);
  assert.equal(res.body.data.sale.subtotal, 1000);
  assert.equal(res.body.data.sale.discount, 50);
  assert.equal(res.body.data.sale.tax, 25);
  assert.equal(res.body.data.sale.totalAmount, 975);
});

test('POST /sales — decrements inventory after a successful sale', async () => {
  const Inventory = require('../../src/models/Inventory');
  const { token, business, product } = await setupSaleContext();
  const invBefore = await Inventory.findOne({ businessId: business._id, productId: product._id });

  await request(app)
    .post('/api/sales')
    .set(authHeaders(token, business._id))
    .send({ items: [{ productId: product._id.toString(), quantity: 3 }] });

  const invAfter = await Inventory.findOne({ businessId: business._id, productId: product._id });
  assert.equal(invAfter.quantity, invBefore.quantity - 3);
});

test('POST /sales — 400 VALIDATION_ERROR when items array is empty', async () => {
  const { token, business } = await setupSaleContext();
  const res = await request(app)
    .post('/api/sales')
    .set(authHeaders(token, business._id))
    .send({ items: [] });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('POST /sales — 400 VALIDATION_ERROR when items has duplicate productIds', async () => {
  const { token, business, product } = await setupSaleContext();
  const res = await request(app)
    .post('/api/sales')
    .set(authHeaders(token, business._id))
    .send({
      items: [
        { productId: product._id.toString(), quantity: 1 },
        { productId: product._id.toString(), quantity: 2 } // duplicate
      ]
    });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('POST /sales — 400 VALIDATION_ERROR for non-integer quantity', async () => {
  const { token, business, product } = await setupSaleContext();
  const res = await request(app)
    .post('/api/sales')
    .set(authHeaders(token, business._id))
    .send({ items: [{ productId: product._id.toString(), quantity: 1.5 }] });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('POST /sales — 400 VALIDATION_ERROR for zero quantity', async () => {
  const { token, business, product } = await setupSaleContext();
  const res = await request(app)
    .post('/api/sales')
    .set(authHeaders(token, business._id))
    .send({ items: [{ productId: product._id.toString(), quantity: 0 }] });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('POST /sales — 400 INVALID_DISCOUNT when discount exceeds subtotal', async () => {
  const { token, business, product } = await setupSaleContext();
  const res = await request(app)
    .post('/api/sales')
    .set(authHeaders(token, business._id))
    .send({
      items: [{ productId: product._id.toString(), quantity: 1 }],
      discount: 9999
    });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'INVALID_DISCOUNT');
});

test('POST /sales — 409 INSUFFICIENT_STOCK when inventory is too low', async () => {
  const { token, business } = await makeUserWithBusiness();
  const product = await makeProduct(business._id, { price: 100 });
  await makeInventory(business._id, product._id, { quantity: 2 });

  const res = await request(app)
    .post('/api/sales')
    .set(authHeaders(token, business._id))
    .send({ items: [{ productId: product._id.toString(), quantity: 10 }] });

  assert.equal(res.status, 409);
  assert.equal(res.body.error.code, 'INSUFFICIENT_STOCK');
});

test('POST /sales — 400 INVALID_SALE_ITEMS for a product from a different business', async () => {
  const ctx1 = await makeUserWithBusiness();
  const ctx2 = await makeUserWithBusiness();
  const foreignProduct = await makeProduct(ctx2.business._id, { price: 100 });
  await makeInventory(ctx2.business._id, foreignProduct._id, { quantity: 10 });

  const res = await request(app)
    .post('/api/sales')
    .set(authHeaders(ctx1.token, ctx1.business._id))
    .send({ items: [{ productId: foreignProduct._id.toString(), quantity: 1 }] });

  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'INVALID_SALE_ITEMS');
});

test('POST /sales — 400 INVALID_CUSTOMER when customer belongs to a different business', async () => {
  const ctx1 = await setupSaleContext();
  const ctx2 = await makeUserWithBusiness();
  const foreignCustomer = await makeCustomer(ctx2.business._id);

  const res = await request(app)
    .post('/api/sales')
    .set(authHeaders(ctx1.token, ctx1.business._id))
    .send({
      items: [{ productId: ctx1.product._id.toString(), quantity: 1 }],
      customerId: foreignCustomer._id.toString()
    });

  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'INVALID_CUSTOMER');
});

test('POST /sales — 401 without a token', async () => {
  const res = await request(app)
    .post('/api/sales')
    .send({ items: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }] });
  assert.equal(res.status, 401);
});

// ---------------------------------------------------------------------------
// GET /api/sales (list)
// ---------------------------------------------------------------------------

test('GET /sales — 200 returns only the current business\'s sales', async () => {
  const ctx1 = await setupSaleContext();
  const ctx2 = await makeUserWithBusiness();
  const p2 = await makeProduct(ctx2.business._id, { price: 100 });

  // Use factory helper to insert sales directly.
  await makeSale(ctx1.business._id, [{ product: ctx1.product, quantity: 1 }]);
  await makeSale(ctx2.business._id, [{ product: p2, quantity: 1 }]);

  const res = await request(app)
    .get('/api/sales')
    .set(authHeaders(ctx1.token, ctx1.business._id));

  assert.equal(res.status, 200);
  assert.equal(res.body.data.sales.length, 1);
  assert.equal(String(res.body.data.sales[0].businessId), String(ctx1.business._id));
});

test('GET /sales — pagination metadata is correct', async () => {
  const { token, business, product } = await setupSaleContext();
  for (let i = 0; i < 4; i++) {
    await makeSale(business._id, [{ product, quantity: 1 }]);
  }

  const res = await request(app)
    .get('/api/sales?page=1&limit=2')
    .set(authHeaders(token, business._id));

  assert.equal(res.status, 200);
  assert.equal(res.body.data.sales.length, 2);
  assert.equal(res.body.data.pagination.total, 4);
  assert.equal(res.body.data.pagination.pages, 2);
});

// ---------------------------------------------------------------------------
// GET /api/sales/:id
// ---------------------------------------------------------------------------

test('GET /sales/:id — 200 returns the sale document', async () => {
  const { token, business, product } = await setupSaleContext();
  const sale = await makeSale(business._id, [{ product, quantity: 1 }]);

  const res = await request(app)
    .get(`/api/sales/${sale._id}`)
    .set(authHeaders(token, business._id));

  assert.equal(res.status, 200);
  assert.equal(String(res.body.data.sale._id), String(sale._id));
});

test('GET /sales/:id — 404 SALE_NOT_FOUND when accessing another business\'s sale (IDOR)', async () => {
  const ctx1 = await setupSaleContext();
  const ctx2 = await makeUserWithBusiness();
  const sale = await makeSale(ctx1.business._id, [{ product: ctx1.product, quantity: 1 }]);

  const res = await request(app)
    .get(`/api/sales/${sale._id}`)
    .set(authHeaders(ctx2.token, ctx2.business._id));

  assert.equal(res.status, 404);
  assert.equal(res.body.error.code, 'SALE_NOT_FOUND');
});

test('GET /sales/:id — 400 VALIDATION_ERROR for a malformed sale ID', async () => {
  const { token, business } = await setupSaleContext();
  const res = await request(app)
    .get('/api/sales/not-valid')
    .set(authHeaders(token, business._id));
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});
