// backend/controllers/messageController.js

const Message = require('../models/Message');

// Send a message (e.g., admin/staff to user, or system notification)
exports.sendMessage = async (req, res) => {
  try {
    const { to, from, subject, content } = req.body;
    if (!to || !from || !subject || !content) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const newMessage = new Message({ to, from, subject, content });
    await newMessage.save();
    res.status(201).json({ message: 'Message sent successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error sending message.', error: err.message });
  }
};

// Get all messages (optionally filter by recipient)
exports.getMessages = async (req, res) => {
  try {
    const { to, from, search } = req.query;
    let query = {};
    if (to) query.to = to;
    if (from) query.from = from;
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    const messages = await Message.find(query).sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching messages.', error: err.message });
  }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found.' });
    res.json({ message: 'Message deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting message.', error: err.message });
  }
};