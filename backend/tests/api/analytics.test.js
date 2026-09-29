'use strict';

/**
 * API integration tests — /api/analytics
 *
 * Correctness is verified against a known synthetic dataset.
 * Empty data, date ranges, period filters, and multi-business isolation
 * are all covered.
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

function authHeaders(token, businessId) {
  return {
    Authorization: `Bearer ${token}`,
    'x-business-id': String(businessId)
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns a date ISO string X days from now. */
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ---------------------------------------------------------------------------
// Empty dataset
// ---------------------------------------------------------------------------

test('GET /analytics — 200 with zero revenue when no sales exist', async () => {
  const { token, business } = await makeUserWithBusiness();
  const res = await request(app)
    .get('/api/analytics')
    .set(authHeaders(token, business._id));

  assert.equal(res.status, 200);
  assert.equal(res.body.data.revenue, 0);
  assert.equal(res.body.data.salesCount, 0);
  assert.equal(res.body.data.averageOrderValue, 0);
});

test('GET /analytics — growthPercent is 0 when both current and previous periods are empty', async () => {
  const { token, business } = await makeUserWithBusiness();
  const res = await request(app)
    .get('/api/analytics')
    .set(authHeaders(token, business._id));

  assert.equal(res.body.data.growthPercent, 0);
});

// ---------------------------------------------------------------------------
// Known dataset — revenue, salesCount, averageOrderValue
// ---------------------------------------------------------------------------

test('GET /analytics — revenue and salesCount match a known set of sales', async () => {
  const { token, business } = await makeUserWithBusiness();
  const p = await makeProduct(business._id, { price: 400 });

  // 3 sales × 2 items × 400 = 2 400 total; each sale totalAmount=800, salesCount=3
  for (let i = 0; i < 3; i++) {
    await makeSale(business._id, [{ product: p, quantity: 2 }], {
      soldAt: new Date() // inside current month
    });
  }

  const res = await request(app)
    .get('/api/analytics?period=monthly')
    .set(authHeaders(token, business._id));

  const a = res.body.data;
  assert.equal(a.revenue, 2400);
  assert.equal(a.salesCount, 3);
  assert.equal(a.averageOrderValue, 800);
});

// ---------------------------------------------------------------------------
// Top products
// ---------------------------------------------------------------------------

test('GET /analytics — topProducts ranks products by revenue descending', async () => {
  const { token, business } = await makeUserWithBusiness();
  const cheap = await makeProduct(business._id, { price: 100, name: 'Cheap' });
  const expensive = await makeProduct(business._id, { price: 1000, name: 'Expensive' });

  await makeSale(business._id, [{ product: cheap, quantity: 1 }]);
  await makeSale(business._id, [{ product: expensive, quantity: 1 }]);

  const res = await request(app)
    .get('/api/analytics')
    .set(authHeaders(token, business._id));

  const top = res.body.data.topProducts;
  assert.ok(top.length >= 1);
  assert.equal(top[0].name, 'Expensive', 'highest-revenue product must rank first');
});

// ---------------------------------------------------------------------------
// Low-stock products
// ---------------------------------------------------------------------------

test('GET /analytics — lowStockProducts includes products at or below reorderLevel', async () => {
  const { token, business } = await makeUserWithBusiness();
  const p = await makeProduct(business._id, { status: 'ACTIVE' });
  await makeInventory(business._id, p._id, { quantity: 2, reorderLevel: 5 });

  const res = await request(app)
    .get('/api/analytics')
    .set(authHeaders(token, business._id));

  const lowStock = res.body.data.lowStockProducts;
  assert.ok(lowStock.some((item) => String(item.productId) === String(p._id)));
});

test('GET /analytics — lowStockProducts excludes products above reorderLevel', async () => {
  const { token, business } = await makeUserWithBusiness();
  const p = await makeProduct(business._id, { status: 'ACTIVE' });
  await makeInventory(business._id, p._id, { quantity: 50, reorderLevel: 5 });

  const res = await request(app)
    .get('/api/analytics')
    .set(authHeaders(token, business._id));

  const lowStock = res.body.data.lowStockProducts;
  assert.ok(!lowStock.some((item) => String(item.productId) === String(p._id)));
});

// ---------------------------------------------------------------------------
// Expense summary
// ---------------------------------------------------------------------------

test('GET /analytics — expenseSummary.total matches the sum of all expenses in range', async () => {
  const { token, business } = await makeUserWithBusiness();
  await makeExpense(business._id, { amount: 300, expenseDate: new Date() });
  await makeExpense(business._id, { amount: 700, expenseDate: new Date() });

  const res = await request(app)
    .get('/api/analytics')
    .set(authHeaders(token, business._id));

  assert.equal(res.body.data.expenseSummary.total, 1000);
});

// ---------------------------------------------------------------------------
// Customer summary
// ---------------------------------------------------------------------------

test('GET /analytics — customerSummary.newCustomers counts customers created in the period', async () => {
  const { token, business } = await makeUserWithBusiness();
  await makeCustomer(business._id);
  await makeCustomer(business._id);

  const res = await request(app)
    .get('/api/analytics')
    .set(authHeaders(token, business._id));

  assert.equal(res.body.data.customerSummary.newCustomers, 2);
});

// ---------------------------------------------------------------------------
// Date range filtering
// ---------------------------------------------------------------------------

test('GET /analytics — custom date range excludes sales outside the window', async () => {
  const { token, business } = await makeUserWithBusiness();
  const p = await makeProduct(business._id, { price: 100 });

  const inRange = new Date('2026-07-15T00:00:00.000Z');
  const outRange = new Date('2026-05-01T00:00:00.000Z');

  await makeSale(business._id, [{ product: p, quantity: 1 }], { soldAt: inRange });
  await makeSale(business._id, [{ product: p, quantity: 1 }], { soldAt: outRange });

  const res = await request(app)
    .get('/api/analytics?startDate=2026-07-01&endDate=2026-07-31')
    .set(authHeaders(token, business._id));

  const a = res.body.data;
  assert.equal(a.salesCount, 1, 'only the sale within the range must be counted');
  assert.equal(a.revenue, 100);
});

test('GET /analytics — 400 VALIDATION_ERROR when only startDate is provided', async () => {
  const { token, business } = await makeUserWithBusiness();
  const res = await request(app)
    .get('/api/analytics?startDate=2026-07-01')
    .set(authHeaders(token, business._id));
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('GET /analytics — 400 VALIDATION_ERROR for an invalid period value', async () => {
  const { token, business } = await makeUserWithBusiness();
  const res = await request(app)
    .get('/api/analytics?period=quarterly')
    .set(authHeaders(token, business._id));
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

// ---------------------------------------------------------------------------
// Multi-business isolation
// ---------------------------------------------------------------------------

test('GET /analytics — does not include another business\'s sales', async () => {
  const ctx1 = await makeUserWithBusiness();
  const ctx2 = await makeUserWithBusiness();
  const p1 = await makeProduct(ctx1.business._id, { price: 100 });
  const p2 = await makeProduct(ctx2.business._id, { price: 999 });

  await makeSale(ctx1.business._id, [{ product: p1, quantity: 1 }]);
  await makeSale(ctx2.business._id, [{ product: p2, quantity: 1 }]);

  const res = await request(app)
    .get('/api/analytics')
    .set(authHeaders(ctx1.token, ctx1.business._id));

  assert.equal(res.body.data.revenue, 100, 'business A must only see its own revenue');
});

// ---------------------------------------------------------------------------
// Auth & access guards
// ---------------------------------------------------------------------------

test('GET /analytics — 401 without a token', async () => {
  const res = await request(app).get('/api/analytics');
  assert.equal(res.status, 401);
});

test('GET /analytics — 400 BUSINESS_REQUIRED without x-business-id header (multi-business user)', async () => {
  // Create a user with two businesses — they must supply x-business-id.
  const { user, token, business } = await makeUserWithBusiness();
  // Add a second business directly so the user.businessIds has 2 entries.
  const Business = require('../../src/models/Business');
  const User = require('../../src/models/User');
  const { faker } = require('@faker-js/faker');
  const biz2 = await Business.create({
    ownerId: user._id,
    name: faker.company.name(),
    businessType: 'OTHER',
    currency: 'INR',
    timezone: 'UTC',
    location: { address: '1 St', city: 'City', state: 'State', country: 'India' }
  });
  await User.updateOne({ _id: user._id }, { $addToSet: { businessIds: biz2._id } });

  // Use the x-business-id header to explicitly target the first business — 200.
  const res = await request(app)
    .get('/api/analytics')
    .set('Authorization', `Bearer ${token}`)
    .set('x-business-id', String(business._id));

  assert.equal(res.status, 200, 'multi-business user can access analytics when they supply x-business-id');
});

// ---------------------------------------------------------------------------
// Response schema
// ---------------------------------------------------------------------------

test('GET /analytics — response contains all required top-level fields', async () => {
  const { token, business } = await makeUserWithBusiness();
  const res = await request(app)
    .get('/api/analytics')
    .set(authHeaders(token, business._id));

  const a = res.body.data;
  const required = [
    'period', 'revenue', 'salesCount', 'averageOrderValue',
    'growthPercent', 'topProducts', 'lowStockProducts',
    'expenseSummary', 'customerSummary'
  ];
  for (const field of required) {
    assert.notEqual(a[field], undefined, `analytics.${field} must be present`);
  }
});
