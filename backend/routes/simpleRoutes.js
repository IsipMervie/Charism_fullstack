const express = require('express');
const router = express.Router();

// Simple contact endpoint
router.post('/contact-us', (req, res) => {
  res.json({ message: 'Contact form working', success: true });
});

// Simple analytics endpoint  
router.get('/events/analytics', (req, res) => {
  res.json({ message: 'Analytics working', success: true });
});

// Simple notifications endpoint
router.get('/notifications', (req, res) => {
  res.json({ message: 'Notifications working', success: true });
});

module.exports = router;
