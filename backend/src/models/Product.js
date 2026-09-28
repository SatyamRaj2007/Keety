const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  sku: { type: String, trim: true, maxlength: 80, default: '' },
  category: { type: String, trim: true, maxlength: 100, default: '' },
  description: { type: String, trim: true, maxlength: 1000, default: '' },
  price: { type: Number, required: true, min: 0 },
  costPrice: { type: Number, min: 0, default: 0 },
  unit: { type: String, trim: true, maxlength: 40, default: 'unit' },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true, collection: 'products' });

productSchema.index({ businessId: 1, createdAt: -1 });
productSchema.index({ businessId: 1, category: 1 });

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);