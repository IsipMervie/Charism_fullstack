// backend/routes/eventChatRoutes.js

const express = require('express');
const router = express.Router();
const eventChatController = require('../controllers/eventChatController');
const { authMiddleware } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Ensure uploads directory exists
const fs = require('fs');
const uploadDir = 'uploads/chat-files/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('✅ Created chat-files directory:', uploadDir);
} else {
  console.log('✅ Chat-files directory already exists:', uploadDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    try {
      // Allow images, documents, audio, and video types
      const allowedTypes = /jpeg|jpg|png|gif|webp|svg|pdf|doc|docx|txt|zip|rar|mp3|wav|webm|ogg|mp4|avi|mov/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      
      // Also allow audio and video MIME types
      const isAudioVideo = file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/');
      
      if ((mimetype && extname) || isAudioVideo) {
        return cb(null, true);
      } else {
        cb(new Error(`File type not allowed: ${file.originalname} (${file.mimetype})`));
      }
    } catch (error) {
      cb(new Error(`File filter error: ${error.message}`));
    }
  }
});

// All routes require authentication
router.use(authMiddleware);

// Send a message to event chat
router.post('/:eventId/messages', eventChatController.sendMessage);

// Send a message with file attachments to event chat
router.post('/:eventId/messages/upload', (req, res, next) => {
  upload.array('files', 5)(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ 
        message: 'File upload error', 
        error: err.message 
      });
    }
    next();
  });
}, eventChatController.sendMessageWithFiles);

// Get messages for an event
router.get('/:eventId/messages', eventChatController.getMessages);

// Edit a message
router.put('/messages/:messageId', eventChatController.editMessage);

// Delete a message
router.delete('/messages/:messageId', eventChatController.deleteMessage);

// Add reaction to message
router.post('/messages/:messageId/reactions', eventChatController.addReaction);

// Remove reaction from message
router.delete('/messages/:messageId/reactions', eventChatController.removeReaction);

// Get event chat participants
router.get('/:eventId/participants', eventChatController.getParticipants);

// Remove participant from event chat
router.delete('/:eventId/participants/:participantId', eventChatController.removeParticipant);

// Check if file exists
router.get('/files/check/:filename', eventChatController.checkFileExists);

module.exports = router;
