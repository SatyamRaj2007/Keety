'use strict';

/**
 * API integration tests — /api/auth
 *
 * Covers: POST /register, POST /login, GET /me
 * Every test exercises the full Express stack (middleware → controller → service → DB).
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../../src/app');
const { startDb, stopDb, clearDb } = require('../helpers/db');
const { makeAuthUser, makeUser, DEFAULT_PASSWORD } = require('../helpers/factories');

process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';
process.env.JWT_EXPIRES_IN = '7d';
process.env.MONGODB_URI = 'placeholder';

const app = createApp();

test.before(startDb);
test.after(stopDb);
test.beforeEach(clearDb);

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------

test('POST /register — 201 with user object and token on valid input', async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Alice',
    email: 'alice@example.test',
    password: 'Password1!'
  });

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.user.email, 'alice@example.test');
  assert.ok(res.body.data.token, 'token must be present');
  assert.equal(res.body.data.user.passwordHash, undefined, 'passwordHash must not be exposed');
});

test('POST /register — 400 VALIDATION_ERROR when name is empty', async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: '',
    email: 'test@example.test',
    password: 'Password1!'
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('POST /register — 400 VALIDATION_ERROR for a malformed email address', async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Bob',
    email: 'not-an-email',
    password: 'Password1!'
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('POST /register — 400 VALIDATION_ERROR when password is too short', async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Carol',
    email: 'carol@example.test',
    password: 'short'
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('POST /register — 400 VALIDATION_ERROR for extra fields (strict schema)', async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Dave',
    email: 'dave@example.test',
    password: 'Password1!',
    role: 'ADMIN' // not allowed
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('POST /register — 409 EMAIL_IN_USE when email is already registered', async () => {
  await request(app).post('/api/auth/register').send({
    name: 'Eve',
    email: 'eve@example.test',
    password: 'Password1!'
  });
  const res = await request(app).post('/api/auth/register').send({
    name: 'Eve2',
    email: 'eve@example.test',
    password: 'Password1!'
  });
  assert.equal(res.status, 409);
  assert.equal(res.body.error.code, 'EMAIL_IN_USE');
});

test('POST /register — 409 EMAIL_IN_USE is case-insensitive', async () => {
  await request(app).post('/api/auth/register').send({
    name: 'Frank',
    email: 'frank@example.test',
    password: 'Password1!'
  });
  const res = await request(app).post('/api/auth/register').send({
    name: 'Frank2',
    email: 'FRANK@EXAMPLE.TEST',
    password: 'Password1!'
  });
  assert.equal(res.status, 409);
  assert.equal(res.body.error.code, 'EMAIL_IN_USE');
});

test('POST /register — 400 INVALID_JSON for a malformed JSON body', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .set('Content-Type', 'application/json')
    .send('{bad json}');
  assert.equal(res.status, 400);
});

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------

test('POST /login — 200 with user and token on correct credentials', async () => {
  await request(app).post('/api/auth/register').send({
    name: 'Grace',
    email: 'grace@example.test',
    password: 'Password1!'
  });
  const res = await request(app).post('/api/auth/login').send({
    email: 'grace@example.test',
    password: 'Password1!'
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.data.token);
  assert.equal(res.body.data.user.email, 'grace@example.test');
});

test('POST /login — 401 INVALID_CREDENTIALS for wrong password', async () => {
  await request(app).post('/api/auth/register').send({
    name: 'Heidi',
    email: 'heidi@example.test',
    password: 'Password1!'
  });
  const res = await request(app).post('/api/auth/login').send({
    email: 'heidi@example.test',
    password: 'WrongPassword!'
  });
  assert.equal(res.status, 401);
  assert.equal(res.body.error.code, 'INVALID_CREDENTIALS');
});

test('POST /login — 401 INVALID_CREDENTIALS for an unknown email', async () => {
  const res = await request(app).post('/api/auth/login').send({
    email: 'nobody@example.test',
    password: 'Password1!'
  });
  assert.equal(res.status, 401);
  assert.equal(res.body.error.code, 'INVALID_CREDENTIALS');
});

test('POST /login — 401 INVALID_CREDENTIALS for an inactive account', async () => {
  await makeUser({ email: 'inactive@example.test', isActive: false });
  const res = await request(app).post('/api/auth/login').send({
    email: 'inactive@example.test',
    password: DEFAULT_PASSWORD
  });
  assert.equal(res.status, 401);
  assert.equal(res.body.error.code, 'INVALID_CREDENTIALS');
});

test('POST /login — 400 VALIDATION_ERROR when password field is missing', async () => {
  const res = await request(app).post('/api/auth/login').send({
    email: 'someone@example.test'
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('POST /login — response never includes passwordHash', async () => {
  await request(app).post('/api/auth/register').send({
    name: 'Ivan',
    email: 'ivan@example.test',
    password: 'Password1!'
  });
  const res = await request(app).post('/api/auth/login').send({
    email: 'ivan@example.test',
    password: 'Password1!'
  });
  assert.equal(res.body.data?.user?.passwordHash, undefined);
  // Also make sure the raw JSON string doesn't contain the hash substring.
  assert.ok(!JSON.stringify(res.body).includes('passwordHash'));
});

// ---------------------------------------------------------------------------
// GET /api/auth/me
// ---------------------------------------------------------------------------

test('GET /me — 200 with current user for a valid token', async () => {
  const { user, token } = await makeAuthUser({ email: 'judy@example.test' });
  const res = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  // auth middleware selects _id, role, isActive, businessIds (not name/email for perf).
  assert.equal(String(res.body.data.user.id), String(user._id));
  assert.equal(res.body.data.user.role, 'OWNER');
});

test('GET /me — 401 UNAUTHORIZED without a token', async () => {
  const res = await request(app).get('/api/auth/me');
  assert.equal(res.status, 401);
  assert.equal(res.body.error.code, 'UNAUTHORIZED');
});

test('GET /me — 401 UNAUTHORIZED for an expired token', async () => {
  const jwt = require('jsonwebtoken');
  // Sign a token that expired 1 second ago.
  const expiredToken = jwt.sign(
    { role: 'OWNER' },
    process.env.JWT_SECRET,
    { subject: 'fake-id', expiresIn: -1 }
  );
  const res = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${expiredToken}`);
  assert.equal(res.status, 401);
  assert.equal(res.body.error.code, 'UNAUTHORIZED');
});

test('GET /me — 401 UNAUTHORIZED for a tampered token', async () => {
  const { token } = await makeAuthUser();
  const tampered = token.slice(0, -5) + 'XXXXX';
  const res = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${tampered}`);
  assert.equal(res.status, 401);
  assert.equal(res.body.error.code, 'UNAUTHORIZED');
});

test('GET /me — 401 UNAUTHORIZED for a token with wrong scheme (Basic)', async () => {
  const { token } = await makeAuthUser();
  const res = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Basic ${token}`);
  assert.equal(res.status, 401);
  assert.equal(res.body.error.code, 'UNAUTHORIZED');
});

test('GET /me — 401 when the user account is deactivated after token issuance', async () => {
  const User = require('../../src/models/User');
  const { user, token } = await makeAuthUser();
  await User.updateOne({ _id: user._id }, { isActive: false });

  const res = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 401);
  assert.equal(res.body.error.code, 'UNAUTHORIZED');
});

// ---------------------------------------------------------------------------
// Error response schema
// ---------------------------------------------------------------------------

test('error responses always use the standard { success, error: { code, message } } shape', async () => {
  const res = await request(app).post('/api/auth/login').send({
    email: 'nobody@example.test',
    password: 'any'
  });
  assert.equal(res.body.success, false);
  assert.ok(res.body.error);
  assert.ok(res.body.error.code);
  assert.ok(res.body.error.message);
});
