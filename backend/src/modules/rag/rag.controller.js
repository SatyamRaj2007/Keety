'use strict';

/**
 * rag.controller.js — RAG document endpoint handlers.
 *
 * All operations are scoped to req.business (resolved + ownership-verified
 * by the requireBusiness middleware) so cross-tenant access is impossible
 * at the service layer. RAG.md §10–§11.
 */

const ragService = require('./rag.service');

async function ingestDocument(req, res) {
  const doc = await ragService.ingestDocument(req.businessId, req.user._id, req.body);
  res.status(201).json({ success: true, data: { document: doc } });
}

async function listDocuments(req, res) {
  const result = await ragService.listDocuments(req.businessId, req.query);
  res.status(200).json({ success: true, data: result });
}

async function getDocument(req, res) {
  const doc = await ragService.getDocument(req.businessId, req.params.id);
  res.status(200).json({ success: true, data: { document: doc } });
}

async function deleteDocument(req, res) {
  const result = await ragService.deleteDocument(req.businessId, req.params.id);
  res.status(200).json({ success: true, data: result });
}

async function updateDocument(req, res) {
  const doc = await ragService.updateDocument(req.businessId, req.params.id, req.body);
  res.status(200).json({ success: true, data: { document: doc } });
}

module.exports = { ingestDocument, listDocuments, getDocument, deleteDocument, updateDocument };
