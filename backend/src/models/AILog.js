const mongoose = require('mongoose');

const aiLogSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requestType: { type: String, required: true, enum: ['ASK', 'GROWTH_STRATEGY'] },
  userPrompt: { type: String, required: true, maxlength: 2000 },
  context: { type: mongoose.Schema.Types.Mixed, default: {} },
  response: { type: String, default: '' },
  model: { type: String, default: '' },
  latencyMs: { type: Number, min: 0, default: 0 },
  status: { type: String, enum: ['SUCCESS', 'FAILED'], required: true }
}, { timestamps: { createdAt: true, updatedAt: false }, collection: 'ai_logs' });

aiLogSchema.index({ businessId: 1, createdAt: -1 });

module.exports = mongoose.models.AILog || mongoose.model('AILog', aiLogSchema);