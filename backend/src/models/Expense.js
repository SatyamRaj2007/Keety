const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  category: { type: String, required: true, trim: true, uppercase: true, maxlength: 60 },
  description: { type: String, trim: true, maxlength: 500, default: '' },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, uppercase: true, trim: true, minlength: 3, maxlength: 3, default: 'INR' },
  expenseDate: { type: Date, required: true, default: Date.now }
}, { timestamps: true, collection: 'expenses' });

expenseSchema.index({ businessId: 1, expenseDate: -1 });

module.exports = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);