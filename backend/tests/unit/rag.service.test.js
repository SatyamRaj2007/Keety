'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { startDb, stopDb, clearDb } = require('../helpers/db');
const { makeUserWithBusiness } = require('../helpers/factories');
const { ingestDocument, searchDocuments, chunkText } = require('../../src/modules/rag/rag.service');

process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';
process.env.JWT_EXPIRES_IN = '7d';
process.env.MONGODB_URI = 'placeholder';

test.before(startDb);
test.after(stopDb);
test.beforeEach(clearDb);

test('chunkText — splits long text into overlapping chunks', () => {
  const text = 'Word '.repeat(1200);
  const chunks = chunkText(text, { maxChars: 400, overlap: 80 });

  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => chunk.text.length <= 400));
  assert.ok(chunks[0].text.startsWith('Word'));
  assert.ok(chunks[0].text === chunks[0].text.trim());
});

test('searchDocuments — returns tenant-scoped, relevant document chunks', async () => {
  const { user, business } = await makeUserWithBusiness();

  await ingestDocument(business._id, user._id, {
    name: 'Return policy',
    description: 'Customer policy info',
    sourceType: 'TEXT',
    text: 'Our policy allows returns within 30 days for unused items. Customers can request a refund after inspection.'
  });

  await ingestDocument(business._id, user._id, {
    name: 'Staff handbook',
    description: 'Operations guide',
    sourceType: 'TEXT',
    text: 'Staff should greet customers politely and record all incidents in the system.'
  });

  const result = await searchDocuments(business._id, 'return refund within 30 days');

  assert.equal(result.total, 1);
  assert.equal(result.results[0].document.name, 'Return policy');
  assert.ok(result.results[0].matches.some((match) => match.text.includes('return')));
});

test('searchDocuments — excludes deleted documents and cross-business hits', async () => {
  const { user, business } = await makeUserWithBusiness();
  const other = await makeUserWithBusiness();

  const doc = await ingestDocument(business._id, user._id, {
    name: 'Pricing guide',
    description: 'Pricing and promotions',
    sourceType: 'TEXT',
    text: 'Weekend discount is 10 percent off all accessories.'
  });

  await ingestDocument(other.business._id, other.user._id, {
    name: 'Pricing guide',
    description: 'Other tenant',
    sourceType: 'TEXT',
    text: 'Weekend discount is 10 percent off all accessories.'
  });

  await require('../../src/modules/rag/rag.service').deleteDocument(business._id, doc._id.toString());

  const result = await searchDocuments(business._id, 'discount');
  assert.equal(result.total, 0);
  assert.deepEqual(result.results, []);
});
