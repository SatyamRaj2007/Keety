const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateGrowth, getAnalyticsRange } = require('../../src/modules/analytics/analytics.utils');

test('growth remains finite when the previous period has no revenue', () => {
  assert.equal(calculateGrowth(0, 0), 0);
  assert.equal(calculateGrowth(25, 0), 100);
  assert.equal(Number.isFinite(calculateGrowth(25, 0)), true);
});

test('monthly analytics uses the current and immediately previous calendar month', () => {
  const range = getAnalyticsRange({ period: 'monthly' }, new Date('2026-09-28T12:00:00.000Z'));

  assert.equal(range.current.start.toISOString(), '2026-09-01T00:00:00.000Z');
  assert.equal(range.current.end.toISOString(), '2026-10-01T00:00:00.000Z');
  assert.equal(range.previous.start.toISOString(), '2026-08-01T00:00:00.000Z');
});