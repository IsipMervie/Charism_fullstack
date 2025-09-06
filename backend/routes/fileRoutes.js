const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Event = require('../models/Event');
const { hasFile } = require('../utils/mongoFileStorage');
const { isValidObjectId } = require('mongoose');
const { ensureDBConnection } = require('../middleware/dbMiddleware');

// Serve profile picture
router.get('/profile-picture/:userId', ensureDBConnection, async (req, res) => {
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
router.get('/event-image/:eventId', ensureDBConnection, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Validate ObjectId
    if (!isValidObjectId(eventId)) {
      console.log('❌ Invalid event ID format:', eventId);
      return res.status(400).json({ 
        message: 'Invalid event ID format',
        error: 'INVALID_OBJECT_ID',
        receivedId: eventId
      });
    }

    console.log('🔍 Looking for event with ID:', eventId);
    const event = await Event.findById(eventId);
    
    if (!event) {
      console.log('❌ Event not found:', eventId);
      return res.status(404).json({ 
        message: 'Event not found',
        error: 'EVENT_NOT_FOUND',
        eventId: eventId
      });
    }
    
    console.log('✅ Event found:', { 
      eventId: event._id, 
      title: event.title,
      hasImage: !!event.image 
    });
    
    // Defensive check for malformed image data
    if (!event.image) {
      console.log('❌ No image field in event:', event._id);
      return res.status(404).json({ 
        message: 'Event image not found',
        error: 'NO_IMAGE_FIELD',
        eventId: event._id
      });
    }
    
    if (typeof event.image === 'string') {
      console.log('⚠️  Event image field contains string, cannot serve:', event._id);
      return res.status(404).json({ 
        message: 'Event image not properly configured',
        error: 'IMAGE_IS_STRING',
        eventId: event._id
      });
    }
    
    if (!hasFile(event.image)) {
      console.log('❌ Event image field does not contain valid file data:', event._id);
      return res.status(404).json({ 
        message: 'Event image not found',
        error: 'INVALID_IMAGE_DATA',
        eventId: event._id
      });
    }

    const { data, contentType } = event.image;
    
    if (!data || !contentType) {
      console.log('❌ Event image missing data or contentType:', event._id);
      return res.status(404).json({ 
        message: 'Event image data incomplete',
        error: 'INCOMPLETE_IMAGE_DATA',
        eventId: event._id
      });
    }
    
    console.log('✅ Serving event image:', {
      eventId: event._id,
      contentType,
      dataLength: data.length,
      filename: event.image.filename
    });
    
    res.set({
      'Content-Type': contentType,
      'Content-Length': data.length,
      'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
    });
    
    res.send(data);
  } catch (error) {
    console.error('❌ Error serving event image:', error);
    
    // Send appropriate error response
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: 'Invalid event ID format',
        error: 'CAST_ERROR',
        details: error.message
      });
    }
    
    res.status(500).json({ 
      message: 'Error serving event image',
      error: 'INTERNAL_ERROR',
      details: error.message
    });
  }
});


// Serve event document
router.get('/event-document/:eventId/:documentIndex', ensureDBConnection, async (req, res) => {
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

    const { data, contentType } = document;
    
    res.set({
      'Content-Type': contentType,
      'Content-Length': data.length,
      'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
    });
    
    res.send(data);
  } catch (error) {
    console.error('Error serving event document:', error);
    res.status(500).json({ message: 'Error serving event document' });
  }
});

// Serve documentation files (for direct access)
router.get('/documentation/:filename', ensureDBConnection, async (req, res) => {
  try {
    const { filename } = req.params;
    console.log('=== Serving Documentation File ===');
    console.log('Filename:', filename);
    
    // Find the file in any event's attendance documentation
    const event = await Event.findOne({
      'attendance.documentation.files.filename': filename
    });
    
    if (!event) {
      console.log('❌ File not found in any event');
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Find the specific file
    let fileData = null;
    for (const attendance of event.attendance) {
      if (attendance.documentation && attendance.documentation.files) {
        const file = attendance.documentation.files.find(f => f.filename === filename);
        if (file) {
          fileData = file;
          break;
        }
      }
    }
    
    if (!fileData || !hasFile(fileData)) {
      console.log('❌ File data not found');
      return res.status(404).json({ message: 'File data not found' });
    }
    
    console.log('✅ File found, serving');
    
    const { data, contentType } = fileData;
    
    res.set({
      'Content-Type': contentType,
      'Content-Length': data.length,
      'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
    });
    
    res.send(data);
  } catch (error) {
    console.error('Error serving documentation file:', error);
    res.status(500).json({ message: 'Error serving documentation file' });
  }
});

module.exports = router;
