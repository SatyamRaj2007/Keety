const { ApiError } = require('../../utils/errors');

function getAnalyticsRange(query = {}, now = new Date()) {
  if (query.startDate || query.endDate) {
    if (!query.startDate || !query.endDate) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Both startDate and endDate are required');
    }

    const start = new Date(query.startDate);
    const end = new Date(query.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Date range is invalid');
    }
    end.setUTCHours(23, 59, 59, 999);

    const duration = end.getTime() - start.getTime() + 1;
    return {
      current: { start, end: new Date(end.getTime() + 1) },
      previous: { start: new Date(start.getTime() - duration), end: start }
    };
  }

  const period = query.period || 'monthly';
  const currentStart = new Date(now);
  let nextStart;
  let previousStart;

  if (period === 'daily') {
    currentStart.setUTCHours(0, 0, 0, 0);
    nextStart = new Date(currentStart.getTime() + 24 * 60 * 60 * 1000);
    previousStart = new Date(currentStart.getTime() - 24 * 60 * 60 * 1000);
  } else if (period === 'weekly') {
    currentStart.setUTCHours(0, 0, 0, 0);
    currentStart.setUTCDate(currentStart.getUTCDate() - ((currentStart.getUTCDay() + 6) % 7));
    nextStart = new Date(currentStart);
    nextStart.setUTCDate(nextStart.getUTCDate() + 7);
    previousStart = new Date(currentStart);
    previousStart.setUTCDate(previousStart.getUTCDate() - 7);
  } else if (period === 'monthly') {
    currentStart.setUTCDate(1);
    currentStart.setUTCHours(0, 0, 0, 0);
    nextStart = new Date(Date.UTC(currentStart.getUTCFullYear(), currentStart.getUTCMonth() + 1, 1));
    previousStart = new Date(Date.UTC(currentStart.getUTCFullYear(), currentStart.getUTCMonth() - 1, 1));
  } else {
    throw new ApiError(400, 'VALIDATION_ERROR', 'period must be daily, weekly, or monthly');
  }

  return {
    current: { start: currentStart, end: nextStart },
    previous: { start: previousStart, end: currentStart }
  };
}

function calculateGrowth(current, previous) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Number((((current - previous) / previous) * 100).toFixed(2));
}

module.exports = { calculateGrowth, getAnalyticsRange };