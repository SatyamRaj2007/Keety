'use strict';

/**
 * rag.routes.js — RAG document knowledge base endpoints.
 *
 * RAG.md §10: every retrieval path must enforce tenant isolation.
 * RAG.md §15: upload → validate → parse → metadata → version → ready.
 *
 * Routes:
 *   POST   /api/rag/documents          ingest a new document
 *   GET    /api/rag/documents          list documents for the business
 *   GET    /api/rag/documents/:id      get a single document (with text)
 *   PATCH  /api/rag/documents/:id      update name/description
 *   DELETE /api/rag/documents/:id      soft-delete a document
 */

const express = require('express');
const ragController = require('./rag.controller');
const { ingestDocumentSchema, updateDocumentSchema, searchDocumentsSchema } = require('./rag.validation');
const { requireAuth } = require('../../middleware/auth.middleware');
const { requireBusiness } = require('../../middleware/business.middleware');
const { validate } = require('../../middleware/validate.middleware');

const router = express.Router();

// All RAG routes require authentication + an identified business (RAG.md §11)
router.use(requireAuth, requireBusiness);

router.post('/documents',       validate(ingestDocumentSchema), ragController.ingestDocument);
router.post('/search',           validate(searchDocumentsSchema), ragController.searchDocuments);
router.get('/documents',                                        ragController.listDocuments);
router.get('/documents/:id',                                    ragController.getDocument);
router.patch('/documents/:id',  validate(updateDocumentSchema), ragController.updateDocument);
router.delete('/documents/:id',                                 ragController.deleteDocument);

module.exports = router;
