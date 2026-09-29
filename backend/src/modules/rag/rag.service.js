'use strict';

/**
 * rag.service.js — KEETY RAG document ingestion and lifecycle management.
 *
 * RAG.md §15: ingestion pipeline (upload → validate → parse → metadata → version → ready)
 * RAG.md §16: ingestion validation (type, size, encoding, ownership, duplicate check)
 * RAG.md §29: document versioning lifecycle
 * RAG.md §80: deletion must propagate through the full pipeline
 * RAG.md §91 anti-patterns: "no update/reindex strategy" is explicitly called out — this
 *   service provides the foundation.
 *
 * MVP scope:
 *   - Text is stored directly in MongoDB (no external storage, no vector index yet).
 *   - "Parsing" = receive client-provided plain text or extract from simple formats.
 *   - Status transitions: UPLOADED → INDEXED (success) or UPLOADED → FAILED (error).
 *   - Deletion is soft-delete only (sets status = DELETED, deletedAt = now).
 *   - The vector embedding / chunking steps are stubbed for future implementation.
 */

const crypto = require('crypto');
const mongoose = require('mongoose');
const BusinessDocument = require('../../models/BusinessDocument');
const { ApiError } = require('../../utils/errors');

// ─── Constants ─────────────────────────────────────────────────────────────

/** Maximum raw text size accepted (500 KB) — RAG.md §16 */
const MAX_TEXT_BYTES  = 500 * 1024;
/** Maximum stored document name length */
const MAX_NAME_LENGTH = 255;
/** Maximum description length */
const MAX_DESC_LENGTH = 1000;

// ─── Helpers ───────────────────────────────────────────────────────────────

function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Minimal "cleaning" step (RAG.md §19):
 *   - Collapse runs of blank lines to at most two
 *   - Trim leading/trailing whitespace
 *   - Remove invisible control chars (except \n \r \t)
 */
function cleanText(raw) {
  return raw
    .replace(/[^\S\n\r\t ]/g, '')           // remove invisible control chars
    .replace(/\r\n/g, '\n')                 // normalise CRLF
    .replace(/[ \t]+\n/g, '\n')             // strip trailing spaces on lines
    .replace(/\n{3,}/g, '\n\n')             // collapse blank lines
    .trim();
}

// ─── CRUD operations ───────────────────────────────────────────────────────

/**
 * Ingest a new document for the business.
 * RAG.md §15–§16: validate → clean → hash → store → mark INDEXED.
 *
 * @param {object} businessId  - business ObjectId
 * @param {object} userId      - uploader ObjectId
 * @param {object} input       - { name, description?, sourceType, mimeType?, text, originalFileName?, fileSizeBytes? }
 */
async function ingestDocument(businessId, userId, input) {
  const { name, description, sourceType, mimeType, text, originalFileName, fileSizeBytes } = input;

  // ── Validation (RAG.md §16) ──────────────────────────────────────────────
  if (!text || typeof text !== 'string') {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Document text content is required');
  }
  if (Buffer.byteLength(text, 'utf8') > MAX_TEXT_BYTES) {
    throw new ApiError(413, 'DOCUMENT_TOO_LARGE', `Document text must not exceed ${MAX_TEXT_BYTES / 1024} KB`);
  }

  // ── Clean and hash (RAG.md §19, §16) ─────────────────────────────────────
  const cleanedText = cleanText(text);
  const contentHash = sha256(cleanedText);

  // ── Duplicate detection (RAG.md §16: "detect duplicate content") ─────────
  const duplicate = await BusinessDocument.findOne({
    businessId,
    contentHash,
    status: { $ne: 'DELETED' }
  });
  if (duplicate) {
    throw new ApiError(409, 'DUPLICATE_DOCUMENT',
      `A document with identical content already exists: "${duplicate.name}"`);
  }

  // ── Persist document (status INDEXED for plain text — no async pipeline needed) ──
  const doc = await BusinessDocument.create({
    businessId,
    uploadedBy: userId,
    name: name.trim().slice(0, MAX_NAME_LENGTH),
    description: (description || '').trim().slice(0, MAX_DESC_LENGTH),
    sourceType,
    mimeType: mimeType || 'text/plain',
    extractedText: cleanedText,
    wordCount: countWords(cleanedText),
    contentHash,
    version: 1,
    parserVersion: '1.0',
    originalFileName: (originalFileName || '').slice(0, 255),
    fileSizeBytes: fileSizeBytes || Buffer.byteLength(text, 'utf8'),
    status: 'INDEXED',
    indexedAt: new Date()
  });

  return doc;
}

/**
 * List documents for a business (excludes DELETED).
 * RAG.md §80: deleted documents must not be returned.
 */
async function listDocuments(businessId, { page = 1, limit = 20, status } = {}) {
  const safePage  = Math.max(Number.parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 20, 1), 50);

  const filter = {
    businessId,
    status: { $ne: 'DELETED' }
  };
  if (status && ['UPLOADED', 'PROCESSING', 'INDEXED', 'FAILED'].includes(status)) {
    filter.status = status;
  }

  const [documents, total] = await Promise.all([
    BusinessDocument.find(filter)
      .select('-extractedText')   // omit large text blob from list responses
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    BusinessDocument.countDocuments(filter)
  ]);

  return { documents, pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) } };
}

/**
 * Get a single document (IDOR protected — businessId must match).
 * RAG.md §11: tenant isolation enforced by ownership check.
 */
async function getDocument(businessId, documentId) {
  if (!mongoose.isValidObjectId(documentId)) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Document ID is invalid');
  }
  const doc = await BusinessDocument.findOne({
    _id: documentId,
    businessId,
    status: { $ne: 'DELETED' }
  });
  if (!doc) {
    throw new ApiError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
  }
  return doc;
}

/**
 * Soft-delete a document.
 * RAG.md §80: status = DELETED, deletedAt set, document no longer returned by list/get.
 * Future: this is the hook point for vector index cleanup and cache invalidation.
 */
async function deleteDocument(businessId, documentId) {
  if (!mongoose.isValidObjectId(documentId)) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Document ID is invalid');
  }
  const doc = await BusinessDocument.findOne({
    _id: documentId,
    businessId,
    status: { $ne: 'DELETED' }
  });
  if (!doc) {
    throw new ApiError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
  }

  doc.status    = 'DELETED';
  doc.deletedAt = new Date();
  await doc.save();

  // TODO (RAG.md §80): when vector index exists, enqueue a cleanup job here
  //   await vectorIndex.deleteChunksByDocumentId(documentId);
  //   await cache.invalidateByDocument(documentId);

  return { deleted: true, documentId: doc._id };
}

/**
 * Update document metadata (name / description only — not content).
 * Content changes should be a new version upload, not an edit.
 */
async function updateDocument(businessId, documentId, input) {
  if (!mongoose.isValidObjectId(documentId)) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Document ID is invalid');
  }
  const doc = await BusinessDocument.findOne({
    _id: documentId,
    businessId,
    status: { $ne: 'DELETED' }
  });
  if (!doc) {
    throw new ApiError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
  }

  if (input.name !== undefined)        doc.name        = input.name.trim().slice(0, MAX_NAME_LENGTH);
  if (input.description !== undefined) doc.description = input.description.trim().slice(0, MAX_DESC_LENGTH);

  await doc.save();
  return doc;
}

module.exports = { ingestDocument, listDocuments, getDocument, deleteDocument, updateDocument };
