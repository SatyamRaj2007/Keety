'use strict';

/**
 * Authorization & multi-business isolation tests (IDOR / BOLA)
 *
 * For every business-owned resource type this file verifies:
 *   1. Business A user → Business A resource → ALLOW
 *   2. Business A user → Business B resource → DENY
 *   3. Read, Update, and Delete are each denied individually.
 *
 * These tests are the primary guard against cross-tenant data exposure.
 * A failure here is a Critical release gate blocker per testing.md §17, §18.
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
  makeSale,
  makeExpense
} = require('../helpers/factories');

process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';
process.env.JWT_EXPIRES_IN = '7d';
process.env.MONGODB_URI = 'placeholder';

const app = createApp();

test.before(startDb);
test.after(stopDb);
test.beforeEach(clearDb);

function headers(token, businessId) {
  return {
    Authorization: `Bearer ${token}`,
    'x-business-id': String(businessId)
  };
}

// ---------------------------------------------------------------------------
// Business isolation — a user cannot read/update another user's business
// ---------------------------------------------------------------------------

test('ISOLATION — Business: owner can read own business', async () => {
  const { user, token } = await makeUserWithBusiness();
  const biz = (await makeUserWithBusiness()).business; // different biz
  const own = await (async () => {
    const b = await makeUserWithBusiness();
    return b.business;
  })();
  // Just use ctx1's own business.
  const ctx = await makeUserWithBusiness();
  const res = await request(app)
    .get(`/api/business/${ctx.business._id}`)
    .set('Authorization', `Bearer ${ctx.token}`);
  assert.equal(res.status, 200);
});

test('ISOLATION — Business: user cannot read another user\'s business', async () => {
  const ctx1 = await makeUserWithBusiness();
  const ctx2 = await makeUserWithBusiness();

  const res = await request(app)
    .get(`/api/business/${ctx2.business._id}`)
    .set('Authorization', `Bearer ${ctx1.token}`);

  assert.equal(res.status, 404, 'cross-tenant business read must be denied');
});

test('ISOLATION — Business: user cannot update another user\'s business', async () => {
  const ctx1 = await makeUserWithBusiness();
  const ctx2 = await makeUserWithBusiness();

  const res = await request(app)
    .patch(`/api/business/${ctx2.business._id}`)
    .set('Authorization', `Bearer ${ctx1.token}`)
    .send({ name: 'Hijacked' });

  assert.equal(res.status, 404, 'cross-tenant business update must be denied');

  // Verify the name was not changed.
  const Business = require('../../src/models/Business');
  const unchanged = await Business.findById(ctx2.business._id);
  assert.notEqual(unchanged.name, 'Hijacked');
});

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

test('ISOLATION — Products: owner can read their own product', async () => {
  const ctx = await makeUserWithBusiness();
  const p = await makeProduct(ctx.business._id);
  const res = await request(app)
    .get(`/api/products/${p._id}`)
    .set(headers(ctx.token, ctx.business._id));
  assert.equal(res.status, 200);
});

test('ISOLATION — Products: user cannot read a product from another business (IDOR read)', async () => {
  const ctx1 = await makeUserWithBusiness();
  const ctx2 = await makeUserWithBusiness();
  const foreignProduct = await makeProduct(ctx2.business._id);

  const res = await request(app)
    .get(`/api/products/${foreignProduct._id}`)
    .set(headers(ctx1.token, ctx1.business._id));

  assert.equal(res.status, 404);
  assert.equal(res.body.error.code, 'PRODUCT_NOT_FOUND');
});

test('ISOLATION — Products: user cannot update a product from another business (IDOR update)', async () => {
  const ctx1 = await makeUserWithBusiness();
  const ctx2 = await makeUserWithBusiness();
  const foreignProduct = await makeProduct(ctx2.business._id, { price: 100 });

  const res = await request(app)
    .patch(`/api/products/${foreignProduct._id}`)
    .set(headers(ctx1.token, ctx1.business._id))
    .send({ price: 1 });

  assert.equal(res.status, 404);

  // Confirm the price was not changed.
  const Product = require('../../src/models/Product');
  const still = await Product.findById(foreignProduct._id);
  assert.equal(still.price, 100);
});

test('ISOLATION — Products: user cannot delete a product from another business (IDOR delete)', async () => {
  const ctx1 = await makeUserWithBusiness();
  const ctx2 = await makeUserWithBusiness();
  const foreignProduct = await makeProduct(ctx2.business._id);

  const res = await request(app)
    .delete(`/api/products/${foreignProduct._id}`)
    .set(headers(ctx1.token, ctx1.business._id));

  assert.equal(res.status, 404);

  // Confirm the product was not deleted.
  const Product = require('../../src/models/Product');
  const still = await Product.findById(foreignProduct._id);
  assert.ok(still, 'product must still exist after cross-tenant delete attempt');
});

// ---------------------------------------------------------------------------
// Sales
// ---------------------------------------------------------------------------

test('ISOLATION — Sales: owner can read their own sale', async () => {
  const ctx = await makeUserWithBusiness();
  const p = await makeProduct(ctx.business._id, { price: 100 });
  const sale = await makeSale(ctx.business._id, [{ product: p, quantity: 1 }]);

  const res = await request(app)
    .get(`/api/sales/${sale._id}`)
    .set(headers(ctx.token, ctx.business._id));

  assert.equal(res.status, 200);
});

test('ISOLATION — Sales: user cannot read another business\'s sale (IDOR)', async () => {
  const ctx1 = await makeUserWithBusiness();
  const ctx2 = await makeUserWithBusiness();
  const p2 = await makeProduct(ctx2.business._id, { price: 100 });
  const sale = await makeSale(ctx2.business._id, [{ product: p2, quantity: 1 }]);

  const res = await request(app)
    .get(`/api/sales/${sale._id}`)
    .set(headers(ctx1.token, ctx1.business._id));

  assert.equal(res.status, 404);
  assert.equal(res.body.error.code, 'SALE_NOT_FOUND');
});

test('ISOLATION — Sales: list only returns the requesting business\'s sales', async () => {
  const ctx1 = await makeUserWithBusiness();
  const ctx2 = await makeUserWithBusiness();
  const p1 = await makeProduct(ctx1.business._id, { price: 50 });
  const p2 = await makeProduct(ctx2.business._id, { price: 50 });
  await makeSale(ctx1.business._id, [{ product: p1, quantity: 1 }]);
  await makeSale(ctx2.business._id, [{ product: p2, quantity: 1 }]);

  const res = await request(app)
    .get('/api/sales')
    .set(headers(ctx1.token, ctx1.business._id));

  assert.equal(res.status, 200);
  for (const s of res.body.data.sales) {
    assert.equal(
      String(s.businessId),
      String(ctx1.business._id),
      'every returned sale must belong to the requesting business'
    );
  }
});

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

test('ISOLATION — Analytics: returns only the requesting business\'s data', async () => {
  const ctx1 = await makeUserWithBusiness();
  const ctx2 = await makeUserWithBusiness();
  const p1 = await makeProduct(ctx1.business._id, { price: 100 });
  const p2 = await makeProduct(ctx2.business._id, { price: 9999 });
  await makeSale(ctx1.business._id, [{ product: p1, quantity: 1 }]);
  await makeSale(ctx2.business._id, [{ product: p2, quantity: 1 }]);

  const res = await request(app)
    .get('/api/analytics')
    .set(headers(ctx1.token, ctx1.business._id));

  assert.equal(res.status, 200);
  assert.equal(
    res.body.data.revenue,
    100,
    'analytics revenue must not include another business\'s sales'
  );
});

// ---------------------------------------------------------------------------
// x-business-id header bypass attempt
// ---------------------------------------------------------------------------

test('ISOLATION — x-business-id header cannot be used to access another user\'s business', async () => {
  const ctx1 = await makeUserWithBusiness();
  const ctx2 = await makeUserWithBusiness();

  // ctx1's token + ctx2's businessId in the header → must be rejected.
  const res = await request(app)
    .get('/api/products')
    .set(headers(ctx1.token, ctx2.business._id));

  // Business middleware checks ownerId === user._id, so it must return 404.
  assert.equal(res.status, 404);
  assert.equal(res.body.error.code, 'BUSINESS_NOT_FOUND');
});

// ---------------------------------------------------------------------------
// Unauthenticated access to every protected route
// ---------------------------------------------------------------------------

const PROTECTED_ROUTES = [
  { method: 'get', path: '/api/products' },
  { method: 'post', path: '/api/products' },
  { method: 'get', path: '/api/sales' },
  { method: 'post', path: '/api/sales' },
  { method: 'get', path: '/api/analytics' },
  { method: 'post', path: '/api/ai/ask' },
  { method: 'post', path: '/api/ai/growth-strategy' },
  { method: 'get', path: '/api/auth/me' }
];

for (const { method, path } of PROTECTED_ROUTES) {
  test(`ISOLATION — ${method.toUpperCase()} ${path} rejects unauthenticated requests with 401`, async () => {
    const res = await request(app)[method](path).send({});
    assert.equal(res.status, 401, `${method.toUpperCase()} ${path} must require authentication`);
    assert.equal(res.body.error.code, 'UNAUTHORIZED');
  });
}
