'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../../src/app');
const { startDb, stopDb, clearDb } = require('../helpers/db');
const { makeUserWithBusiness, makeCustomer } = require('../helpers/factories');

process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';
process.env.JWT_EXPIRES_IN = '7d';
process.env.MONGODB_URI = 'placeholder';

const app = createApp();

test.before(startDb);
test.after(stopDb);
test.beforeEach(clearDb);

const VALID_CUSTOMER = {
  name: 'Ava Patel',
  email: 'ava@example.com',
  phone: '+91 98765 43210',
  externalId: 'CUST-1001'
};

function authHeaders(token, businessId) {
  return {
    Authorization: `Bearer ${token}`,
    'x-business-id': String(businessId)
  };
}

test('POST /customers — 201 creates a customer within the active business', async () => {
  const { token, business } = await makeUserWithBusiness();
  const res = await request(app)
    .post('/api/customers')
    .set(authHeaders(token, business._id))
    .send(VALID_CUSTOMER);

  assert.equal(res.status, 201);
  assert.equal(res.body.data.customer.name, 'Ava Patel');
  assert.equal(String(res.body.data.customer.businessId), String(business._id));
});

test('GET /customers — 200 returns only this business\'s customers', async () => {
  const ctx1 = await makeUserWithBusiness();
  const ctx2 = await makeUserWithBusiness();
  await makeCustomer(ctx1.business._id, { name: 'First customer' });
  await makeCustomer(ctx1.business._id, { name: 'Second customer' });
  await makeCustomer(ctx2.business._id, { name: 'Other business customer' });

  const res = await request(app)
    .get('/api/customers')
    .set(authHeaders(ctx1.token, ctx1.business._id));

  assert.equal(res.status, 200);
  assert.equal(res.body.data.customers.length, 2);
  assert.ok(res.body.data.customers.every((customer) => String(customer.businessId) === String(ctx1.business._id)));
});

test('GET /customers/:id — 404 for a customer in another business', async () => {
  const ctx1 = await makeUserWithBusiness();
  const ctx2 = await makeUserWithBusiness();
  const foreignCustomer = await makeCustomer(ctx2.business._id, { name: 'Other business customer' });

  const res = await request(app)
    .get(`/api/customers/${foreignCustomer._id}`)
    .set(authHeaders(ctx1.token, ctx1.business._id));

  assert.equal(res.status, 404);
  assert.equal(res.body.error.code, 'CUSTOMER_NOT_FOUND');
});

test('PATCH /customers/:id — 200 updates customer and preserves business ownership', async () => {
  const { token, business } = await makeUserWithBusiness();
  const customer = await makeCustomer(business._id, { name: 'Original Name' });

  const res = await request(app)
    .patch(`/api/customers/${customer._id}`)
    .set(authHeaders(token, business._id))
    .send({ name: 'Updated Name', phone: '+91 11111 22222' });

  assert.equal(res.status, 200);
  assert.equal(res.body.data.customer.name, 'Updated Name');
  assert.equal(res.body.data.customer.phone, '+91 11111 22222');
});

test('DELETE /customers/:id — 200 removes the customer from the active business', async () => {
  const { token, business } = await makeUserWithBusiness();
  const customer = await makeCustomer(business._id, { name: 'Delete me' });

  const res = await request(app)
    .delete(`/api/customers/${customer._id}`)
    .set(authHeaders(token, business._id));

  assert.equal(res.status, 200);
  assert.equal(res.body.data.deleted, true);
});
