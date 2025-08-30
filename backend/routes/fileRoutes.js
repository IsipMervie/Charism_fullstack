const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Event = require('../models/Event');
const SchoolSettings = require('../models/SchoolSettings');
const { hasFile } = require('../utils/mongoFileStorage');

// Serve profile picture
router.get('/profile-picture/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user || !hasFile(user.profilePicture)) {
      return res.status(404).json({ message: 'Profile picture not found' });
    }

    const { data, contentType } = user.profilePicture;
    
    res.set({
      'Content-Type': contentType,
      'Content-Length': data.length,
      'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
    });
    
    res.send(data);
  } catch (error) {
    console.error('Error serving profile picture:', error);
    res.status(500).json({ message: 'Error serving profile picture' });
  }
});

// Serve event image
router.get('/event-image/:eventId', async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event || !hasFile(event.image)) {
      return res.status(404).json({ message: 'Event image not found' });
    }

    const { data, contentType } = event.image;
    
    res.set({
      'Content-Type': contentType,
      'Content-Length': data.length,
      'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
    });
    
    res.send(data);
  } catch (error) {
    console.error('Error serving event image:', error);
    res.status(500).json({ message: 'Error serving event image' });
  }
});

// Serve school logo
router.get('/school-logo', async (req, res) => {
  try {
    const settings = await SchoolSettings.findOne();
    
    if (!settings || !hasFile(settings.logo)) {
      return res.status(404).json({ message: 'School logo not found' });
    }

    const { data, contentType } = settings.logo;
    
    res.set({
      'Content-Type': contentType,
      'Content-Length': data.length,
      'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
    });
    
    res.send(data);
  } catch (error) {
    console.error('Error serving school logo:', error);
    res.status(500).json({ message: 'Error serving school logo' });
  }
});

// Serve event document
router.get('/event-document/:eventId/:documentIndex', async (req, res) => {
  try {
    const { eventId, documentIndex } = req.params;
    const event = await Event.findById(eventId);
    
    if (!event || !event.attendance || !event.attendance[0] || !event.attendance[0].documentation) {
      return res.status(404).json({ message: 'Event or documentation not found' });
    }

    // Find the document in any attendance record
    let document = null;
    for (const attendance of event.attendance) {
      if (attendance.documentation && attendance.documentation.files && attendance.documentation.files[documentIndex]) {
        document = attendance.documentation.files[documentIndex];
        break;
      }
    }

    if (!document || !hasFile(document)) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const { data, contentType, originalName } = document;
    
    res.set({
      'Content-Type': contentType,
      'Content-Length': data.length,
      'Content-Disposition': `inline; filename="${originalName}"`,
      'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
    });
    
    res.send(data);
  } catch (error) {
    console.error('Error serving event document:', error);
    res.status(500).json({ message: 'Error serving event document' });
  }
});

module.exports = router;
