'use strict';

const mongoose = require('mongoose');

const automationSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  automationId: { type: String, required: true, trim: true, uppercase: false, unique: true },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  purpose: { type: String, required: true, trim: true, maxlength: 500 },
  triggerType: { type: String, enum: ['MANUAL', 'SCHEDULED', 'EVENT', 'WEBHOOK'], default: 'MANUAL' },
  tenantScope: { type: String, enum: ['BUSINESS', 'USER'], default: 'BUSINESS' },
  status: { type: String, enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'DISABLED'], default: 'ACTIVE' },
  inputSchema: { type: Object, default: {} },
  queue: { type: String, default: 'default' },
  priority: { type: Number, min: 0, max: 1000, default: 100 },
  timeoutMs: { type: Number, min: 1000, max: 3600000, default: 60000 },
  retryPolicy: {
    maxAttempts: { type: Number, min: 0, max: 20, default: 3 },
    backoffMs: { type: Number, min: 100, max: 600000, default: 2000 },
    retryableErrors: { type: [String], default: ['TRANSIENT', 'TIMEOUT'] }
  },
  idempotencyStrategy: { type: String, enum: ['KEYED', 'NONE'], default: 'KEYED' },
  concurrencyLimit: { type: Number, min: 1, max: 100, default: 1 },
  dependencies: { type: [String], default: [] },
  blastRadius: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'LOW' },
  observability: {
    requestIdRequired: { type: Boolean, default: true },
    logLevel: { type: String, enum: ['INFO', 'WARN', 'ERROR'], default: 'INFO' }
  },
  recoveryStrategy: { type: String, enum: ['REQUEUE', 'MANUAL', 'NONE'], default: 'REQUEUE' },
  version: { type: String, default: '1.0.0' },
  enabled: { type: Boolean, default: true },
  lastReviewedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true, collection: 'automations' });

automationSchema.index({ businessId: 1, name: 1 }, { unique: true });
automationSchema.index({ enabled: 1, status: 1, createdAt: -1 });

const automationRunSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  automationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Automation', required: true, index: true },
  runId: { type: String, required: true, trim: true, unique: true },
  automationName: { type: String, required: true, trim: true },
  queue: { type: String, default: 'default' },
  status: { type: String, enum: ['QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'DEAD_LETTER'], default: 'QUEUED' },
  payload: { type: Object, default: {} },
  result: { type: Object, default: null },
  error: { type: Object, default: null },
  idempotencyKey: { type: String, trim: true, default: null },
  correlationId: { type: String, trim: true, default: null },
  attempts: { type: Number, min: 0, default: 0 },
  maxAttempts: { type: Number, min: 1, default: 3 },
  startedAt: { type: Date },
  completedAt: { type: Date },
  scheduledFor: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true, collection: 'automation_runs' });

automationRunSchema.index({ businessId: 1, automationId: 1, idempotencyKey: 1 }, { unique: true, sparse: true, name: 'automation_run_idempotency' });
automationRunSchema.index({ businessId: 1, status: 1, scheduledFor: 1 });

const Automation = mongoose.models.Automation || mongoose.model('Automation', automationSchema);
const AutomationRun = mongoose.models.AutomationRun || mongoose.model('AutomationRun', automationRunSchema);

module.exports = { Automation, AutomationRun };
