const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  email: { type: String, trim: true, lowercase: true, maxlength: 254, default: '' },
  phone: { type: String, trim: true, maxlength: 40, default: '' },
  externalId: { type: String, trim: true, maxlength: 100, default: '' },
  totalOrders: { type: Number, min: 0, default: 0 },
  totalSpent: { type: Number, min: 0, default: 0 },
  lastPurchaseAt: { type: Date }
}, { timestamps: true, collection: 'customers' });

customerSchema.index({ businessId: 1, createdAt: -1 });

module.exports = mongoose.models.Customer || mongoose.model('Customer', customerSchema);