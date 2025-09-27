const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Get notifications for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    // For now, return empty notifications
    // This can be expanded later to include actual notifications
    res.json({
      notifications: [],
      unreadCount: 0
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
});

module.exports = router;
