// backend/controllers/eventChatController.js

const EventChat = require('../models/EventChat');
const Event = require('../models/Event');
const User = require('../models/User');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Image content analysis function using AI/ML
const analyzeImageContent = async (file) => {
  try {
    // Method 1: Use Google Cloud Vision API (if available)
    if (process.env.GOOGLE_CLOUD_VISION_API_KEY) {
      return await analyzeWithGoogleVision(file);
    }
    
    // Method 2: Use AWS Rekognition (if available)
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      return await analyzeWithAWSRekognition(file);
    }
    
    // Method 3: Use Microsoft Azure Computer Vision (if available)
    if (process.env.AZURE_COMPUTER_VISION_KEY) {
      return await analyzeWithAzureVision(file);
    }
    
    // Method 4: Basic image analysis (fallback)
    return await basicImageAnalysis(file);
    
  } catch (error) {
    console.error('Image analysis error:', error);
    return { isInappropriate: false, confidence: 0, method: 'error' };
  }
};

// Google Cloud Vision API analysis
const analyzeWithGoogleVision = async (file) => {
  const vision = require('@google-cloud/vision');
  const client = new vision.ImageAnnotatorClient();
  
  const [result] = await client.safeSearchDetection(file.buffer);
  const safeSearch = result.safeSearchAnnotation;
  
  const inappropriateLevels = {
    adult: safeSearch.adult,
    violence: safeSearch.violence,
    racy: safeSearch.racy
  };
  
  const isInappropriate = 
    inappropriateLevels.adult === 'LIKELY' || inappropriateLevels.adult === 'VERY_LIKELY' ||
    inappropriateLevels.violence === 'LIKELY' || inappropriateLevels.violence === 'VERY_LIKELY' ||
    inappropriateLevels.racy === 'LIKELY' || inappropriateLevels.racy === 'VERY_LIKELY';
  
  return {
    isInappropriate,
    confidence: Math.max(
      inappropriateLevels.adult === 'VERY_LIKELY' ? 95 : 
      inappropriateLevels.adult === 'LIKELY' ? 80 : 0,
      inappropriateLevels.violence === 'VERY_LIKELY' ? 95 : 
      inappropriateLevels.violence === 'LIKELY' ? 80 : 0,
      inappropriateLevels.racy === 'VERY_LIKELY' ? 95 : 
      inappropriateLevels.racy === 'LIKELY' ? 80 : 0
    ),
    detectedContent: inappropriateLevels,
    method: 'Google Vision API'
  };
};

// AWS Rekognition analysis
const analyzeWithAWSRekognition = async (file) => {
  const AWS = require('aws-sdk');
  const rekognition = new AWS.Rekognition();
  
  const params = {
    Image: { Bytes: file.buffer },
    MinConfidence: 70
  };
  
  const result = await rekognition.detectModerationLabels(params).promise();
  
  const inappropriateLabels = result.ModerationLabels.filter(label => 
    ['Explicit Nudity', 'Sexual Activity', 'Violence', 'Graphic Violence'].includes(label.Name)
  );
  
  const isInappropriate = inappropriateLabels.length > 0;
  const confidence = inappropriateLabels.length > 0 ? 
    Math.max(...inappropriateLabels.map(label => label.Confidence)) : 0;
  
  return {
    isInappropriate,
    confidence,
    detectedContent: inappropriateLabels.map(label => ({
      label: label.Name,
      confidence: label.Confidence
    })),
    method: 'AWS Rekognition'
  };
};

// Azure Computer Vision analysis
const analyzeWithAzureVision = async (file) => {
  const axios = require('axios');
  
  const response = await axios.post(
    `https://${process.env.AZURE_REGION}.api.cognitive.microsoft.com/vision/v3.2/analyze`,
    file.buffer,
    {
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.AZURE_COMPUTER_VISION_KEY,
        'Content-Type': 'application/octet-stream'
      },
      params: {
        visualFeatures: 'Adult'
      }
    }
  );
  
  const adult = response.data.adult;
  const isInappropriate = adult.isAdultContent || adult.isRacyContent;
  const confidence = Math.max(adult.adultScore * 100, adult.racyScore * 100);
  
  return {
    isInappropriate,
    confidence,
    detectedContent: {
      adultContent: adult.isAdultContent,
      racyContent: adult.isRacyContent,
      adultScore: adult.adultScore,
      racyScore: adult.racyScore
    },
    method: 'Azure Computer Vision'
  };
};

// Basic image analysis (fallback method)
const basicImageAnalysis = async (file) => {
  // Basic checks without AI
  const suspiciousPatterns = [
    // Check for common pornographic image characteristics
    /\.(jpg|jpeg|png|gif|webp)$/i.test(file.originalname) && file.size > 2 * 1024 * 1024, // Large image files
    file.mimetype === 'image/gif' && file.size > 5 * 1024 * 1024, // Large GIFs (often animated porn)
  ];
  
  const suspiciousCount = suspiciousPatterns.filter(Boolean).length;
  const isInappropriate = suspiciousCount > 0;
  
  return {
    isInappropriate,
    confidence: suspiciousCount * 30, // Low confidence for basic analysis
    detectedContent: {
      largeFile: file.size > 2 * 1024 * 1024,
      suspiciousType: file.mimetype === 'image/gif' && file.size > 5 * 1024 * 1024
    },
    method: 'Basic Analysis'
  };
};

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
      
      // Auto-add admin/staff to event attendance if not already registered
      const isAlreadyRegistered = event.attendance.some(att => 
        att.userId.toString() === userId
      );
      
      if (!isAlreadyRegistered) {
        console.log(`📝 Auto-adding ${userRole} ${userId} to event ${eventId} attendance`);
        event.attendance.push({
          userId: userId,
          status: 'Approved', // Admin/Staff are auto-approved
          registeredAt: new Date(),
          registrationApproved: true, // Auto-approve registration
          approvedBy: userId, // Self-approved
          approvedAt: new Date()
        });
        await event.save();
        console.log(`✅ ${userRole} ${userId} added to event attendance`);
      }
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
      
      // Enhanced image content filtering
      if (isImage) {
        const fileName = file.originalname.toLowerCase();
        
        // Extended suspicious filename patterns
        const suspiciousNames = [
          // English inappropriate terms
          'porn', 'xxx', 'adult', 'nude', 'naked', 'sex', 'sexual', 'fuck', 'fucking', 'bitch', 'slut', 'whore',
          'dick', 'cock', 'pussy', 'ass', 'boobs', 'tits', 'breast', 'penis', 'vagina',
          // Tagalog inappropriate terms
          'puta', 'putang', 'putangina', 'tangina', 'gago', 'gaga', 'bobo', 'tanga', 'ulol', 'hayop',
          'leche', 'bastos', 'tarantado', 'siraulo', 'buang', 'buwang',
          // Common variations and misspellings
          'p0rn', 'pr0n', 'xxx', 'xoxo', 'adult', 'adlt', 'nude', 'nud3', 'sex', 's3x',
          'fck', 'f*ck', 'f**k', 'f***', 'sh*t', 's**t', 'b*tch', 'a**hole',
          'p*ta', 'p*tang', 'g*go', 't*ngina', 't*ng ina'
        ];
        
        // Check filename for inappropriate content
        if (suspiciousNames.some(name => fileName.includes(name))) {
          return res.status(400).json({ 
            message: '🚫 Inappropriate image content detected. Please upload appropriate images only.',
            reason: 'Suspicious filename detected',
            blockedFilename: fileName
          });
        }
        
        // Check for suspicious file extensions or patterns
        const suspiciousPatterns = [
          /porn/i, /xxx/i, /adult/i, /nude/i, /sex/i, /fuck/i, /puta/i, /gago/i,
          /naked/i, /nude/i, /sexual/i, /explicit/i, /nsfw/i
        ];
        
        if (suspiciousPatterns.some(pattern => pattern.test(fileName))) {
          return res.status(400).json({ 
            message: '🚫 Image filename contains inappropriate content.',
            reason: 'Filename pattern detected',
            blockedFilename: fileName
          });
        }
        
        // Check file size (prevent very large images that might be inappropriate)
        if (file.size > 5 * 1024 * 1024) { // 5MB limit for images
          return res.status(400).json({ 
            message: '📏 Image file is too large. Maximum size is 5MB.',
            reason: 'File size exceeds limit',
            fileSize: `${(file.size / (1024 * 1024)).toFixed(2)}MB`
          });
        }
        
        // Check for minimum file size (prevent empty or corrupted files)
        if (file.size < 1024) { // Less than 1KB
          return res.status(400).json({ 
            message: '📏 Image file is too small. Please upload a valid image.',
            reason: 'File size too small',
            fileSize: `${file.size} bytes`
          });
        }
        
        // Advanced image content analysis using AI/ML
        try {
          const imageContentAnalysis = await analyzeImageContent(file);
          if (imageContentAnalysis.isInappropriate) {
            return res.status(400).json({ 
              message: '🚫 Image contains inappropriate visual content. Please upload appropriate images only.',
              reason: 'Inappropriate visual content detected',
              confidence: imageContentAnalysis.confidence,
              detectedContent: imageContentAnalysis.detectedContent
            });
          }
        } catch (analysisError) {
          console.log('Image analysis failed, proceeding with basic filtering:', analysisError.message);
          // Continue with upload if analysis fails (fallback to filename filtering)
        }
      }
      
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
      
      // Filter message content if provided
      const messageToSend = message || defaultMessage;
      const contentFilter = filterInappropriateContent(messageToSend);
      
      if (contentFilter.isInappropriate) {
        return res.status(400).json({ 
          message: 'Your message contains inappropriate content and cannot be sent.',
          reason: contentFilter.reason,
          filteredText: contentFilter.filteredText
        });
      }
      
      const chatMessage = new EventChat({
        eventId,
        userId,
        message: contentFilter.filteredText,
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

// Content filtering function
const filterInappropriateContent = (text) => {
  // Bad words list including Tagalog profanity
  const badWords = [
    // English profanity
    'fuck', 'shit', 'bitch', 'asshole', 'damn', 'hell', 'crap', 'piss', 'dick', 'cock', 'pussy', 'whore', 'slut',
    // Tagalog profanity
    'puta', 'putang ina', 'putangina', 'tang ina', 'tangina', 'gago', 'gaga', 'bobo', 'tanga', 'ulol', 'hayop',
    'leche', 'leche ka', 'walang hiya', 'bastos', 'tarantado', 'sira ulo', 'siraulo', 'buang', 'buwang',
    // Variations and common misspellings
    'f*ck', 'f**k', 'f***', 'sh*t', 's**t', 'b*tch', 'a**hole', 'd*ck', 'c*ck', 'p*ssy',
    'p*ta', 'p*tang ina', 'g*go', 't*ng ina', 't*ngina'
  ];

  const lowerText = text.toLowerCase();
  
  for (const word of badWords) {
    if (lowerText.includes(word.toLowerCase())) {
      return {
        isInappropriate: true,
        filteredText: text.replace(new RegExp(word, 'gi'), '*'.repeat(word.length)),
        reason: 'Inappropriate language detected'
      };
    }
  }
  
  return { isInappropriate: false, filteredText: text };
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

    // Filter inappropriate content
    const contentFilter = filterInappropriateContent(message.trim());
    if (contentFilter.isInappropriate) {
      return res.status(400).json({ 
        message: 'Your message contains inappropriate content and cannot be sent.',
        reason: contentFilter.reason,
        filteredText: contentFilter.filteredText
      });
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
      
      // Auto-add admin/staff to event attendance if not already registered
      const isAlreadyRegistered = event.attendance.some(att => 
        att.userId.toString() === userId
      );
      
      if (!isAlreadyRegistered) {
        console.log(`📝 Auto-adding ${userRole} ${userId} to event ${eventId} attendance`);
        event.attendance.push({
          userId: userId,
          status: 'Approved', // Admin/Staff are auto-approved
          registeredAt: new Date(),
          registrationApproved: true, // Auto-approve registration
          approvedBy: userId, // Self-approved
          approvedAt: new Date()
        });
        await event.save();
        console.log(`✅ ${userRole} ${userId} added to event attendance`);
      }
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

    // Create new chat message with filtered content
    const chatMessage = new EventChat({
      eventId,
      userId,
      message: contentFilter.filteredText,
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
      
      // Auto-add admin/staff to event attendance if not already registered
      const isAlreadyRegistered = event.attendance.some(att => 
        att.userId.toString() === userId
      );
      
      if (!isAlreadyRegistered) {
        console.log(`📝 Auto-adding ${userRole} ${userId} to event ${eventId} attendance`);
        event.attendance.push({
          userId: userId,
          status: 'Approved', // Admin/Staff are auto-approved
          registeredAt: new Date(),
          registrationApproved: true, // Auto-approve registration
          approvedBy: userId, // Self-approved
          approvedAt: new Date()
        });
        await event.save();
        console.log(`✅ ${userRole} ${userId} added to event attendance`);
      }
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
