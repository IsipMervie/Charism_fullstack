// backend/routes/eventChatRoutes.js

const express = require('express');
const router = express.Router();
const eventChatController = require('../controllers/eventChatController');
const { authMiddleware } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Send a message to event chat
router.post('/:eventId/messages', eventChatController.sendMessage);

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
