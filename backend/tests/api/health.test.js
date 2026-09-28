const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../../src/app');

test('GET /api/health reports API status', async () => {
  const response = await request(createApp()).get('/api/health');

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, {
    success: true,
    data: { status: 'ok', service: 'keety-api' }
  });
});

test('unknown routes use the standard error response', async () => {
  const response = await request(createApp()).get('/api/missing');

  assert.equal(response.status, 404);
  assert.equal(response.body.success, false);
  assert.equal(response.body.error.code, 'NOT_FOUND');
});