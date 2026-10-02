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

const CHUNKING_VERSION = 'keety-basic-v1';

function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function normalizeForSearch(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeForSearch(input) {
  return normalizeForSearch(input).split(' ').filter(Boolean);
}

function chunkText(input, { maxChars = 800, overlap = 120 } = {}) {
  if (!input || typeof input !== 'string') return [];

  const safeMaxChars = Math.max(200, Number.isFinite(maxChars) ? Number(maxChars) : 800);
  const safeOverlap = Math.min(Math.max(Number(overlap) || 0, 0), Math.floor(safeMaxChars * 0.5));
  const text = input.replace(/\r\n/g, '\n').replace(/\s+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (!text) return [];

  const chunks = [];
  let start = 0;
  let chunkIndex = 0;

  while (start < text.length) {
    let end = Math.min(start + safeMaxChars, text.length);

    if (end < text.length) {
      const nearestSpace = text.lastIndexOf(' ', end);
      const nearestBreak = text.lastIndexOf('\n', end);
      const candidate = Math.max(nearestSpace, nearestBreak);
      if (candidate > start + (safeMaxChars * 0.4)) {
        end = candidate;
      }
    }

    let segment = text.slice(start, end).trim();
    if (!segment) {
      start += safeMaxChars - safeOverlap;
      continue;
    }

    if (segment.length > safeMaxChars) {
      segment = segment.slice(0, safeMaxChars).trim();
    }

    chunks.push({
      chunkId: `chunk-${chunkIndex + 1}`,
      text: segment,
      section: `section-${chunkIndex + 1}`,
      start,
      end: start + segment.length,
      contentHash: sha256(segment),
      chunkingVersion: CHUNKING_VERSION
    });

    if (end >= text.length) break;
    start = Math.max(start + safeMaxChars - safeOverlap, end - safeOverlap);
    chunkIndex += 1;
  }

  return chunks;
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

  // Reject text that is empty after cleaning (e.g. whitespace-only input)
  if (!cleanedText) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Document text must contain readable content');
  }
  const contentHash = sha256(cleanedText);
  const chunks = chunkText(cleanedText, { maxChars: 800, overlap: 120 });

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
    chunks: chunks.map((chunk, index) => ({
      chunkId: chunk.chunkId,
      text: chunk.text,
      section: `section-${index + 1}`,
      contentHash: chunk.contentHash,
      start: chunk.start,
      end: chunk.end,
      order: index,
      chunkingVersion: CHUNKING_VERSION
    })),
    wordCount: countWords(cleanedText),
    contentHash,
    version: 1,
    parserVersion: '1.0',
    chunkingVersion: CHUNKING_VERSION,
    embeddingVersion: 'keety-basic-v1',
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

async function searchDocuments(businessId, query, options = {}) {
  const safeQuery = String(query || '').trim();
  if (!safeQuery) {
    return { query: '', results: [], total: 0 };
  }

  const limit = Math.min(Math.max(Number(options.limit) || 5, 1), 20);
  const threshold = Number(options.threshold) || 0;

  const documents = await BusinessDocument.find({
    businessId,
    status: { $ne: 'DELETED' }
  }).lean();

  const scored = [];
  const queryTokens = new Set(tokenizeForSearch(safeQuery));
  const normalizedQuery = normalizeForSearch(safeQuery);

  for (const document of documents) {
    const chunks = Array.isArray(document.chunks) && document.chunks.length > 0
      ? document.chunks
      : chunkText(document.extractedText || document.name || '', { maxChars: 800, overlap: 100 });

    const matches = [];
    for (const chunk of chunks) {
      const text = chunk.text || chunk.content || '';
      const normalizedText = normalizeForSearch(text);
      if (!normalizedText) continue;

      const chunkTokens = tokenizeForSearch(text);
      const overlapCount = chunkTokens.filter((token) => queryTokens.has(token)).length;
      const phraseBoost = normalizedQuery.includes(normalizedText) || normalizedText.includes(normalizedQuery) ? 2 : 0;
      const score = overlapCount * 3 + phraseBoost + (document.name ? (normalizeForSearch(document.name).includes(normalizedQuery) ? 4 : 0) : 0);

      if (score <= threshold) continue;

      matches.push({
        chunkId: chunk.chunkId || chunk.id || `chunk-${matches.length + 1}`,
        text,
        score,
        section: chunk.section || 'document',
        contentHash: chunk.contentHash || sha256(text)
      });
    }

    if (matches.length === 0) continue;

    const bestScore = Math.max(...matches.map((match) => match.score));
    scored.push({
      document: {
        _id: document._id,
        name: document.name,
        description: document.description,
        sourceType: document.sourceType,
        status: document.status,
        documentId: document._id,
        version: document.version,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt
      },
      score: bestScore,
      matches: matches.sort((a, b) => b.score - a.score).slice(0, 5)
    });
  }

  scored.sort((a, b) => b.score - a.score);

  const results = scored.slice(0, limit);
  return {
    query: safeQuery,
    total: results.length,
    results,
    limit
  };
}

module.exports = { ingestDocument, listDocuments, getDocument, deleteDocument, updateDocument, searchDocuments, chunkText };
