'use strict';

const { z } = require('zod');

const SOURCE_TYPES = ['PDF', 'TEXT', 'MARKDOWN', 'HTML', 'CSV', 'OTHER'];

/**
 * Ingest a new document — client sends extracted text directly.
 * RAG.md §16: file type, size, encoding, and ownership validated server-side.
 */
const ingestDocumentSchema = z.object({
  name:             z.string().trim().min(1).max(255),
  description:      z.string().trim().max(1000).optional().default(''),
  sourceType:       z.enum(SOURCE_TYPES),
  mimeType:         z.string().trim().max(127).optional().default('text/plain'),
  text:             z.string().min(1).max(500 * 1024), // 500 KB char limit
  originalFileName: z.string().trim().max(255).optional().default(''),
  fileSizeBytes:    z.number().int().min(0).optional()
}).strict();

/**
 * Update document metadata (name / description only).
 */
const updateDocumentSchema = z.object({
  name:        z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().max(1000).optional()
}).strict();

module.exports = { ingestDocumentSchema, updateDocumentSchema };
