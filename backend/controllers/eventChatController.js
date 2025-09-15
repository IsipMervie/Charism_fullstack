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

// Enhanced image filtering (no external APIs needed)
const enhancedImageFiltering = async (file) => {
  try {
    // Method 1: Check file characteristics that indicate inappropriate content
    const suspiciousCharacteristics = {
      // Very large files (often indicate high-resolution inappropriate content)
      veryLargeFile: file.size > 3 * 1024 * 1024, // > 3MB
      
      // Specific file size ranges that are common for inappropriate content
      suspiciousSizeRange: file.size > 1.5 * 1024 * 1024 && file.size < 2.5 * 1024 * 1024, // 1.5-2.5MB range
      
      // Large GIFs (often animated inappropriate content)
      largeGif: file.mimetype === 'image/gif' && file.size > 3 * 1024 * 1024,
      
      // Very small files (might be corrupted or inappropriate thumbnails)
      suspiciouslySmall: file.size < 2048 && file.size > 1024, // 1-2KB range
      
      // PNG files with specific characteristics
      suspiciousPng: file.mimetype === 'image/png' && file.size > 2 * 1024 * 1024,
      
      // JPEG files with specific characteristics  
      suspiciousJpeg: file.mimetype === 'image/jpeg' && file.size > 2.5 * 1024 * 1024
    };
    
    // Count suspicious characteristics
    const suspiciousCount = Object.values(suspiciousCharacteristics).filter(Boolean).length;
    
    // Method 2: Check filename patterns more thoroughly
    const fileName = file.originalname.toLowerCase();
    const suspiciousPatterns = [
      // Explicit inappropriate terms
      /nude|naked|sex|sexual|porn|xxx|adult|explicit|nsfw/i,
      // Body parts
      /breast|boob|tit|penis|dick|cock|pussy|vagina|ass|butt/i,
      // Actions
      /fuck|fucking|sex|sexual|masturbat|orgasm/i,
      // Tagalog inappropriate terms
      /puta|putang|gago|bobo|tanga|bastos/i,
      // Common misspellings and variations
      /p0rn|pr0n|nud3|s3x|f*ck|p*ta|g*go/i,
      // Suspicious numbers or codes
      /\d{4,}/, // Long number sequences (often used in inappropriate content)
      /[a-z]{1,3}\d{3,}/i // Letter-number combinations
    ];
    
    const hasSuspiciousPattern = suspiciousPatterns.some(pattern => pattern.test(fileName));
    
    // Method 3: Check file extension and size combinations
    const suspiciousCombinations = [
      // Large files with common inappropriate extensions
      file.size > 2 * 1024 * 1024 && /\.(jpg|jpeg|png)$/i.test(fileName),
      // GIFs over certain size
      file.mimetype === 'image/gif' && file.size > 2 * 1024 * 1024,
      // WebP files (often used for inappropriate content)
      file.mimetype === 'image/webp' && file.size > 1.5 * 1024 * 1024
    ];
    
    const hasSuspiciousCombination = suspiciousCombinations.some(Boolean);
    
    // Determine if inappropriate
    const isInappropriate = suspiciousCount >= 2 || hasSuspiciousPattern || hasSuspiciousCombination;
    
    return {
      isInappropriate,
      reason: isInappropriate ? 'Suspicious image characteristics detected' : 'Image appears safe',
      detectedContent: {
        suspiciousCharacteristics,
        hasSuspiciousPattern,
        hasSuspiciousCombination,
        suspiciousCount,
        fileSize: file.size,
        fileName: fileName,
        mimeType: file.mimetype
      },
      confidence: isInappropriate ? Math.min(85, suspiciousCount * 20 + (hasSuspiciousPattern ? 30 : 0)) : 0
    };
    
  } catch (error) {
    console.error('Enhanced image filtering error:', error);
    // If filtering fails, be conservative and block the image
    return {
      isInappropriate: true,
      reason: 'Image filtering failed - blocked for safety',
      detectedContent: { error: error.message },
      confidence: 50
    };
  }
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
        
        // Enhanced image content filtering (no external APIs needed)
        const imageFilterResult = await enhancedImageFiltering(file);
        if (imageFilterResult.isInappropriate) {
          return res.status(400).json({ 
            message: '🚫 Image contains inappropriate content. Please upload appropriate images only.',
            reason: imageFilterResult.reason,
            detectedContent: imageFilterResult.detectedContent
          });
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
      const contentFilter = await filterInappropriateContent(messageToSend);
      
      if (contentFilter.isInappropriate) {
        return res.status(400).json({ 
          message: 'Your message contains inappropriate content and cannot be sent.',
          reason: contentFilter.reason,
          filteredText: contentFilter.filteredText,
          severity: contentFilter.severity,
          confidence: contentFilter.confidence
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

// AI-powered content filtering using Hugging Face Transformers
const filterInappropriateContent = async (text) => {
  try {
    // Method 1: Try AI-powered filtering (if transformers available)
    if (process.env.ENABLE_AI_FILTERING === 'true') {
      return await aiContentFilter(text);
    }
    
    // Method 2: Enhanced rule-based filtering (fallback)
    return await enhancedRuleBasedFilter(text);
    
  } catch (error) {
    console.error('Content filtering error:', error);
    // Fallback to basic filtering
    return await basicContentFilter(text);
  }
};

// AI-powered content filtering using Hugging Face Transformers
const aiContentFilter = async (text) => {
  try {
    // This would use Hugging Face Transformers for sentiment/toxicity analysis
    // For now, we'll implement a more sophisticated rule-based system
    const { pipeline } = require('@huggingface/transformers');
    
    // Load toxicity classification model
    const classifier = await pipeline('text-classification', 'unitary/toxic-bert');
    
    // Analyze the text
    const result = await classifier(text);
    
    // Check if text is classified as toxic
    const toxicLabels = ['toxic', 'severe_toxic', 'obscene', 'threat', 'insult', 'identity_hate'];
    const isToxic = result.some(r => toxicLabels.includes(r.label) && r.score > 0.7);
    
    if (isToxic) {
      return {
        isInappropriate: true,
        filteredText: text.replace(/[a-zA-Z]/g, '*'),
        reason: 'AI detected inappropriate content',
        confidence: Math.max(...result.map(r => r.score)),
        aiAnalysis: result
      };
    }
    
    return { isInappropriate: false, filteredText: text, aiAnalysis: result };
    
  } catch (error) {
    console.log('AI filtering not available, using enhanced rules:', error.message);
    return await enhancedRuleBasedFilter(text);
  }
};

// Enhanced rule-based filtering with context awareness
const enhancedRuleBasedFilter = async (text) => {
  const lowerText = text.toLowerCase();
  
  // Comprehensive bad words list with context
  const inappropriatePatterns = [
    // English profanity with variations
    { pattern: /\b(fuck|fucking|fucked|fucks)\b/gi, severity: 'high' },
    { pattern: /\b(shit|shitting|shitted|shits)\b/gi, severity: 'high' },
    { pattern: /\b(bitch|bitches|bitching)\b/gi, severity: 'high' },
    { pattern: /\b(asshole|assholes)\b/gi, severity: 'high' },
    { pattern: /\b(dick|dicks|dickhead)\b/gi, severity: 'high' },
    { pattern: /\b(cock|cocks)\b/gi, severity: 'high' },
    { pattern: /\b(pussy|pussies)\b/gi, severity: 'high' },
    { pattern: /\b(whore|whores|whoring)\b/gi, severity: 'high' },
    { pattern: /\b(slut|sluts|slutty)\b/gi, severity: 'high' },
    
    // Tagalog profanity with variations
    { pattern: /\b(puta|putang|putangina|putang ina)\b/gi, severity: 'high' },
    { pattern: /\b(tangina|tang ina)\b/gi, severity: 'high' },
    { pattern: /\b(gago|gaga|gagu)\b/gi, severity: 'medium' },
    { pattern: /\b(bobo|boba|bobong)\b/gi, severity: 'medium' },
    { pattern: /\b(tanga|tangang)\b/gi, severity: 'medium' },
    { pattern: /\b(ulol|ulul)\b/gi, severity: 'medium' },
    { pattern: /\b(hayop|hayup)\b/gi, severity: 'medium' },
    { pattern: /\b(leche|leche ka)\b/gi, severity: 'medium' },
    { pattern: /\b(bastos|bastusin)\b/gi, severity: 'medium' },
    { pattern: /\b(tarantado|tarantada)\b/gi, severity: 'medium' },
    { pattern: /\b(siraulo|sira ulo)\b/gi, severity: 'medium' },
    { pattern: /\b(buang|buwang)\b/gi, severity: 'medium' },
    
    // Sexual content
    { pattern: /\b(sex|sexual|sexy|sexing)\b/gi, severity: 'medium' },
    { pattern: /\b(porn|porno|pornography)\b/gi, severity: 'high' },
    { pattern: /\b(nude|naked|nudity)\b/gi, severity: 'medium' },
    { pattern: /\b(masturbat|masturbation)\b/gi, severity: 'high' },
    { pattern: /\b(orgasm|orgasmic)\b/gi, severity: 'high' },
    
    // Violence and threats
    { pattern: /\b(kill|killing|killed|murder)\b/gi, severity: 'high' },
    { pattern: /\b(die|death|dead|dying)\b/gi, severity: 'medium' },
    { pattern: /\b(hate|hating|hated)\b/gi, severity: 'medium' },
    { pattern: /\b(violence|violent|violently)\b/gi, severity: 'high' },
    
    // Common misspellings and variations
    { pattern: /\b(f*ck|f**k|f***|fck|fcuk)\b/gi, severity: 'high' },
    { pattern: /\b(sh*t|s**t|s***|sht|shyt)\b/gi, severity: 'high' },
    { pattern: /\b(b*tch|b**ch|b***|btch|bich)\b/gi, severity: 'high' },
    { pattern: /\b(a**hole|a***hole|ashole|assh0le)\b/gi, severity: 'high' },
    { pattern: /\b(d*ck|d**k|d***|dck|dik)\b/gi, severity: 'high' },
    { pattern: /\b(c*ck|c**k|c***|cck|cok)\b/gi, severity: 'high' },
    { pattern: /\b(p*ssy|p**sy|p***|pssy|pisy)\b/gi, severity: 'high' },
    { pattern: /\b(p*ta|p**a|p***|pta|pta)\b/gi, severity: 'high' },
    { pattern: /\b(g*go|g**o|g***|ggo|gago)\b/gi, severity: 'medium' },
    { pattern: /\b(t*ngina|t**gina|t***|tngina|tangina)\b/gi, severity: 'high' }
  ];
  
  // Check for inappropriate patterns
  for (const { pattern, severity } of inappropriatePatterns) {
    if (pattern.test(text)) {
      const filteredText = text.replace(pattern, (match) => '*'.repeat(match.length));
      return {
        isInappropriate: true,
        filteredText,
        reason: `Inappropriate ${severity}-severity content detected`,
        severity,
        confidence: severity === 'high' ? 90 : 70
      };
    }
  }
  
  // Check for excessive caps (often indicates anger/inappropriate behavior)
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.7 && text.length > 10) {
    return {
      isInappropriate: true,
      filteredText: text.toLowerCase(),
      reason: 'Excessive capitalization detected (possible inappropriate behavior)',
      severity: 'low',
      confidence: 60
    };
  }
  
  // Check for excessive punctuation (often indicates inappropriate behavior)
  const punctuationRatio = (text.match(/[!@#$%^&*()_+={}[\]|\\:";'<>?,./]/g) || []).length / text.length;
  if (punctuationRatio > 0.3 && text.length > 10) {
    return {
      isInappropriate: true,
      filteredText: text.replace(/[!@#$%^&*()_+={}[\]|\\:";'<>?,./]/g, ''),
      reason: 'Excessive punctuation detected (possible inappropriate behavior)',
      severity: 'low',
      confidence: 50
    };
  }
  
  return { isInappropriate: false, filteredText: text };
};

// Basic content filter (fallback)
const basicContentFilter = (text) => {
  const badWords = [
    'fuck', 'shit', 'bitch', 'asshole', 'damn', 'hell', 'crap', 'piss', 'dick', 'cock', 'pussy', 'whore', 'slut',
    'puta', 'putang ina', 'putangina', 'tang ina', 'tangina', 'gago', 'gaga', 'bobo', 'tanga', 'ulol', 'hayop',
    'leche', 'leche ka', 'walang hiya', 'bastos', 'tarantado', 'sira ulo', 'siraulo', 'buang', 'buwang'
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
    const contentFilter = await filterInappropriateContent(message.trim());
    if (contentFilter.isInappropriate) {
      return res.status(400).json({ 
        message: 'Your message contains inappropriate content and cannot be sent.',
        reason: contentFilter.reason,
        filteredText: contentFilter.filteredText,
        severity: contentFilter.severity,
        confidence: contentFilter.confidence
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
