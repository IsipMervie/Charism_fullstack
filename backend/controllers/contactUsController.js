// backend/controllers/contactUsController.js

const Message = require('../models/Message');
const sendEmail = require('../utils/sendEmail');

// Send a contact message (public)
exports.sendContactMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    
    const newMessage = new Message({ name, email, message });
    await newMessage.save();
    
    // Send confirmation email to the user
    try {
      const userEmailSubject = `Thank you for contacting us - CommunityLink`;
      const userEmailBody = `
        Dear ${name},

        Thank you for reaching out to us! We have received your message and will get back to you as soon as possible.

        Your message:
        "${message}"

        We typically respond within 24-48 hours. If you have any urgent concerns, please don't hesitate to contact us again.

        Best regards,
        CommunityLink Team
      `;

      await sendEmail(email, userEmailSubject, userEmailBody);
    } catch (emailError) {
      console.error('Failed to send confirmation email to user:', emailError);
      // Don't fail the request if email fails, just log it
    }

    // Send notification email to admin (optional)
    try {
      const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
      if (adminEmail) {
        const adminEmailSubject = `New Contact Message from ${name} - CommunityLink`;
        const adminEmailBody = `
          A new contact message has been received:

          From: ${name}
          Email: ${email}
          Message: ${message}
          Time: ${new Date().toLocaleString()}

          Please respond to this message through the admin panel.

          Best regards,
          CommunityLink System
        `;

        await sendEmail(adminEmail, adminEmailSubject, adminEmailBody);
      }
    } catch (adminEmailError) {
      console.error('Failed to send admin notification email:', adminEmailError);
      // Don't fail the request if admin email fails, just log it
    }

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
      const emailSubject = `Response to your message - CommunityLink`;
      const emailBody = `
        Dear ${message.name},

        Thank you for contacting us. Here is our response to your message:

        Your original message:
        "${message.message}"

        Our response:
        "${adminResponse}"

        If you have any further questions, please don't hesitate to contact us again.

        Best regards,
        ${adminName}
        CommunityLink Team
      `;

      await sendEmail(message.email, emailSubject, emailBody);
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
      const emailSubject = `Updated response to your message - CommunityLink`;
      const emailBody = `
        Dear ${message.name},

        We have updated our response to your message. Here is the updated response:

        Your original message:
        "${message.message}"

        Our updated response:
        "${adminResponse}"

        Previous response (for reference):
        "${previousResponse}"

        If you have any further questions, please don't hesitate to contact us again.

        Best regards,
        ${adminName}
        CommunityLink Team
      `;

      await sendEmail(message.email, emailSubject, emailBody);
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