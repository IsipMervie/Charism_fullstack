// backend/models/Message.js

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // For contact-us messages
  name: { type: String },         // Sender's name (for contact-us)
  email: { type: String },        // Sender's email (for contact-us)
  message: { type: String },      // Message content (for contact-us)

  // For internal messages (optional, if you want to support admin/staff messaging)
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },    // Recipient user
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  // Sender user
  subject: { type: String },
  content: { type: String },

  read: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);