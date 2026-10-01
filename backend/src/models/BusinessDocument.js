'use strict';

/**
 * BusinessDocument — persists business-uploaded knowledge documents.
 *
 * RAG.md §12: every document must have unambiguous tenant ownership.
 * RAG.md §25: minimum metadata contract.
 * RAG.md §29: explicit document lifecycle states.
 * RAG.md §80: deletion must propagate through the full pipeline.
 *
 * Lifecycle states (RAG.md §29):
 *   UPLOADED    → file received, not yet processed
 *   PROCESSING  → text extraction / chunking in progress
 *   INDEXED     → ready for retrieval (future vector index)
 *   FAILED      → ingestion pipeline error
 *   DELETED     → soft-deleted; must not be retrievable
 */

const mongoose = require('mongoose');

const DOCUMENT_STATUSES = ['UPLOADED', 'PROCESSING', 'INDEXED', 'FAILED', 'DELETED'];
const SOURCE_TYPES = ['PDF', 'TEXT', 'MARKDOWN', 'HTML', 'CSV', 'OTHER'];

const businessDocumentSchema = new mongoose.Schema({
  // ─── Tenant ownership (RAG.md §10–§11) ─────────────────────────────────
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // ─── Document identity ───────────────────────────────────────────────────
  name:         { type: String, required: true, trim: true, maxlength: 255 },
  description:  { type: String, trim: true, maxlength: 1000, default: '' },
  sourceType:   { type: String, enum: SOURCE_TYPES, required: true },
  mimeType:     { type: String, trim: true, maxlength: 127, default: '' },

  // ─── Content (stored text, not binary; binary stored externally) ─────────
  // For MVP: raw extracted text is stored here directly and we also persist
  // chunk-level metadata so retrieval remains tenant-scoped and auditable.
  extractedText: { type: String, default: '' },
  chunks: [{
    chunkId: { type: String, trim: true, required: true },
    text: { type: String, required: true },
    section: { type: String, trim: true, default: '' },
    contentHash: { type: String, trim: true, default: '' },
    start: { type: Number, min: 0, default: 0 },
    end: { type: Number, min: 0, default: 0 },
    order: { type: Number, min: 0, default: 0 }
  }],
  wordCount:     { type: Number, min: 0, default: 0 },

  // ─── Versioning & integrity (RAG.md §29, §87) ───────────────────────────
  contentHash:      { type: String, default: '' },  // SHA-256 of original content
  version:          { type: Number, min: 1, default: 1 },
  parserVersion:    { type: String, default: '1.0' },
  chunkingVersion:  { type: String, default: '' },
  embeddingVersion: { type: String, default: '' },   // populated when vector index exists

  // ─── File metadata ───────────────────────────────────────────────────────
  originalFileName: { type: String, trim: true, maxlength: 255, default: '' },
  fileSizeBytes:    { type: Number, min: 0, default: 0 },
  storageUrl:       { type: String, trim: true, default: '' },  // external storage ref

  // ─── Lifecycle (RAG.md §26) ─────────────────────────────────────────────
  status: {
    type: String,
    enum: DOCUMENT_STATUSES,
    default: 'UPLOADED',
    required: true
  },
  processingError: { type: String, default: '' },
  indexedAt:       { type: Date },
  deletedAt:       { type: Date },

  // ─── Access control ──────────────────────────────────────────────────────
  // Future: fine-grained per-role access. Default: accessible to business owner.
  accessLevel: { type: String, enum: ['BUSINESS_OWNER', 'ALL_MEMBERS'], default: 'BUSINESS_OWNER' }

}, {
  timestamps: true,
  collection: 'business_documents'
});

// Primary tenant-scoped listing (RAG.md §10)
businessDocumentSchema.index({ businessId: 1, status: 1, createdAt: -1 });
// Fast lookup by status for background processing jobs
businessDocumentSchema.index({ status: 1, createdAt: 1 });

module.exports = mongoose.models.BusinessDocument
  || mongoose.model('BusinessDocument', businessDocumentSchema);
