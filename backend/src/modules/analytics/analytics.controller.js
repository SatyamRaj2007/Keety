const analyticsService = require('./analytics.service');

async function getAnalytics(req, res) {
  const analytics = await analyticsService.getAnalytics(req.businessId, req.query);
  res.status(200).json({ success: true, data: analytics });
}

module.exports = { getAnalytics };