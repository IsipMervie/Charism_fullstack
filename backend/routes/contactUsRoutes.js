// backend/routes/contactUsRoutes.js

const express = require('express');
const router = express.Router();
const contactUsController = require('../controllers/contactUsController');
const { authMiddleware } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Public: Send a contact-us message
router.post('/', contactUsController.sendContactMessage);

// Admin: Get all messages (with optional search)
router.get(
  '/',
  authMiddleware,
  roleMiddleware('Admin'),
  contactUsController.getAllMessages
);

// Admin: Mark a message as read
router.patch(
  '/:id/read',
  authMiddleware,
  roleMiddleware('Admin'),
  contactUsController.markMessageAsRead
);

// Admin: Delete a message
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware('Admin'),
  contactUsController.deleteMessage
);

module.exports = router;