const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  type: {
    type: String,
    required: true,
    enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'BUSINESS_ANALYSIS', 'GROWTH_STRATEGY', 'PRODUCT_ANALYSIS', 'INVENTORY_ANALYSIS']
  },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  summary: { type: String, trim: true, maxlength: 5000, default: '' },
  insights: [{
    title: { type: String, required: true },
    description: { type: String, required: true },
    metric: { type: String, default: '' },
    value: { type: Number },
    changePercent: { type: Number },
    severity: { type: String, default: 'INFO' }
  }],
  recommendations: [{
    title: { type: String, required: true },
    description: { type: String, required: true },
    priority: { type: String, default: 'MEDIUM' },
    reason: { type: String, default: '' }
  }],
  period: { startDate: { type: Date }, endDate: { type: Date } },
  generatedBy: { type: String, default: 'KEETY' }
}, { timestamps: true, collection: 'reports' });

reportSchema.index({ businessId: 1, createdAt: -1 });

module.exports = mongoose.models.Report || mongoose.model('Report', reportSchema);