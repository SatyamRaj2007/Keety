'use strict';

/**
 * RAG pipeline integration tests — full end-to-end via HTTP.
 *
 * Covers every layer per workflow.md §testing:
 *   A. Normal cases (ingest, list, get, update, delete, search)
 *   B. Boundary cases (empty text, max size, duplicate)
 *   C. Invalid inputs (bad ObjectId, missing fields, wrong types)
 *   D. Empty states (no documents, empty search)
 *   E. Error cases (not found, already deleted)
 *   F. Security cases (IDOR, unauthenticated, cross-tenant)
 *   G. Integration cases (ingest → list → get → update → delete lifecycle)
 *   H. AI context integration (documents injected into AI context)
 */

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function headers(token, businessId) {
  return { Authorization: `Bearer ${token}`, 'x-business-id': String(businessId) };
}

const VALID_DOC = {
  name: 'Return Policy',
  description: 'How customers can return items',
  sourceType: 'TEXT',
  text: 'Customers can return unused items within 30 days for a full refund. Items must be in original packaging.'
};

// ─── A. Normal cases ──────────────────────────────────────────────────────────

test('RAG — POST /rag/documents creates document with status INDEXED', async () => {
  const { token, business } = await makeUserWithBusiness();

  const res = await request(app)
    .post('/api/rag/documents')
    .set(headers(token, business._id))
    .send(VALID_DOC);

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  const doc = res.body.data.document;
  assert.equal(doc.name, 'Return Policy');
  assert.equal(doc.status, 'INDEXED');
  assert.equal(doc.sourceType, 'TEXT');
  assert.ok(doc.wordCount > 0, 'wordCount should be positive');
  assert.ok(doc.contentHash, 'contentHash must be set');
  assert.equal(doc.version, 1);
  assert.ok(doc.indexedAt, 'indexedAt must be set');
  assert.equal(String(doc.businessId), String(business._id));
});

test('RAG — GET /rag/documents lists documents for the business', async () => {
  const { token, business } = await makeUserWithBusiness();

  await request(app).post('/api/rag/documents').set(headers(token, business._id)).send(VALID_DOC);
  await request(app).post('/api/rag/documents').set(headers(token, business._id)).send({
    ...VALID_DOC, name: 'Staff Handbook', text: 'All staff must sign in before their shift begins each morning.'
  });

  const res = await request(app).get('/api/rag/documents').set(headers(token, business._id));

  assert.equal(res.status, 200);
  assert.equal(res.body.data.documents.length, 2);
  assert.equal(res.body.data.pagination.total, 2);
  // extractedText should NOT appear in list response (large field omitted)
  assert.equal(res.body.data.documents[0].extractedText, undefined);
});

test('RAG — GET /rag/documents/:id returns full document with extractedText', async () => {
  const { token, business } = await makeUserWithBusiness();

  const created = await request(app).post('/api/rag/documents')
    .set(headers(token, business._id)).send(VALID_DOC);
  const docId = created.body.data.document._id;

  const res = await request(app).get(`/api/rag/documents/${docId}`).set(headers(token, business._id));

  assert.equal(res.status, 200);
  assert.ok(res.body.data.document.extractedText, 'full text must be returned on single get');
  assert.equal(res.body.data.document._id, docId);
});

test('RAG — PATCH /rag/documents/:id updates name and description only', async () => {
  const { token, business } = await makeUserWithBusiness();

  const created = await request(app).post('/api/rag/documents')
    .set(headers(token, business._id)).send(VALID_DOC);
  const docId = created.body.data.document._id;
  const originalHash = created.body.data.document.contentHash;

  const res = await request(app)
    .patch(`/api/rag/documents/${docId}`)
    .set(headers(token, business._id))
    .send({ name: 'Updated Return Policy v2', description: 'Revised policy' });

  assert.equal(res.status, 200);
  assert.equal(res.body.data.document.name, 'Updated Return Policy v2');
  assert.equal(res.body.data.document.description, 'Revised policy');
  // Content hash must NOT change — only metadata was updated
  assert.equal(res.body.data.document.contentHash, originalHash, 'contentHash must remain unchanged after metadata update');
});

test('RAG — DELETE /rag/documents/:id soft-deletes document', async () => {
  const { token, business } = await makeUserWithBusiness();

  const created = await request(app).post('/api/rag/documents')
    .set(headers(token, business._id)).send(VALID_DOC);
  const docId = created.body.data.document._id;

  const deleteRes = await request(app)
    .delete(`/api/rag/documents/${docId}`)
    .set(headers(token, business._id));
  assert.equal(deleteRes.status, 200);
  assert.equal(deleteRes.body.data.deleted, true);

  // Deleted document must not appear in list
  const listRes = await request(app).get('/api/rag/documents').set(headers(token, business._id));
  assert.equal(listRes.body.data.documents.length, 0, 'deleted document must not appear in list');

  // Deleted document must not be retrievable by ID
  const getRes = await request(app).get(`/api/rag/documents/${docId}`).set(headers(token, business._id));
  assert.equal(getRes.status, 404, 'deleted document must return 404');
});

test('RAG — POST /rag/search returns relevant chunks from indexed documents', async () => {
  const { token, business } = await makeUserWithBusiness();

  await request(app).post('/api/rag/documents').set(headers(token, business._id)).send({
    name: 'Return Policy',
    sourceType: 'TEXT',
    text: 'Items can be returned within 30 days for a full refund. Damaged items are excluded from returns.'
  });
  await request(app).post('/api/rag/documents').set(headers(token, business._id)).send({
    name: 'Opening Hours',
    sourceType: 'TEXT',
    text: 'The store is open Monday to Saturday from 9am to 8pm. Sunday hours are 10am to 6pm.'
  });

  const res = await request(app)
    .post('/api/rag/search')
    .set(headers(token, business._id))
    .send({ query: 'return refund policy', limit: 3 });

  assert.equal(res.status, 200);
  assert.ok(res.body.data.results.length > 0, 'should find relevant documents');
  // Most relevant result should be the return policy, not the hours
  assert.equal(res.body.data.results[0].document.name, 'Return Policy');
  assert.ok(res.body.data.results[0].matches.length > 0, 'should have matching chunks');
  assert.ok(res.body.data.results[0].score > 0, 'result must have positive relevance score');
});

// ─── B. Boundary cases ────────────────────────────────────────────────────────

test('RAG — duplicate content is rejected with 409 DUPLICATE_DOCUMENT', async () => {
  const { token, business } = await makeUserWithBusiness();

  await request(app).post('/api/rag/documents')
    .set(headers(token, business._id)).send(VALID_DOC);

  const res = await request(app).post('/api/rag/documents')
    .set(headers(token, business._id)).send({ ...VALID_DOC, name: 'Same content, different name' });

  assert.equal(res.status, 409);
  assert.equal(res.body.error.code, 'DUPLICATE_DOCUMENT');
});

test('RAG — whitespace-only text normalises to empty and is rejected', async () => {
  const { token, business } = await makeUserWithBusiness();

  const res = await request(app).post('/api/rag/documents')
    .set(headers(token, business._id))
    .send({ ...VALID_DOC, text: '   \n\n\t   ' });

  // Either 400 VALIDATION_ERROR or the cleaned text is '' which fails the min(1) check
  assert.ok([400, 422].includes(res.status), `expected 400 or 422, got ${res.status}`);
});

test('RAG — search with empty query returns 400 VALIDATION_ERROR', async () => {
  const { token, business } = await makeUserWithBusiness();

  const res = await request(app)
    .post('/api/rag/search')
    .set(headers(token, business._id))
    .send({ query: '   ' });

  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('RAG — search with no documents returns empty results', async () => {
  const { token, business } = await makeUserWithBusiness();

  const res = await request(app)
    .post('/api/rag/search')
    .set(headers(token, business._id))
    .send({ query: 'anything' });

  assert.equal(res.status, 200);
  assert.equal(res.body.data.total, 0);
  assert.deepEqual(res.body.data.results, []);
});

test('RAG — search returns at most `limit` results', async () => {
  const { token, business } = await makeUserWithBusiness();

  // Ingest 5 different documents all containing "promotion"
  for (let i = 1; i <= 5; i++) {
    await request(app).post('/api/rag/documents').set(headers(token, business._id)).send({
      name: `Promo Guide ${i}`,
      sourceType: 'TEXT',
      text: `Promotion ${i}: seasonal discount applies to selected items during the festival week.`
    });
  }

  const res = await request(app)
    .post('/api/rag/search')
    .set(headers(token, business._id))
    .send({ query: 'promotion discount', limit: 2 });

  assert.equal(res.status, 200);
  assert.ok(res.body.data.results.length <= 2, 'results must be capped at limit');
});

// ─── C. Invalid inputs ────────────────────────────────────────────────────────

test('RAG — ingest with missing name returns 400 VALIDATION_ERROR', async () => {
  const { token, business } = await makeUserWithBusiness();
  const { name: _n, ...withoutName } = VALID_DOC;

  const res = await request(app).post('/api/rag/documents')
    .set(headers(token, business._id)).send(withoutName);

  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('RAG — ingest with missing text returns 400 VALIDATION_ERROR', async () => {
  const { token, business } = await makeUserWithBusiness();
  const { text: _t, ...withoutText } = VALID_DOC;

  const res = await request(app).post('/api/rag/documents')
    .set(headers(token, business._id)).send(withoutText);

  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('RAG — ingest with invalid sourceType returns 400 VALIDATION_ERROR', async () => {
  const { token, business } = await makeUserWithBusiness();

  const res = await request(app).post('/api/rag/documents')
    .set(headers(token, business._id))
    .send({ ...VALID_DOC, sourceType: 'WORD_DOCUMENT' });

  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('RAG — GET /rag/documents/:id with invalid ObjectId returns 400', async () => {
  const { token, business } = await makeUserWithBusiness();

  const res = await request(app).get('/api/rag/documents/not-valid-id')
    .set(headers(token, business._id));

  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('RAG — DELETE /rag/documents/:id with invalid ObjectId returns 400', async () => {
  const { token, business } = await makeUserWithBusiness();

  const res = await request(app).delete('/api/rag/documents/bad-id')
    .set(headers(token, business._id));

  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('RAG — PATCH with extra fields (strict schema) returns 400', async () => {
  const { token, business } = await makeUserWithBusiness();

  const created = await request(app).post('/api/rag/documents')
    .set(headers(token, business._id)).send(VALID_DOC);
  const docId = created.body.data.document._id;

  const res = await request(app)
    .patch(`/api/rag/documents/${docId}`)
    .set(headers(token, business._id))
    .send({ name: 'New Name', contentHash: 'hacked-hash', status: 'DELETED' });

  assert.equal(res.status, 400, 'strict schema should reject extra fields');
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

// ─── D. Empty state ───────────────────────────────────────────────────────────

test('RAG — list with no documents returns empty array and zero total', async () => {
  const { token, business } = await makeUserWithBusiness();

  const res = await request(app).get('/api/rag/documents').set(headers(token, business._id));

  assert.equal(res.status, 200);
  assert.deepEqual(res.body.data.documents, []);
  assert.equal(res.body.data.pagination.total, 0);
});

// ─── E. Error cases ───────────────────────────────────────────────────────────

test('RAG — GET non-existent document returns 404 DOCUMENT_NOT_FOUND', async () => {
  const { token, business } = await makeUserWithBusiness();

  const res = await request(app)
    .get('/api/rag/documents/507f1f77bcf86cd799439099')
    .set(headers(token, business._id));

  assert.equal(res.status, 404);
  assert.equal(res.body.error.code, 'DOCUMENT_NOT_FOUND');
});

test('RAG — DELETE non-existent document returns 404 DOCUMENT_NOT_FOUND', async () => {
  const { token, business } = await makeUserWithBusiness();

  const res = await request(app)
    .delete('/api/rag/documents/507f1f77bcf86cd799439099')
    .set(headers(token, business._id));

  assert.equal(res.status, 404);
  assert.equal(res.body.error.code, 'DOCUMENT_NOT_FOUND');
});

test('RAG — double-deleting a document returns 404 on second attempt', async () => {
  const { token, business } = await makeUserWithBusiness();

  const created = await request(app).post('/api/rag/documents')
    .set(headers(token, business._id)).send(VALID_DOC);
  const docId = created.body.data.document._id;

  await request(app).delete(`/api/rag/documents/${docId}`).set(headers(token, business._id));

  const second = await request(app).delete(`/api/rag/documents/${docId}`).set(headers(token, business._id));
  assert.equal(second.status, 404, 'second delete must return 404 — document is already gone');
});

// ─── F. Security / tenant isolation ──────────────────────────────────────────

test('RAG — unauthenticated request returns 401 (all RAG endpoints)', async () => {
  const endpoints = [
    { method: 'post', path: '/api/rag/documents' },
    { method: 'get',  path: '/api/rag/documents' },
    { method: 'post', path: '/api/rag/search' },
  ];
  for (const { method, path } of endpoints) {
    const res = await request(app)[method](path).send({});
    assert.equal(res.status, 401, `${method.toUpperCase()} ${path} must require auth`);
    assert.equal(res.body.error.code, 'UNAUTHORIZED');
  }
});

test('RAG — user cannot read a document belonging to another business (IDOR)', async () => {
  const ctx1 = await makeUserWithBusiness();
  const ctx2 = await makeUserWithBusiness();

  // ctx1 uploads a document
  const created = await request(app).post('/api/rag/documents')
    .set(headers(ctx1.token, ctx1.business._id)).send(VALID_DOC);
  const docId = created.body.data.document._id;

  // ctx2 tries to read it using their own businessId header
  const res = await request(app).get(`/api/rag/documents/${docId}`)
    .set(headers(ctx2.token, ctx2.business._id));

  assert.equal(res.status, 404, 'cross-tenant document read must be denied');
  assert.equal(res.body.error.code, 'DOCUMENT_NOT_FOUND');
});

test('RAG — user cannot delete a document belonging to another business (IDOR)', async () => {
  const ctx1 = await makeUserWithBusiness();
  const ctx2 = await makeUserWithBusiness();

  const created = await request(app).post('/api/rag/documents')
    .set(headers(ctx1.token, ctx1.business._id)).send(VALID_DOC);
  const docId = created.body.data.document._id;

  const res = await request(app).delete(`/api/rag/documents/${docId}`)
    .set(headers(ctx2.token, ctx2.business._id));

  assert.equal(res.status, 404, 'cross-tenant delete must be denied');

  // Document must still exist for ctx1
  const getRes = await request(app).get(`/api/rag/documents/${docId}`)
    .set(headers(ctx1.token, ctx1.business._id));
  assert.equal(getRes.status, 200, 'original owner must still be able to access the document');
});

test('RAG — search only returns documents from the requesting business (isolation)', async () => {
  const ctx1 = await makeUserWithBusiness();
  const ctx2 = await makeUserWithBusiness();

  // Both businesses have a document about "refund policy"
  await request(app).post('/api/rag/documents').set(headers(ctx1.token, ctx1.business._id)).send({
    name: 'Ctx1 Refund Policy',
    sourceType: 'TEXT',
    text: 'Ctx1 allows full refund within 7 days of purchase.'
  });
  await request(app).post('/api/rag/documents').set(headers(ctx2.token, ctx2.business._id)).send({
    name: 'Ctx2 Refund Policy',
    sourceType: 'TEXT',
    text: 'Ctx2 refund policy: contact support within 14 days.'
  });

  // ctx1 searches — must only see its own document
  const res = await request(app)
    .post('/api/rag/search')
    .set(headers(ctx1.token, ctx1.business._id))
    .send({ query: 'refund policy' });

  assert.equal(res.status, 200);
  const names = res.body.data.results.map((r) => r.document.name);
  assert.ok(names.includes('Ctx1 Refund Policy'), 'own document must be returned');
  assert.ok(!names.includes('Ctx2 Refund Policy'), 'other tenant document must NEVER appear');
});

test('RAG — list only returns documents for the requesting business', async () => {
  const ctx1 = await makeUserWithBusiness();
  const ctx2 = await makeUserWithBusiness();

  await request(app).post('/api/rag/documents').set(headers(ctx1.token, ctx1.business._id)).send(VALID_DOC);
  await request(app).post('/api/rag/documents').set(headers(ctx2.token, ctx2.business._id)).send({
    ...VALID_DOC, name: 'Other business doc', text: 'Completely different content for testing isolation.'
  });

  const res = await request(app).get('/api/rag/documents').set(headers(ctx1.token, ctx1.business._id));

  assert.equal(res.body.data.pagination.total, 1, 'must only see own documents');
  assert.equal(res.body.data.documents[0].name, 'Return Policy');
});

// ─── G. Full document lifecycle ───────────────────────────────────────────────

test('RAG — complete lifecycle: ingest → list → search → update → get → delete', async () => {
  const { token, business } = await makeUserWithBusiness();

  // 1. Ingest
  const ingestRes = await request(app).post('/api/rag/documents')
    .set(headers(token, business._id))
    .send({
      name: 'Shipping Policy',
      sourceType: 'TEXT',
      description: 'How we handle shipping and delivery',
      text: 'We offer free shipping on orders above ₹500. Standard delivery takes 3-5 business days. Express delivery is available for ₹99.'
    });
  assert.equal(ingestRes.status, 201);
  const docId = ingestRes.body.data.document._id;

  // 2. Appears in list
  const listRes = await request(app).get('/api/rag/documents').set(headers(token, business._id));
  assert.equal(listRes.body.data.pagination.total, 1);

  // 3. Searchable
  const searchRes = await request(app).post('/api/rag/search')
    .set(headers(token, business._id)).send({ query: 'free shipping delivery' });
  assert.ok(searchRes.body.data.results.length > 0, 'document must be found by search');

  // 4. Update metadata
  const updateRes = await request(app).patch(`/api/rag/documents/${docId}`)
    .set(headers(token, business._id)).send({ name: 'Shipping & Delivery Policy v2' });
  assert.equal(updateRes.body.data.document.name, 'Shipping & Delivery Policy v2');

  // 5. Retrievable with full text
  const getRes = await request(app).get(`/api/rag/documents/${docId}`).set(headers(token, business._id));
  assert.equal(getRes.body.data.document.name, 'Shipping & Delivery Policy v2');
  assert.ok(getRes.body.data.document.extractedText.includes('free shipping'));

  // 6. Soft-delete
  await request(app).delete(`/api/rag/documents/${docId}`).set(headers(token, business._id));

  // 7. Gone from list
  const finalList = await request(app).get('/api/rag/documents').set(headers(token, business._id));
  assert.equal(finalList.body.data.pagination.total, 0);

  // 8. Gone from search
  const finalSearch = await request(app).post('/api/rag/search')
    .set(headers(token, business._id)).send({ query: 'free shipping' });
  assert.equal(finalSearch.body.data.total, 0, 'deleted document must not appear in search');
});

// ─── H. AI context integration ───────────────────────────────────────────────

test('RAG — searchDocuments service returns correct structure for AI context assembly', async () => {
  const { user, business } = await makeUserWithBusiness();
  const { ingestDocument, searchDocuments } = require('../../src/modules/rag/rag.service');

  await ingestDocument(business._id, user._id, {
    name: 'Product Warranty Guide',
    sourceType: 'TEXT',
    text: 'All electronics products come with a 1-year manufacturer warranty. To claim warranty, customers must present the original purchase receipt.'
  });

  const result = await searchDocuments(business._id, 'warranty claim electronics', { limit: 3 });

  // Verify the structure the AI context module expects
  assert.ok(Array.isArray(result.results), 'results must be an array');
  assert.ok(result.results.length > 0, 'must find the warranty document');

  const hit = result.results[0];
  // ai.context.js maps: { id, name, description, sourceType, excerpt, score }
  assert.ok(hit.document._id, 'must have document _id');
  assert.ok(hit.document.name, 'must have document name');
  assert.ok(Array.isArray(hit.matches), 'must have matches array');
  assert.ok(hit.matches[0].text, 'match must have text excerpt');
  assert.ok(typeof hit.score === 'number' && hit.score > 0, 'must have positive score');
});

test('RAG — chunks are stored in BusinessDocument and used for retrieval', async () => {
  const { user, business } = await makeUserWithBusiness();
  const { ingestDocument } = require('../../src/modules/rag/rag.service');
  const BusinessDocument = require('../../src/models/BusinessDocument');

  const longText = [
    'Section 1: Our store offers a wide range of products. We pride ourselves on quality and customer service.',
    'Section 2: Return policy allows customers to return items within 30 days of purchase.',
    'Section 3: Loyalty programme members earn 1 point per ₹10 spent. Points expire after 12 months.',
    'Section 4: Contact us at support@example.com for any queries or complaints.'
  ].join('\n\n');

  const doc = await ingestDocument(business._id, user._id, {
    name: 'Store Policy Document',
    sourceType: 'TEXT',
    text: longText
  });

  // Chunks should be persisted
  const stored = await BusinessDocument.findById(doc._id).lean();
  assert.ok(Array.isArray(stored.chunks), 'chunks must be stored in DB');
  assert.ok(stored.chunks.length > 0, 'at least one chunk must exist');
  assert.ok(stored.chunks[0].chunkId, 'each chunk must have a chunkId');
  assert.ok(stored.chunks[0].text, 'each chunk must have text');
  assert.ok(stored.chunks[0].contentHash, 'each chunk must have a contentHash');
});

test('RAG — ai.context.js searchBusinessDocuments gracefully handles no documents', async () => {
  const { user, business } = await makeUserWithBusiness();
  const { assembleContext } = require('../../src/modules/ai/ai.context');

  // No documents uploaded — context assembly must not throw
  const result = await assembleContext(
    { _id: business._id, name: 'Test Shop', businessType: 'CLOTHING', currency: 'INR', timezone: 'UTC', description: '', settings: { aiEnabled: true } },
    'ask',
    { period: 'monthly', question: 'What is our return policy?' }
  );

  assert.ok(result.context, 'context must be assembled');
  assert.ok(Array.isArray(result.context.relevantDocuments), 'relevantDocuments must be an array');
  assert.equal(result.context.relevantDocuments.length, 0, 'no docs → empty relevantDocuments (no crash)');
});

test('RAG — ai.context.js injects document excerpts into context when documents exist', async () => {
  const { user, business } = await makeUserWithBusiness();
  const { ingestDocument } = require('../../src/modules/rag/rag.service');
  const { assembleContext } = require('../../src/modules/ai/ai.context');

  await ingestDocument(business._id, user._id, {
    name: 'Return Policy',
    sourceType: 'TEXT',
    text: 'Customers may return items within 30 days of purchase for a full refund. Items must be in original packaging and unused.'
  });

  const result = await assembleContext(
    { _id: business._id, name: 'Test Shop', businessType: 'CLOTHING', currency: 'INR', timezone: 'UTC', description: '', settings: { aiEnabled: true } },
    'ask',
    { period: 'monthly', question: 'What is our return policy?' }
  );

  assert.ok(result.context.relevantDocuments.length > 0, 'relevant documents must be injected into AI context');
  const doc = result.context.relevantDocuments[0];
  assert.equal(doc.name, 'Return Policy');
  assert.ok(doc.excerpt, 'excerpt must be present in context');
  assert.ok(typeof doc.score === 'number', 'score must be a number');
  // Verify the dataNote is still present (AI grounding instruction)
  assert.ok(result.context.dataNote, 'dataNote must be present');
});
