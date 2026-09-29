'use strict';

/**
 * Unit tests — analytics.utils (calculateGrowth + getAnalyticsRange)
 *
 * Replaces the original 2-test file with extended coverage:
 * daily, weekly, monthly periods, custom date ranges, boundary values,
 * invalid inputs.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateGrowth, getAnalyticsRange } = require('../../src/modules/analytics/analytics.utils');

// ---------------------------------------------------------------------------
// calculateGrowth
// ---------------------------------------------------------------------------

test('calculateGrowth — returns 0 when both current and previous are 0', () => {
  assert.equal(calculateGrowth(0, 0), 0);
});

test('calculateGrowth — returns 100 when previous is 0 and current is positive', () => {
  assert.equal(calculateGrowth(25, 0), 100);
  assert.equal(Number.isFinite(calculateGrowth(25, 0)), true);
});

test('calculateGrowth — returns 0 when current and previous are equal', () => {
  assert.equal(calculateGrowth(500, 500), 0);
});

test('calculateGrowth — returns correct positive growth percentage', () => {
  // (150 - 100) / 100 * 100 = 50
  assert.equal(calculateGrowth(150, 100), 50);
});

test('calculateGrowth — returns correct negative growth percentage', () => {
  // (50 - 100) / 100 * 100 = -50
  assert.equal(calculateGrowth(50, 100), -50);
});

test('calculateGrowth — rounds to 2 decimal places', () => {
  // (101 - 300) / 300 * 100 = -66.33...
  const result = calculateGrowth(101, 300);
  assert.equal(result, -66.33);
});

// ---------------------------------------------------------------------------
// getAnalyticsRange — monthly period
// ---------------------------------------------------------------------------

test('monthly range — current period is the full calendar month containing now', () => {
  const now = new Date('2026-09-28T12:00:00.000Z');
  const range = getAnalyticsRange({ period: 'monthly' }, now);

  assert.equal(range.current.start.toISOString(), '2026-09-01T00:00:00.000Z');
  assert.equal(range.current.end.toISOString(), '2026-10-01T00:00:00.000Z');
});

test('monthly range — previous period is the immediately prior calendar month', () => {
  const now = new Date('2026-09-28T12:00:00.000Z');
  const range = getAnalyticsRange({ period: 'monthly' }, now);

  assert.equal(range.previous.start.toISOString(), '2026-08-01T00:00:00.000Z');
  assert.equal(range.previous.end.toISOString(), '2026-09-01T00:00:00.000Z');
});

test('monthly range — handles January correctly (previous month is prior December)', () => {
  const now = new Date('2026-01-15T00:00:00.000Z');
  const range = getAnalyticsRange({ period: 'monthly' }, now);

  assert.equal(range.current.start.toISOString(), '2026-01-01T00:00:00.000Z');
  assert.equal(range.previous.start.toISOString(), '2025-12-01T00:00:00.000Z');
  assert.equal(range.previous.end.toISOString(), '2026-01-01T00:00:00.000Z');
});

// ---------------------------------------------------------------------------
// getAnalyticsRange — weekly period
// ---------------------------------------------------------------------------

test('weekly range — current week starts on Monday (UTC)', () => {
  // 2026-09-28 is a Monday.
  const range = getAnalyticsRange({ period: 'weekly' }, new Date('2026-09-28T10:00:00.000Z'));
  assert.equal(range.current.start.toISOString(), '2026-09-28T00:00:00.000Z');
});

test('weekly range — mid-week date rolls back to the Monday of that week', () => {
  // 2026-10-01 is a Thursday.
  const range = getAnalyticsRange({ period: 'weekly' }, new Date('2026-10-01T10:00:00.000Z'));
  assert.equal(range.current.start.toISOString(), '2026-09-28T00:00:00.000Z');
  assert.equal(range.current.end.toISOString(), '2026-10-05T00:00:00.000Z');
});

test('weekly range — previous period is exactly one week before the current start', () => {
  const range = getAnalyticsRange({ period: 'weekly' }, new Date('2026-09-28T10:00:00.000Z'));
  assert.equal(range.previous.start.toISOString(), '2026-09-21T00:00:00.000Z');
  assert.equal(range.previous.end.toISOString(), '2026-09-28T00:00:00.000Z');
});

// ---------------------------------------------------------------------------
// getAnalyticsRange — daily period
// ---------------------------------------------------------------------------

test('daily range — current period is midnight-to-midnight UTC for the given day', () => {
  const range = getAnalyticsRange({ period: 'daily' }, new Date('2026-09-28T15:30:00.000Z'));
  assert.equal(range.current.start.toISOString(), '2026-09-28T00:00:00.000Z');
  assert.equal(range.current.end.toISOString(), '2026-09-29T00:00:00.000Z');
});

test('daily range — previous period is the full preceding day', () => {
  const range = getAnalyticsRange({ period: 'daily' }, new Date('2026-09-28T15:30:00.000Z'));
  assert.equal(range.previous.start.toISOString(), '2026-09-27T00:00:00.000Z');
  assert.equal(range.previous.end.toISOString(), '2026-09-28T00:00:00.000Z');
});

// ---------------------------------------------------------------------------
// getAnalyticsRange — custom date range
// ---------------------------------------------------------------------------

test('custom range — current period spans exactly the supplied dates', () => {
  const range = getAnalyticsRange({
    startDate: '2026-07-01',
    endDate: '2026-07-31'
  });
  assert.equal(range.current.start.toISOString(), '2026-07-01T00:00:00.000Z');
  // end is set to 23:59:59.999, then +1ms = midnight of next day.
  assert.equal(range.current.end.toISOString(), '2026-08-01T00:00:00.000Z');
});

test('custom range — previous period mirrors the duration immediately before the current start', () => {
  // 31-day range: July 1 00:00 → Aug 1 00:00 (duration = 31 days exactly).
  // Previous start = July 1 - 31 days = May 31.
  const range = getAnalyticsRange({
    startDate: '2026-07-01',
    endDate: '2026-07-31'
  });
  assert.equal(range.previous.start.toISOString(), '2026-05-31T00:00:00.000Z');
  assert.equal(range.previous.end.toISOString(), '2026-07-01T00:00:00.000Z');
});

// ---------------------------------------------------------------------------
// getAnalyticsRange — invalid inputs
// ---------------------------------------------------------------------------

test('custom range — throws 400 when only startDate is provided', () => {
  assert.throws(
    () => getAnalyticsRange({ startDate: '2026-07-01' }),
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.equal(err.code, 'VALIDATION_ERROR');
      return true;
    }
  );
});

test('custom range — throws 400 when only endDate is provided', () => {
  assert.throws(
    () => getAnalyticsRange({ endDate: '2026-07-31' }),
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.equal(err.code, 'VALIDATION_ERROR');
      return true;
    }
  );
});

test('custom range — throws 400 when endDate is before startDate', () => {
  assert.throws(
    () => getAnalyticsRange({ startDate: '2026-07-31', endDate: '2026-07-01' }),
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.equal(err.code, 'VALIDATION_ERROR');
      return true;
    }
  );
});

test('custom range — throws 400 for non-parseable date strings', () => {
  assert.throws(
    () => getAnalyticsRange({ startDate: 'not-a-date', endDate: '2026-07-31' }),
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.equal(err.code, 'VALIDATION_ERROR');
      return true;
    }
  );
});

test('getAnalyticsRange — throws 400 for an unrecognised period string', () => {
  assert.throws(
    () => getAnalyticsRange({ period: 'quarterly' }),
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.equal(err.code, 'VALIDATION_ERROR');
      return true;
    }
  );
});

test('getAnalyticsRange — defaults to monthly when no period or dates are supplied', () => {
  const now = new Date('2026-09-15T00:00:00.000Z');
  const range = getAnalyticsRange({}, now);
  assert.equal(range.current.start.toISOString(), '2026-09-01T00:00:00.000Z');
});
