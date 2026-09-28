const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../../src/app');

test('protected product routes reject requests without a bearer token', async () => {
  const response = await request(createApp()).get('/api/products');

  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, 'UNAUTHORIZED');
});

test('registration validates input before accessing the database', async () => {
  const response = await request(createApp())
    .post('/api/auth/register')
    .send({ name: '', email: 'not-an-email', password: 'short' });

  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
});