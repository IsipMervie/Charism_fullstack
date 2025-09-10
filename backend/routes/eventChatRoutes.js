// backend/routes/eventChatRoutes.js

const express = require('express');
const router = express.Router();
const eventChatController = require('../controllers/eventChatController');
const { authMiddleware } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/chat-files/');
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
  },
  fileFilter: (req, file, cb) => {
    // Allow images and common document types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and documents are allowed.'));
    }
  }
});

// All routes require authentication
router.use(authMiddleware);

// Send a message to event chat
router.post('/:eventId/messages', eventChatController.sendMessage);

// Send a message with file attachments to event chat
router.post('/:eventId/messages/upload', upload.array('files', 5), eventChatController.sendMessageWithFiles);

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

module.exports = router;
