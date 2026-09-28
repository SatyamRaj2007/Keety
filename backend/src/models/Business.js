const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  businessType: {
    type: String,
    enum: ['CLOTHING', 'RESTAURANT', 'SALON', 'GROCERY_RETAIL', 'ELECTRONICS', 'OTHER'],
    required: true
  },
  description: { type: String, trim: true, maxlength: 500, default: '' },
  location: {
    address: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: '' }
  },
  currency: { type: String, uppercase: true, trim: true, minlength: 3, maxlength: 3, default: 'INR' },
  timezone: { type: String, trim: true, default: 'UTC' },
  logoUrl: { type: String, trim: true, default: '' },
  settings: {
    lowStockThreshold: { type: Number, min: 0, default: 5 },
    aiEnabled: { type: Boolean, default: true },
    notificationsEnabled: { type: Boolean, default: false }
  }
}, { timestamps: true, collection: 'businesses' });

module.exports = mongoose.models.Business || mongoose.model('Business', businessSchema);