'use strict';

/**
 * Unit tests — auth service
 *
 * Covers: register, login, toPublicUser.
 * Uses MongoMemoryServer so real DB behaviour (unique indexes, field
 * selection) is exercised without side-effects on any real environment.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { startDb, stopDb, clearDb } = require('../helpers/db');
const { makeUser, DEFAULT_PASSWORD } = require('../helpers/factories');
const { register, login } = require('../../src/modules/auth/auth.service');

// Ensure env vars satisfy getEnv() validation before any module that calls it loads.
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';
process.env.JWT_EXPIRES_IN = '7d';
process.env.MONGODB_URI = 'placeholder'; // overridden by MongoMemoryServer

test.before(startDb);
test.after(stopDb);
test.beforeEach(clearDb);

// ---------------------------------------------------------------------------
// register
// ---------------------------------------------------------------------------

test('register — creates a user and returns a signed JWT with public fields', async () => {
  const result = await register({ name: 'Alice', email: 'alice@example.test', password: 'Password1!' });

  assert.ok(result.token, 'token must be present');
  assert.equal(result.user.email, 'alice@example.test');
  assert.equal(result.user.name, 'Alice');
  assert.equal(result.user.role, 'OWNER');
  assert.ok(result.user.id, 'public user must expose id');
  assert.equal(result.user.passwordHash, undefined, 'passwordHash must not be returned');

  // Token must decode to the correct subject.
  const payload = jwt.decode(result.token);
  assert.equal(payload.sub, String(result.user.id));
});

test('register — normalises email to lowercase before persisting', async () => {
  const result = await register({ name: 'Bob', email: 'BOB@Example.TEST', password: 'Password1!' });
  assert.equal(result.user.email, 'bob@example.test');
});

test('register — stores a bcrypt hash, not the plain-text password', async () => {
  const User = require('../../src/models/User');
  await register({ name: 'Carol', email: 'carol@example.test', password: 'Password1!' });
  const stored = await User.findOne({ email: 'carol@example.test' }).select('+passwordHash');

  assert.ok(stored.passwordHash, 'passwordHash must be stored');
  assert.notEqual(stored.passwordHash, 'Password1!');
  assert.ok(await bcrypt.compare('Password1!', stored.passwordHash));
});

test('register — throws 409 EMAIL_IN_USE when the email is already taken', async () => {
  await register({ name: 'Dave', email: 'dave@example.test', password: 'Password1!' });

  await assert.rejects(
    () => register({ name: 'Dave2', email: 'dave@example.test', password: 'Password1!' }),
    (err) => {
      assert.equal(err.statusCode, 409);
      assert.equal(err.code, 'EMAIL_IN_USE');
      return true;
    }
  );
});

test('register — EMAIL_IN_USE is case-insensitive (normalised before duplicate check)', async () => {
  await register({ name: 'Eve', email: 'eve@example.test', password: 'Password1!' });

  await assert.rejects(
    () => register({ name: 'Eve2', email: 'EVE@EXAMPLE.TEST', password: 'Password1!' }),
    (err) => {
      assert.equal(err.statusCode, 409);
      assert.equal(err.code, 'EMAIL_IN_USE');
      return true;
    }
  );
});

// ---------------------------------------------------------------------------
// login
// ---------------------------------------------------------------------------

test('login — returns user and token for correct credentials', async () => {
  await register({ name: 'Frank', email: 'frank@example.test', password: 'Password1!' });
  const result = await login({ email: 'frank@example.test', password: 'Password1!' });

  assert.ok(result.token);
  assert.equal(result.user.email, 'frank@example.test');
  assert.equal(result.user.passwordHash, undefined);
});

test('login — is case-insensitive on the email field', async () => {
  await register({ name: 'Grace', email: 'grace@example.test', password: 'Password1!' });
  const result = await login({ email: 'GRACE@EXAMPLE.TEST', password: 'Password1!' });
  assert.equal(result.user.email, 'grace@example.test');
});

test('login — throws 401 INVALID_CREDENTIALS for a wrong password', async () => {
  await register({ name: 'Heidi', email: 'heidi@example.test', password: 'Password1!' });

  await assert.rejects(
    () => login({ email: 'heidi@example.test', password: 'WrongPassword!' }),
    (err) => {
      assert.equal(err.statusCode, 401);
      assert.equal(err.code, 'INVALID_CREDENTIALS');
      return true;
    }
  );
});

test('login — throws 401 INVALID_CREDENTIALS for an unknown email', async () => {
  await assert.rejects(
    () => login({ email: 'nobody@example.test', password: 'Password1!' }),
    (err) => {
      assert.equal(err.statusCode, 401);
      assert.equal(err.code, 'INVALID_CREDENTIALS');
      return true;
    }
  );
});

test('login — throws 401 INVALID_CREDENTIALS for an inactive user', async () => {
  await makeUser({ email: 'inactive@example.test', isActive: false });

  await assert.rejects(
    () => login({ email: 'inactive@example.test', password: DEFAULT_PASSWORD }),
    (err) => {
      assert.equal(err.statusCode, 401);
      assert.equal(err.code, 'INVALID_CREDENTIALS');
      return true;
    }
  );
});

test('login — updates lastLoginAt on every successful login', async () => {
  const User = require('../../src/models/User');
  await register({ name: 'Ivan', email: 'ivan@example.test', password: 'Password1!' });
  const before = new Date();
  await login({ email: 'ivan@example.test', password: 'Password1!' });
  const stored = await User.findOne({ email: 'ivan@example.test' });

  assert.ok(stored.lastLoginAt >= before, 'lastLoginAt must be updated after login');
});

test('login — does not expose passwordHash in the returned user object', async () => {
  await register({ name: 'Judy', email: 'judy@example.test', password: 'Password1!' });
  const result = await login({ email: 'judy@example.test', password: 'Password1!' });
  assert.equal(result.user.passwordHash, undefined);
});
