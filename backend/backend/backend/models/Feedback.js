const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  userEmail: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    enum: ['student', 'staff', 'admin', 'guest'],
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  category: {
    type: String,
    enum: ['bug', 'feature', 'general', 'complaint', 'suggestion'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'working-on-it', 'resolve'],
    default: 'pending'
  },
  adminResponse: {
    type: String,
    trim: true,
    maxlength: 500
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  adminName: {
    type: String
  },
  resolvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient querying
feedbackSchema.index({ status: 1, createdAt: -1 });
feedbackSchema.index({ userId: 1, createdAt: -1 });
feedbackSchema.index({ category: 1, status: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
