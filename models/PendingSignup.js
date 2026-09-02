const mongoose = require('mongoose');

const pendingSignupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  otpCode: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 1800 // Auto-delete after 30 minutes (TTL Index)
  }
});

module.exports = mongoose.models.PendingSignup || mongoose.model('PendingSignup', pendingSignupSchema);
