const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, min: 0, required: true, default: 0 },
  reservedQuantity: { type: Number, min: 0, default: 0 },
  reorderLevel: { type: Number, min: 0, default: 5 },
  lastUpdatedAt: { type: Date, default: Date.now }
}, { timestamps: true, collection: 'inventory' });

inventorySchema.index({ businessId: 1, productId: 1 }, { unique: true });
inventorySchema.index({ businessId: 1, quantity: 1, reorderLevel: 1 });

module.exports = mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema);