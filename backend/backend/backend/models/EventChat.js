// backend/models/EventChat.js

const mongoose = require('mongoose');

const eventChatSchema = new mongoose.Schema({
  eventId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event', 
    required: true,
    index: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  message: { 
    type: String, 
    required: true,
    maxlength: 1000 
  },
  messageType: { 
    type: String, 
    enum: ['text', 'image', 'file', 'audio', 'video', 'system'], 
    default: 'text' 
  },
  // For file attachments
  attachment: {
    filename: String,
    originalName: String,
    fileSize: Number,
    contentType: String,
    url: String
  },
  // System messages (e.g., "User joined the event")
  systemMessage: {
    type: String,
    enum: ['user_joined', 'user_left', 'event_started', 'event_ended', 'admin_announcement']
  },
  // Message status
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Reply to another message
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'EventChat' },
  // Reactions
  reactions: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  // Read status for each user
  readBy: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Indexes for better performance
eventChatSchema.index({ eventId: 1, createdAt: -1 });
eventChatSchema.index({ userId: 1, createdAt: -1 });
eventChatSchema.index({ eventId: 1, isDeleted: 1 });

// Virtual for user info
eventChatSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Ensure virtual fields are serialized
eventChatSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('EventChat', eventChatSchema);
