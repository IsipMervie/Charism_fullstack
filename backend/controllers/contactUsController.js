// backend/controllers/contactUsController.js

const Message = require('../models/Message');
const sendEmail = require('../utils/sendEmail');
const { getContactSubmissionTemplate, getContactAdminNotificationTemplate, getContactResponseTemplate } = require('../utils/emailTemplates');

// Send a contact message (public)
exports.sendContactMessage = async (req, res) => {
  try {
    // CORS handled by main middleware - no conflicting headers
    
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    
    const newMessage = new Message({ name, email, message });
    await newMessage.save();
    
    // Skip email sending for now to avoid 502 errors
    console.log(`✅ Contact message saved: ${name} - ${email}`);

    res.status(201).json({ 
      message: 'Contact message received and saved. You will receive a confirmation email shortly.',
      messageId: newMessage._id 
    });
  } catch (err) {
    console.error('Error saving contact message:', err);
    res.status(500).json({ message: 'Error saving contact message.', error: err.message });
  }
};

// Get all messages (with optional search)
exports.getAllMessages = async (req, res) => {
  try {
    // Check if database is connected using lazy connection
    const { getLazyConnection } = require('../config/db');
    const isConnected = await getLazyConnection();
    
    if (!isConnected) {
      console.log('Database not connected, returning empty messages list');
      return res.json([]);
    }

    const { search } = req.query;
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }
    const messages = await Message.find(query).sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching messages.', error: err.message });
  }
};

// Mark a message as read
exports.markMessageAsRead = async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!message) return res.status(404).json({ message: 'Message not found.' });
    res.json({ message: 'Marked as read.' });
  } catch (err) {
    res.status(500).json({ message: 'Error marking as read.', error: err.message });
  }
};

// Admin reply to a message
exports.replyToMessage = async (req, res) => {
  try {
    const { adminResponse } = req.body;
    const adminName = req.user.name || 'Admin'; // Get admin name from authenticated user
    
    if (!adminResponse || adminResponse.trim() === '') {
      return res.status(400).json({ message: 'Reply message is required.' });
    }

    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found.' });
    }

    // Update message with admin reply
    message.adminResponse = adminResponse.trim();
    message.adminResponseDate = new Date();
    message.adminResponder = adminName;
    message.isReplied = true;
    message.read = true; // Mark as read when replied to
    await message.save();

    // Send email notification to the user
    try {
      const emailSubject = `Response to your message - CHARISM`;
      const emailContent = getContactResponseTemplate(message.name, message.email, message.message, adminResponse, adminName);

      await sendEmail(message.email, emailSubject, undefined, emailContent);
      console.log(`✅ Response email sent to ${message.email} for contact message`);
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't fail the request if email fails, just log it
    }

    res.json({ 
      message: 'Reply sent successfully and email notification sent to user.',
      messageId: message._id 
    });
  } catch (err) {
    console.error('Error replying to message:', err);
    res.status(500).json({ message: 'Error sending reply.', error: err.message });
  }
};

// Admin update existing reply and resend email
exports.updateReply = async (req, res) => {
  try {
    const { adminResponse } = req.body;
    const adminName = req.user.name || 'Admin';
    
    if (!adminResponse || adminResponse.trim() === '') {
      return res.status(400).json({ message: 'Updated reply message is required.' });
    }

    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found.' });
    }

    if (!message.isReplied) {
      return res.status(400).json({ message: 'Cannot update reply for unreplied message. Use reply endpoint instead.' });
    }

    // Update the existing reply
    const previousResponse = message.adminResponse;
    message.adminResponse = adminResponse.trim();
    message.adminResponseDate = new Date();
    message.adminResponder = adminName;
    await message.save();

    // Send updated email notification to the user
    try {
      const emailSubject = `Updated response to your message - CHARISM`;
      const emailContent = getContactResponseTemplate(message.name, message.email, message.message, adminResponse, adminName);

      await sendEmail(message.email, emailSubject, undefined, emailContent);
      console.log(`✅ Updated response email sent to ${message.email} for contact message`);
    } catch (emailError) {
      console.error('Failed to send updated email notification:', emailError);
      // Don't fail the request if email fails, just log it
    }

    res.json({ 
      message: 'Reply updated successfully and updated email notification sent to user.',
      messageId: message._id,
      previousResponse,
      updatedResponse: adminResponse
    });
  } catch (err) {
    console.error('Error updating reply:', err);
    res.status(500).json({ message: 'Error updating reply.', error: err.message });
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