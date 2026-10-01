const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 }
}, { _id: false });

const saleSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
  items: { type: [saleItemSchema], required: true, validate: (items) => items.length > 0 },
  subtotal: { type: Number, required: true, min: 0 },
  discount: { type: Number, min: 0, default: 0 },
  tax: { type: Number, min: 0, default: 0 },
  totalAmount: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ['CASH', 'CARD', 'UPI', 'ONLINE', 'OTHER'], default: 'OTHER' },
  status: { type: String, enum: ['COMPLETED', 'CANCELLED', 'REFUNDED'], default: 'COMPLETED' },
  soldAt: { type: Date, required: true, default: Date.now },
  idempotencyKey: { type: String, trim: true },
  idempotencyHash: { type: String, trim: true }
}, { timestamps: true, collection: 'sales' });

saleSchema.index({ businessId: 1, soldAt: -1 });
saleSchema.index(
  { businessId: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: 'string' } },
    name: 'business_idempotency_unique'
  }
);

module.exports = mongoose.models.Sale || mongoose.model('Sale', saleSchema);