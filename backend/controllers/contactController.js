// backend/controllers/contactController.js

const ContactMessage = require('../models/ContactMessage');
const sendEmail = require('../utils/sendEmail');
const { getContactUsTemplate } = require('../utils/emailTemplates');

// Get all contact messages
exports.getAllContactMessages = async (req, res) => {
  try {
    const { searchTerm = '' } = req.query;
    
    let query = {};
    if (searchTerm) {
      query = {
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } },
          { message: { $regex: searchTerm, $options: 'i' } }
        ]
      };
    }

    const messages = await ContactMessage.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.json(messages);
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({ message: 'Error fetching contact messages', error: error.message });
  }
};

// Get contact message by ID
exports.getContactMessage = async (req, res) => {
  try {
    const message = await ContactMessage.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Contact message not found' });
    }

    res.json(message);
  } catch (error) {
    console.error('Error fetching contact message:', error);
    res.status(500).json({ message: 'Error fetching contact message', error: error.message });
  }
};

// Create contact message
exports.createContactMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email, and message are required' });
    }

    // Create contact message
    const contactMessage = new ContactMessage({
      name,
      email,
      message,
      status: 'new',
      read: false
    });

    await contactMessage.save();

    // Send email notification to admin
    try {
      const emailContent = getContactUsTemplate(name, email, message);
      await sendEmail(
        process.env.ADMIN_EMAIL || 'admin@charism.edu.ph',
        `New Contact Message from ${name}`,
        '',
        emailContent,
        true
      );
      console.log('✅ Contact message email sent to admin');
    } catch (emailError) {
      console.error('Failed to send contact message email:', emailError);
    }

    res.status(201).json({
      message: 'Contact message sent successfully',
      contactMessage: {
        id: contactMessage._id,
        name: contactMessage.name,
        email: contactMessage.email,
        message: contactMessage.message,
        status: contactMessage.status,
        createdAt: contactMessage.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating contact message:', error);
    res.status(500).json({ message: 'Error creating contact message', error: error.message });
  }
};

// Update contact message
exports.updateContactMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const contactMessage = await ContactMessage.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!contactMessage) {
      return res.status(404).json({ message: 'Contact message not found' });
    }

    res.json({
      message: 'Contact message updated successfully',
      contactMessage
    });
  } catch (error) {
    console.error('Error updating contact message:', error);
    res.status(500).json({ message: 'Error updating contact message', error: error.message });
  }
};

// Delete contact message
exports.deleteContactMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const contactMessage = await ContactMessage.findByIdAndDelete(id);

    if (!contactMessage) {
      return res.status(404).json({ message: 'Contact message not found' });
    }

    res.json({ message: 'Contact message deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact message:', error);
    res.status(500).json({ message: 'Error deleting contact message', error: error.message });
  }
};

// Mark contact message as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const contactMessage = await ContactMessage.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );

    if (!contactMessage) {
      return res.status(404).json({ message: 'Contact message not found' });
    }

    res.json({
      message: 'Contact message marked as read',
      contactMessage
    });
  } catch (error) {
    console.error('Error marking contact message as read:', error);
    res.status(500).json({ message: 'Error marking contact message as read', error: error.message });
  }
};

// Reply to contact message
exports.replyToContactMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { replyMessage } = req.body;

    if (!replyMessage) {
      return res.status(400).json({ message: 'Reply message is required' });
    }

    const contactMessage = await ContactMessage.findByIdAndUpdate(
      id,
      {
        adminResponse: replyMessage,
        adminResponseDate: new Date(),
        status: 'replied'
      },
      { new: true }
    );

    if (!contactMessage) {
      return res.status(404).json({ message: 'Contact message not found' });
    }

    // Send reply email to user
    try {
      const replyEmailContent = `
        <h2>Reply to Your Contact Message</h2>
        <p>Dear ${contactMessage.name},</p>
        <p>Thank you for contacting us. Here is our reply:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0;">
          ${replyMessage}
        </div>
        <p>Best regards,<br>CHARISM Community Service Management Team</p>
      `;

      await sendEmail(
        contactMessage.email,
        'Reply to Your Contact Message - CHARISM',
        '',
        replyEmailContent,
        true
      );
      console.log('✅ Reply email sent to:', contactMessage.email);
    } catch (emailError) {
      console.error('Failed to send reply email:', emailError);
    }

    res.json({
      message: 'Reply sent successfully',
      contactMessage
    });
  } catch (error) {
    console.error('Error replying to contact message:', error);
    res.status(500).json({ message: 'Error replying to contact message', error: error.message });
  }
};
