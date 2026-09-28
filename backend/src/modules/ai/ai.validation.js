const { z } = require('zod');

const askSchema = z.object({ question: z.string().trim().min(3).max(1000) }).strict();
const growthStrategySchema = z.object({ goal: z.string().trim().min(3).max(500) }).strict();

module.exports = { askSchema, growthStrategySchema };