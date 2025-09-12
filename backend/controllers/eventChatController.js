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

// Get event chat participants (all event participants, not just those who sent messages)
exports.getParticipants = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id; // Get current user ID

    // First check if event exists
    const event = await Event.findById(eventId)
      .populate('attendance.userId', 'name email department academicYear year section role profilePicture');
    
    if (!event) {
      console.log(`❌ Event ${eventId} not found in chat participants`);
      return res.status(404).json({ message: 'Event not found.' });
    }

    console.log(`📊 Event ${eventId} found, getting all event participants`);

    // Deduplicate participants by userId - keep the most recent registration
    const uniqueParticipants = new Map();
    
    event.attendance.forEach(attendance => {
      if (attendance.userId) {
        const userId = attendance.userId._id.toString();
        const existing = uniqueParticipants.get(userId);
        
        // If no existing participant or this one is more recent, use this one
        if (!existing || new Date(attendance.registeredAt) > new Date(existing.registeredAt)) {
          uniqueParticipants.set(userId, attendance);
        }
      }
    });

    const deduplicatedAttendance = Array.from(uniqueParticipants.values());

    console.log(`📊 Found ${deduplicatedAttendance.length} unique event participants (deduplicated from ${event.attendance.length})`);

    if (deduplicatedAttendance.length === 0) {
      console.log('📊 No event participants found - returning empty list');
      return res.json({ participants: [] });
    }

    // Format participants data
    const formattedParticipants = deduplicatedAttendance.map(attendance => ({
      _id: attendance.userId._id,
      name: attendance.userId.name || 'Unknown User',
      email: attendance.userId.email || 'No email provided',
      department: attendance.userId.department || (attendance.userId.role === 'Student' ? 'Not specified' : 'Staff'),
      academicYear: attendance.userId.academicYear || (attendance.userId.role === 'Student' ? 'Not specified' : null),
      year: attendance.userId.year || (attendance.userId.role === 'Student' ? 'Not specified' : null),
      section: attendance.userId.section || (attendance.userId.role === 'Student' ? 'Not specified' : null),
      role: attendance.userId.role || 'Student',
      profilePicture: attendance.userId.profilePicture || null,
      registrationApproved: attendance.registrationApproved,
      status: attendance.status
    }));

    console.log(`Returning ${formattedParticipants.length} event participants:`, 
      formattedParticipants.map(p => ({ name: p.name, email: p.email, role: p.role })));

    res.json({ participants: formattedParticipants });
  } catch (err) {
    console.error('Error fetching chat participants:', err);
    res.status(500).json({ message: 'Error fetching chat participants.', error: err.message });
  }
};

// Request access to event chat
exports.requestChatAccess = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validate eventId format
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID format.' });
    }

    // Get the event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // Check if user is already registered
    const existingAttendance = event.attendance.find(att => 
      att.userId && att.userId.toString() === userId
    );

    if (existingAttendance) {
      return res.status(400).json({ 
        message: 'You are already registered for this event.',
        alreadyRegistered: true
      });
    }

    // Check if event is active and visible to students
    if (event.status !== 'Active') {
      return res.status(400).json({ message: 'Event is not active.' });
    }
    
    if (!event.isVisibleToStudents) {
      return res.status(400).json({ message: 'This event is not available for student registration.' });
    }

    // Get user details to check department access
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check department access (Admin and Staff can access all events)
    if (userRole !== 'Admin' && userRole !== 'Staff' && !event.isForAllDepartments) {
      if (event.departments && event.departments.length > 0) {
        // Check if user's department is in the allowed departments
        if (!event.departments.includes(user.department)) {
          return res.status(403).json({ 
            message: 'This event is not available for your department.' 
          });
        }
      } else if (event.department && event.department !== user.department) {
        // Backward compatibility check
        return res.status(403).json({ 
          message: 'This event is not available for your department.' 
        });
      }
    }

    // Check if event is full - only count approved registrations
    if (event.maxParticipants > 0) {
      const approvedAttendees = event.attendance.filter(
        a => a.registrationApproved === true
      ).length;
      
      if (approvedAttendees >= event.maxParticipants) {
        return res.status(400).json({ 
          message: 'Event is full. All approved slots have been taken. You can still register and wait for approval if any approved registrations are cancelled.' 
        });
      }
    }

    // Determine initial status based on whether approval is required
    let initialStatus = 'Pending';
    let registrationApproved = false;
    
    if (!event.requiresApproval) {
      initialStatus = 'Attended';
      registrationApproved = true;
    }

    // Add user to attendance
    event.attendance.push({
      userId: userId,
      status: initialStatus,
      registeredAt: new Date(),
      registrationApproved: registrationApproved
    });

    await event.save();
    
    console.log(`✅ User ${user.name} requested chat access for event ${eventId}`);

    if (event.requiresApproval) {
      res.json({ 
        message: 'Chat access request sent! Admin/Staff will review your request.',
        requiresApproval: true
      });
    } else {
      res.json({ 
        message: 'Successfully joined event chat. No approval required.',
        requiresApproval: false
      });
    }
  } catch (err) {
    console.error('Error requesting chat access:', err);
    res.status(500).json({ message: 'Error requesting chat access.', error: err.message });
  }
};

// Remove participant from event chat
exports.removeParticipant = async (req, res) => {
  try {
    const { eventId, participantId } = req.params;
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;

    // Validate eventId format
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID format.' });
    }

    if (!mongoose.Types.ObjectId.isValid(participantId)) {
      return res.status(400).json({ message: 'Invalid participant ID format.' });
    }

    // Get the event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // Check permissions - only Admin/Staff can remove participants
    if (currentUserRole !== 'Admin' && currentUserRole !== 'Staff') {
      return res.status(403).json({ message: 'Only Admin and Staff can remove participants.' });
    }

    // Find the participant in attendance
    const participantIndex = event.attendance.findIndex(att => 
      att.userId && att.userId.toString() === participantId
    );

    if (participantIndex === -1) {
      return res.status(404).json({ message: 'Participant not found in this event.' });
    }

    // Get participant details for logging
    const participant = await User.findById(participantId);
    const participantName = participant ? participant.name : 'Unknown User';

    // Remove the participant from attendance
    event.attendance.splice(participantIndex, 1);
    await event.save();

    console.log(`✅ Participant ${participantName} (${participantId}) removed from event ${eventId} by ${currentUserRole}`);

    res.json({ 
      message: `Participant ${participantName} has been removed from the event chat.`,
      removedParticipant: {
        id: participantId,
        name: participantName
      }
    });
  } catch (err) {
    console.error('Error removing participant:', err);
    res.status(500).json({ message: 'Error removing participant.', error: err.message });
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
