const aiService = require('./ai.service');

async function ask(req, res) {
  const result = await aiService.ask(req.business, req.user, req.body.question);
  res.status(200).json({ success: true, data: result });
}

async function growthStrategy(req, res) {
  const result = await aiService.growthStrategy(req.business, req.user, req.body.goal);
  res.status(200).json({ success: true, data: result });
}

module.exports = { ask, growthStrategy };