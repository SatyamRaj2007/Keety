'use strict';

const { randomUUID } = require('node:crypto');
const { Automation, AutomationRun } = require('../../models/Automation');
const { ApiError } = require('../../utils/errors');

function normalizeAutomationInput(input = {}) {
  return {
    automationId: input.automationId || `automation-${randomUUID().slice(0, 12)}`,
    name: input.name,
    purpose: input.purpose,
    triggerType: input.triggerType || 'MANUAL',
    tenantScope: input.tenantScope || 'BUSINESS',
    status: input.status || 'ACTIVE',
    inputSchema: input.inputSchema || {},
    queue: input.queue || 'default',
    priority: Number(input.priority ?? 100),
    timeoutMs: Number(input.timeoutMs ?? 60000),
    retryPolicy: {
      maxAttempts: Number(input.retryPolicy?.maxAttempts ?? 3),
      backoffMs: Number(input.retryPolicy?.backoffMs ?? 2000),
      retryableErrors: Array.isArray(input.retryPolicy?.retryableErrors)
        ? input.retryPolicy.retryableErrors
        : ['TRANSIENT', 'TIMEOUT']
    },
    idempotencyStrategy: input.idempotencyStrategy || 'KEYED',
    concurrencyLimit: Number(input.concurrencyLimit ?? 1),
    dependencies: Array.isArray(input.dependencies) ? input.dependencies : [],
    blastRadius: input.blastRadius || 'LOW',
    observability: {
      requestIdRequired: input.observability?.requestIdRequired ?? true,
      logLevel: input.observability?.logLevel || 'INFO'
    },
    recoveryStrategy: input.recoveryStrategy || 'REQUEUE',
    version: input.version || '1.0.0',
    enabled: input.enabled !== false,
    lastReviewedAt: new Date()
  };
}

async function createAutomation(businessId, userId, input) {
  const payload = normalizeAutomationInput(input);

  const automation = await Automation.create({
    businessId,
    createdBy: userId,
    ...payload
  });

  return automation;
}

async function listAutomations(businessId) {
  return Automation.find({ businessId }).sort({ createdAt: -1 }).lean();
}

async function getAutomation(businessId, automationId) {
  if (!automationId) throw new ApiError(400, 'VALIDATION_ERROR', 'Automation ID is required');

  const automation = await Automation.findOne({ _id: automationId, businessId }).lean();
  if (!automation) throw new ApiError(404, 'AUTOMATION_NOT_FOUND', 'Automation not found');
  return automation;
}

async function enqueueAutomationRun(businessId, automationId, input = {}) {
  const automation = await Automation.findOne({ _id: automationId, businessId });
  if (!automation) throw new ApiError(404, 'AUTOMATION_NOT_FOUND', 'Automation not found');

  const payload = input.payload || {};
  const idempotencyKey = input.idempotencyKey || `auto:${automationId}:${JSON.stringify(payload)}`;
  const correlationId = input.correlationId || `auto-cor-${Date.now()}`;

  const existing = await AutomationRun.findOne({
    businessId,
    automationId: automation._id,
    idempotencyKey
  }).lean();

  if (existing) {
    if (existing.status === 'SUCCEEDED') return { run: existing, duplicate: true };
    if (existing.status === 'FAILED') return { run: existing, duplicate: true };
  }

  const run = await AutomationRun.create({
    businessId,
    automationId: automation._id,
    automationName: automation.name,
    runId: `run-${randomUUID().slice(0, 12)}`,
    queue: automation.queue,
    payload,
    idempotencyKey,
    correlationId,
    maxAttempts: automation.retryPolicy.maxAttempts || 3,
    attempts: 0,
    createdBy: input.userId || null,
    scheduledFor: new Date()
  });

  const result = await executeAutomationRun(run, automation);
  return { run: result, duplicate: false };
}

async function executeAutomationRun(run, automation) {
  run.status = 'RUNNING';
  run.startedAt = new Date();
  run.attempts += 1;
  await run.save();

  try {
    const payload = run.payload || {};
    const action = payload.action || 'PING';

    if (payload.fail === true) {
      throw new Error('Forced automation failure');
    }

    const result = {
      ok: true,
      action,
      automationId: String(automation._id),
      businessId: String(run.businessId),
      message: payload.message || 'Automation executed successfully',
      receivedAt: new Date().toISOString(),
      processedBy: 'keety-automation-worker'
    };

    run.status = 'SUCCEEDED';
    run.result = result;
    run.completedAt = new Date();
    await run.save();
    return run;
  } catch (error) {
    run.status = 'FAILED';
    run.error = {
      code: 'AUTOMATION_EXECUTION_FAILED',
      message: error.message
    };
    run.completedAt = new Date();
    await run.save();
    return run;
  }
}

async function listRuns(businessId, query = {}) {
  const automationId = query.automationId;
  const filter = { businessId };
  if (automationId) filter.automationId = automationId;

  return AutomationRun.find(filter).sort({ createdAt: -1 }).lean();
}

async function getRun(businessId, runId) {
  const run = await AutomationRun.findOne({ businessId, runId }).lean();
  if (!run) throw new ApiError(404, 'AUTOMATION_RUN_NOT_FOUND', 'Automation run not found');
  return run;
}

module.exports = {
  createAutomation,
  listAutomations,
  getAutomation,
  enqueueAutomationRun,
  listRuns,
  getRun
};
