'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../../src/app');
const { startDb, stopDb, clearDb } = require('../helpers/db');
const { makeUserWithBusiness } = require('../helpers/factories');

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

test('POST /api/automation/definitions — 201 registers an automation', async () => {
  const { user, token, business } = await makeUserWithBusiness();

  const res = await request(app)
    .post('/api/automation/definitions')
    .set(authHeaders(token, business._id))
    .send({
      name: 'Daily sales summary',
      purpose: 'Send a daily sales summary to the business owner',
      triggerType: 'SCHEDULED',
      timeoutMs: 60000,
      priority: 100,
      concurrencyLimit: 1,
      blastRadius: 'LOW',
      recoveryStrategy: 'REQUEUE',
      version: '1.0.0'
    });

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.automation.name, 'Daily sales summary');
  assert.equal(res.body.data.automation.businessId, String(business._id));
});

test('POST /api/automation/definitions/:id/run — duplicate idempotency key returns the same run', async () => {
  const { token, business } = await makeUserWithBusiness();

  const createDef = await request(app)
    .post('/api/automation/definitions')
    .set(authHeaders(token, business._id))
    .send({
      name: 'Sales sync',
      purpose: 'Sync sales summary reports',
      triggerType: 'MANUAL',
      timeoutMs: 45000,
      priority: 50,
      concurrencyLimit: 1,
      blastRadius: 'MEDIUM',
      recoveryStrategy: 'REQUEUE',
      version: '1.0.0'
    });

  const automationId = createDef.body.data.automation._id;
  const payload = { action: 'PING', message: 'hello business' };

  const first = await request(app)
    .post(`/api/automation/definitions/${automationId}/run`)
    .set(authHeaders(token, business._id))
    .send({ payload, idempotencyKey: 'sync-001' });

  const second = await request(app)
    .post(`/api/automation/definitions/${automationId}/run`)
    .set(authHeaders(token, business._id))
    .send({ payload, idempotencyKey: 'sync-001' });

  assert.equal(first.status, 201);
  assert.equal(second.status, 200);
  assert.equal(String(second.body.data.run._id), String(first.body.data.run._id));
  assert.equal(second.body.data.run.status, 'SUCCEEDED');
});
