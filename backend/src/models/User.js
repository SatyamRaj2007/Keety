const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['OWNER', 'ADMIN', 'MEMBER'], default: 'OWNER' },
  businessIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Business' }],
  isActive: { type: Boolean, default: true },
  lastLoginAt: { type: Date }
}, { timestamps: true, collection: 'users' });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);