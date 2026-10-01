const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../../src/app');
const { startDb, stopDb, clearDb } = require('../helpers/db');

test.before(startDb);
test.after(stopDb);
test.beforeEach(clearDb);

test('GET /api/health reports API status and includes a request correlation ID', async () => {
  const response = await request(createApp()).get('/api/health');

  assert.equal(response.status, 200);
  assert.ok(response.headers['x-request-id'], 'request correlation ID should be present');
  assert.deepEqual(response.body, {
    success: true,
    data: { status: 'ok', service: 'keety-api', requestId: response.headers['x-request-id'] }
  });
});

test('CORS returns only the configured frontend origin for preflight requests', async () => {
  const app = createApp({ clientOrigin: 'http://localhost:8080' });
  const allowedResponse = await request(app)
    .options('/api/auth/register')
    .set('Origin', 'http://localhost:8080')
    .set('Access-Control-Request-Method', 'POST')
    .set('Access-Control-Request-Headers', 'content-type');
  const rejectedResponse = await request(app)
    .options('/api/auth/register')
    .set('Origin', 'http://localhost:8081')
    .set('Access-Control-Request-Method', 'POST')
    .set('Access-Control-Request-Headers', 'content-type');

  assert.equal(allowedResponse.status, 204);
  assert.equal(allowedResponse.headers['access-control-allow-origin'], 'http://localhost:8080');
  assert.match(allowedResponse.headers['access-control-allow-methods'], /POST/);
  assert.match(allowedResponse.headers['access-control-allow-headers'], /content-type/i);
  assert.equal(rejectedResponse.headers['access-control-allow-origin'], 'http://localhost:8080');
  assert.notEqual(rejectedResponse.headers['access-control-allow-origin'], 'http://localhost:8081');
});

test('GET /api/health/live and /api/health/ready behave as liveness and readiness probes', async () => {
  const liveResponse = await request(createApp()).get('/api/health/live');
  assert.equal(liveResponse.status, 200);
  assert.equal(liveResponse.body.data.status, 'live');

  const readyResponse = await request(createApp()).get('/api/health/ready');
  assert.equal(readyResponse.status, 200);
  assert.equal(readyResponse.body.data.status, 'ready');
  assert.equal(readyResponse.body.data.db, 'connected');
});

test('unknown routes use the standard error response', async () => {
  const response = await request(createApp()).get('/api/missing');

  assert.equal(response.status, 404);
  assert.equal(response.body.success, false);
  assert.equal(response.body.error.code, 'NOT_FOUND');
});