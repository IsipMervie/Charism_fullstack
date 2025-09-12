// backend/controllers/eventChatController.js

const EventChat = require('../models/EventChat');
const Event = require('../models/Event');
const User = require('../models/User');
const mongoose = require('mongoose');

// Send a message with file attachments to event chat
exports.sendMessageWithFiles = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { message, messageType = 'file', replyTo } = req.body;
    const userId = req.user.id;
    const files = req.files;

    // Validate required fields
    if (!eventId) {
      return res.status(400).json({ message: 'Event ID is required.' });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'At least one file is required.' });
    }

    // Validate eventId format
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID format.' });
    }

    // Check if event exists and user is registered
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // Check if user can access chat
    const userRole = req.user.role;
    let canAccessChat = false;
    
    // Admin and Staff can access chat for all events
    if (userRole === 'Admin' || userRole === 'Staff') {
      canAccessChat = true;
    } else {
      // Students can access chat if they are registered and either:
      // 1. Registration is approved (registrationApproved: true), OR
      // 2. Attendance is approved (status: 'Approved')
      const isRegistered = event.attendance.some(att => 
        att.userId.toString() === userId && 
        (att.registrationApproved || att.status === 'Approved')
      );
      canAccessChat = isRegistered;
    }
    
    if (!canAccessChat) {
      return res.status(403).json({ message: 'You must be registered and approved for this event to participate in chat.' });
    }

    // Process files and create messages
    const messages = [];
    
    for (const file of files) {
      // Determine message type based on file type
      const isImage = file.mimetype.startsWith('image/');
      const isAudio = file.mimetype.startsWith('audio/');
      const isVideo = file.mimetype.startsWith('video/');
      
      let finalMessageType = 'file';
      if (isImage) finalMessageType = 'image';
      else if (isAudio) finalMessageType = 'audio';
      else if (isVideo) finalMessageType = 'video';
      
      // Create attachment object
      const attachment = {
        filename: file.filename,
        originalName: file.originalname,
        fileSize: file.size,
        contentType: file.mimetype,
        url: `/api/uploads/chat-files/${file.filename}`
      };

      console.log('📁 Created attachment:', {
        filename: file.filename,
        originalName: file.originalname,
        url: attachment.url,
        filePath: `uploads/chat-files/${file.filename}`
      });

      // Create new chat message
      let defaultMessage = '📎 File';
      if (isImage) defaultMessage = '📷 Image';
      else if (isAudio) defaultMessage = '🎵 Audio';
      else if (isVideo) defaultMessage = '🎥 Video';
      
      const chatMessage = new EventChat({
        eventId,
        userId,
        message: message || defaultMessage,
        messageType: finalMessageType,
        replyTo,
        attachment
      });

      await chatMessage.save();
      await chatMessage.populate('user', 'name email profilePicture department');
      
      messages.push(chatMessage);
    }

    res.status(201).json({
      message: 'Message with files sent successfully.',
      chatMessage: messages[0], // Return first message for frontend compatibility
      allMessages: messages
    });
  } catch (err) {
    console.error('Error sending chat message with files:', err);
    res.status(500).json({ message: 'Error sending message with files.', error: err.message });
  }
};

// Send a message to event chat
exports.sendMessage = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { message, messageType = 'text', replyTo, attachment } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!eventId) {
      return res.status(400).json({ message: 'Event ID is required.' });
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message is required and must be a non-empty string.' });
    }

    // Validate eventId format
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID format.' });
    }

    // Check if event exists and user is registered
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // Check if user can access chat
    const userRole = req.user.role;
    let canAccessChat = false;
    
    // Admin and Staff can access chat for all events
    if (userRole === 'Admin' || userRole === 'Staff') {
      canAccessChat = true;
    } else {
      // Students can access chat if they are registered and either:
      // 1. Registration is approved (registrationApproved: true), OR
      // 2. Attendance is approved (status: 'Approved')
      const isRegistered = event.attendance.some(att => 
        att.userId.toString() === userId && 
        (att.registrationApproved || att.status === 'Approved')
      );
      canAccessChat = isRegistered;
    }
    
    if (!canAccessChat) {
      return res.status(403).json({ message: 'You must be registered and approved for this event to participate in chat.' });
    }

    // Create new chat message
    const chatMessage = new EventChat({
      eventId,
      userId,
      message: message.trim(),
      messageType,
      replyTo,
      attachment
    });

    await chatMessage.save();

    // Populate user info for response
    await chatMessage.populate('user', 'name email profilePicture department');

    res.status(201).json({
      message: 'Message sent successfully.',
      chatMessage
    });
  } catch (err) {
    console.error('Error sending chat message:', err);
    res.status(500).json({ message: 'Error sending message.', error: err.message });
  }
};

// Get messages for an event
exports.getMessages = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 50, before } = req.query;
    const userId = req.user.id;

    // Validate eventId format
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID format.' });
    }

    // Check if event exists and user is registered
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // Check if user can access chat
    const userRole = req.user.role;
    let canAccessChat = false;
    
    // Admin and Staff can access chat for all events
    if (userRole === 'Admin' || userRole === 'Staff') {
      canAccessChat = true;
    } else {
      // Students can access chat if they are registered and either:
      // 1. Registration is approved (registrationApproved: true), OR
      // 2. Attendance is approved (status: 'Approved')
      const isRegistered = event.attendance.some(att => 
        att.userId.toString() === userId && 
        (att.registrationApproved || att.status === 'Approved')
      );
      canAccessChat = isRegistered;
    }
    
    if (!canAccessChat) {
      return res.status(403).json({ message: 'You must be registered and approved for this event to view chat.' });
    }

    // Build query
    let query = { eventId, isDeleted: false };
    
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    // Get messages with pagination
    const messages = await EventChat.find(query)
      .populate('user', 'name email profilePicture department')
      .populate('replyTo', 'message user')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Mark messages as read for this user
    const messageIds = messages.map(msg => msg._id);
    await EventChat.updateMany(
      { _id: { $in: messageIds } },
      { 
        $addToSet: { 
          readBy: { userId, readAt: new Date() } 
        } 
      }
    );

    res.json({
      messages: messages.reverse(), // Return in chronological order
      hasMore: messages.length === parseInt(limit),
      totalCount: await EventChat.countDocuments({ eventId, isDeleted: false })
    });
  } catch (err) {
    console.error('Error fetching chat messages:', err);
    res.status(500).json({ message: 'Error fetching messages.', error: err.message });
  }
};

// Edit a message
exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    const chatMessage = await EventChat.findById(messageId);
    if (!chatMessage) {
      return res.status(404).json({ message: 'Message not found.' });
    }

    // Check if user owns the message
    if (chatMessage.userId.toString() !== userId) {
      return res.status(403).json({ message: 'You can only edit your own messages.' });
    }

    // Update message
    chatMessage.message = message.trim();
    chatMessage.isEdited = true;
    chatMessage.editedAt = new Date();

    await chatMessage.save();
    await chatMessage.populate('user', 'name email profilePicture department');

    res.json({
      message: 'Message updated successfully.',
      chatMessage
    });
  } catch (err) {
    console.error('Error editing message:', err);
    res.status(500).json({ message: 'Error editing message.', error: err.message });
  }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    const chatMessage = await EventChat.findById(messageId);
    if (!chatMessage) {
      return res.status(404).json({ message: 'Message not found.' });
    }

    // Check if user owns the message or is admin/staff
    if (chatMessage.userId.toString() !== userId && !['Admin', 'Staff'].includes(role)) {
      return res.status(403).json({ message: 'You can only delete your own messages.' });
    }

    // Soft delete
    chatMessage.isDeleted = true;
    chatMessage.deletedAt = new Date();
    chatMessage.deletedBy = userId;

    await chatMessage.save();

    res.json({ message: 'Message deleted successfully.' });
  } catch (err) {
    console.error('Error deleting message:', err);
    res.status(500).json({ message: 'Error deleting message.', error: err.message });
  }
};

// Add reaction to message
exports.addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;

    const chatMessage = await EventChat.findById(messageId);
    if (!chatMessage) {
      return res.status(404).json({ message: 'Message not found.' });
    }

    // Remove existing reaction from this user
    chatMessage.reactions = chatMessage.reactions.filter(
      reaction => reaction.userId.toString() !== userId
    );

    // Add new reaction
    chatMessage.reactions.push({
      userId,
      emoji,
      createdAt: new Date()
    });

    await chatMessage.save();

    res.json({ message: 'Reaction added successfully.' });
  } catch (err) {
    console.error('Error adding reaction:', err);
    res.status(500).json({ message: 'Error adding reaction.', error: err.message });
  }
};

// Remove reaction from message
exports.removeReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const chatMessage = await EventChat.findById(messageId);
    if (!chatMessage) {
      return res.status(404).json({ message: 'Message not found.' });
    }

    // Remove user's reaction
    chatMessage.reactions = chatMessage.reactions.filter(
      reaction => reaction.userId.toString() !== userId
    );

    await chatMessage.save();

    res.json({ message: 'Reaction removed successfully.' });
  } catch (err) {
    console.error('Error removing reaction:', err);
    res.status(500).json({ message: 'Error removing reaction.', error: err.message });
  }
};

// Get event chat participants
exports.getParticipants = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Get the event with populated attendance
    const event = await Event.findById(eventId)
      .populate('attendance.userId', 'name email department academicYear year year section role profilePicture');

    if (!event) {
      console.log(`❌ Event ${eventId} not found in chat participants`);
      return res.status(404).json({ message: 'Event not found.' });
    }

    console.log(`📊 Event ${eventId} found with ${event.attendance.length} attendance records in chat participants`);
    console.log('Raw attendance data:', event.attendance.map(att => ({
      userId: att.userId,
      hasUserId: !!att.userId,
      userIdType: typeof att.userId,
      registrationApproved: att.registrationApproved,
      status: att.status
    })));

    // Filter out attendance records with invalid userId references first
    const validAttendanceRecords = event.attendance.filter(att => {
      if (!att.userId) {
        console.log('⚠️ Attendance record has no userId in chat participants:', att._id);
        return false;
      }
      
      // Check if userId is populated (has name property) or is a valid ObjectId
      if (typeof att.userId === 'object' && att.userId.name) {
        return true; // Properly populated user
      }
      
      if (typeof att.userId === 'string' && att.userId.length === 24) {
        console.log('⚠️ Attendance record has unpopulated userId in chat participants:', att._id, att.userId);
        return false; // Unpopulated ObjectId string
      }
      
      return false;
    });

    console.log(`📊 Valid attendance records in chat: ${validAttendanceRecords.length} out of ${event.attendance.length}`);

    // Return all event participants (not just those who have sent messages)
    const participants = validAttendanceRecords.map(att => ({
      _id: att.userId._id,
      name: att.userId.name || 'Unknown User',
      email: att.userId.email || 'No email provided',
      department: att.userId.department || (att.userId.role === 'Student' ? 'Not specified' : 'Staff'),
      academicYear: att.userId.academicYear || (att.userId.role === 'Student' ? 'Not specified' : null),
      year: att.userId.year || (att.userId.role === 'Student' ? 'Not specified' : null),
      section: att.userId.section || (att.userId.role === 'Student' ? 'Not specified' : null),
      role: att.userId.role || 'Student',
      profilePicture: att.userId.profilePicture || null,
      registrationApproved: att.registrationApproved,
      status: att.status
    }));

    console.log(`Event ${eventId} has ${event.attendance.length} attendance records`);
    console.log(`Returning ${participants.length} participants:`, participants.map(p => ({ name: p.name, email: p.email, role: p.role })));

    res.json({ participants });
  } catch (err) {
    console.error('Error fetching participants:', err);
    res.status(500).json({ message: 'Error fetching participants.', error: err.message });
  }
};

// Check if file exists
exports.checkFileExists = async (req, res) => {
  try {
    const { filename } = req.params;
    const fs = require('fs');
    const path = require('path');
    
    const filePath = path.join(__dirname, '..', 'uploads', 'chat-files', filename);
    const exists = fs.existsSync(filePath);
    
    res.json({ 
      exists,
      filename,
      path: exists ? `/api/uploads/chat-files/${filename}` : null
    });
  } catch (err) {
    console.error('Error checking file existence:', err);
    res.status(500).json({ message: 'Error checking file.', error: err.message });
  }
};
