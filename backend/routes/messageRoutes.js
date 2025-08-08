// backend/routes/messageRoutes.js

const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authMiddleware } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Send a message (Admin/Staff to user, or system notification)
router.post(
  '/',
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  messageController.sendMessage
);

// Get all messages (Admin/Staff can see all, users can see their own)
router.get(
  '/',
  authMiddleware,
  messageController.getMessages
);

// Delete a message (Admin/Staff)
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  messageController.deleteMessage
);

module.exports = router;