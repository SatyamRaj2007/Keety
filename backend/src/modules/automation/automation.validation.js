const { z } = require('zod');

const createAutomationSchema = z.object({
  name: z.string().trim().min(1).max(160),
  purpose: z.string().trim().min(1).max(500),
  triggerType: z.enum(['MANUAL', 'SCHEDULED', 'EVENT', 'WEBHOOK']).optional(),
  tenantScope: z.enum(['BUSINESS', 'USER']).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'DISABLED']).optional(),
  inputSchema: z.record(z.any()).optional(),
  queue: z.string().trim().min(1).max(80).optional(),
  priority: z.number().int().min(0).max(1000).optional(),
  timeoutMs: z.number().int().min(1000).max(3600000).optional(),
  retryPolicy: z.object({
    maxAttempts: z.number().int().min(0).max(20).optional(),
    backoffMs: z.number().int().min(100).max(600000).optional(),
    retryableErrors: z.array(z.string()).optional()
  }).optional(),
  idempotencyStrategy: z.enum(['KEYED', 'NONE']).optional(),
  concurrencyLimit: z.number().int().min(1).max(100).optional(),
  dependencies: z.array(z.string()).optional(),
  blastRadius: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  observability: z.object({
    requestIdRequired: z.boolean().optional(),
    logLevel: z.enum(['INFO', 'WARN', 'ERROR']).optional()
  }).optional(),
  recoveryStrategy: z.enum(['REQUEUE', 'MANUAL', 'NONE']).optional(),
  version: z.string().trim().min(1).max(20).optional(),
  enabled: z.boolean().optional(),
  automationId: z.string().trim().min(1).max(80).optional()
}).strict();

const runAutomationSchema = z.object({
  payload: z.record(z.any()).default({}),
  idempotencyKey: z.string().trim().min(1).max(128).optional(),
  correlationId: z.string().trim().min(1).max(128).optional()
}).strict();

module.exports = { createAutomationSchema, runAutomationSchema };
