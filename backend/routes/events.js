const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// =======================
// CLEAN, SIMPLE EVENTS SYSTEM
// =======================

// Get all events
router.get('/', authMiddleware, async (req, res) => {
  try {
    const Event = require('../models/Event');
    const events = await Event.find({})
      .populate('attendance.userId', 'name email role department academicYear year section')
      .populate('createdBy', 'name')
      .sort({ date: -1 });
    
    res.json({ events });
  } catch (error) {
    console.error('Error getting events:', error);
    res.status(500).json({ message: 'Failed to get events', error: error.message });
  }
});

// Get single event details
router.get('/:eventId', async (req, res) => {
  try {
    const Event = require('../models/Event');
    const event = await Event.findById(req.params.eventId)
      .populate('attendance.userId', 'name email role department academicYear year section')
      .populate('createdBy', 'name');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // If no auth, return basic info only
    if (!req.user) {
      return res.json({
        _id: event._id,
        title: event.title,
        description: event.description,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location,
        hours: event.hours,
        maxParticipants: event.maxParticipants,
        status: event.status,
        isVisibleToStudents: event.isVisibleToStudents
      });
    }
    
    // If authenticated, return full data
    res.json(event);
  } catch (error) {
    console.error('Error getting event details:', error);
    res.status(500).json({ message: 'Failed to get event details', error: error.message });
  }
});

// Get event registrations (Admin/Staff)
router.get('/:eventId/registrations', authMiddleware, roleMiddleware(['Admin', 'Staff']), async (req, res) => {
  try {
    const Event = require('../models/Event');
    const event = await Event.findById(req.params.eventId)
      .populate('attendance.userId', 'name email role department academicYear year section');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json(event.attendance);
  } catch (error) {
    console.error('Error getting registrations:', error);
    res.status(500).json({ message: 'Failed to get registrations', error: error.message });
  }
});

// Get event participants (Admin/Staff) - same as registrations
router.get('/:eventId/participants', authMiddleware, roleMiddleware(['Admin', 'Staff']), async (req, res) => {
  try {
    const Event = require('../models/Event');
    const event = await Event.findById(req.params.eventId)
      .populate('attendance.userId', 'name email role department academicYear year section');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json(event.attendance);
  } catch (error) {
    console.error('Error getting participants:', error);
    res.status(500).json({ message: 'Failed to get participants', error: error.message });
  }
});

// =======================
// PUBLIC REGISTRATION SYSTEM
// =======================

// Get event by registration token (PUBLIC)
router.get('/register/:token', async (req, res) => {
  try {
    const Event = require('../models/Event');
    const event = await Event.findOne({ 
      publicRegistrationToken: req.params.token,
      isPublicRegistrationEnabled: true,
      status: 'Active'
    });
    
    if (!event) {
      return res.status(404).json({ 
        message: 'Event not found or registration not available',
        error: 'EVENT_NOT_FOUND'
      });
    }
    
    res.json({
      _id: event._id,
      title: event.title,
      description: event.description,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      hours: event.hours,
      maxParticipants: event.maxParticipants,
      publicRegistrationToken: event.publicRegistrationToken,
      isPublicRegistrationEnabled: event.isPublicRegistrationEnabled,
      status: event.status
    });
  } catch (error) {
    console.error('Error getting event by token:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Register for event using token (AUTH REQUIRED)
router.post('/register/:token', authMiddleware, async (req, res) => {
  try {
    const Event = require('../models/Event');
    const event = await Event.findOne({ 
      publicRegistrationToken: req.params.token,
      isPublicRegistrationEnabled: true,
      status: 'Active'
    });
    
    if (!event) {
      return res.status(404).json({ 
        message: 'Event not found or registration not available',
        error: 'EVENT_NOT_FOUND'
      });
    }
    
    const userId = req.user.userId || req.user.id || req.user._id;
    
    // Check if already registered
    const existingRegistration = event.attendance.find(att => 
      att.userId.toString() === userId.toString()
    );
    
    if (existingRegistration) {
      return res.status(400).json({ 
        message: 'You are already registered for this event',
        error: 'ALREADY_REGISTERED'
      });
    }
    
    // Add registration
    event.attendance.push({
      userId: userId,
      status: 'Pending',
      registrationApproved: false,
      registeredAt: new Date()
    });
    
    await event.save();
    
    res.json({ 
      message: 'Registration successful! Your registration is pending approval.',
      eventId: event._id,
      registrationStatus: 'Pending'
    });
    
  } catch (error) {
    console.error('Error registering for event:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// =======================
// APPROVAL SYSTEM (Admin/Staff)
// =======================

// Approve registration
router.put('/approve/:eventId/:userId', authMiddleware, roleMiddleware(['Admin', 'Staff']), async (req, res) => {
  try {
    const Event = require('../models/Event');
    const event = await Event.findById(req.params.eventId).populate('attendance.userId', 'name email');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    const attendance = event.attendance.find(a => 
      a.userId._id.toString() === req.params.userId || a.userId.toString() === req.params.userId
    );
    
    if (!attendance) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    
    attendance.registrationApproved = true;
    attendance.registrationApprovedBy = req.user.userId || req.user.id || req.user._id;
    attendance.registrationApprovedAt = new Date();
    attendance.status = 'Pending'; // Keep as Pending until they attend
    
    await event.save();
    
    res.json({ 
      message: 'Registration approved successfully!',
      eventId: event._id,
      userId: req.params.userId
    });
    
  } catch (error) {
    console.error('Error approving registration:', error);
    res.status(500).json({ message: 'Approval failed', error: error.message });
  }
});

// Disapprove registration
router.put('/disapprove/:eventId/:userId', authMiddleware, roleMiddleware(['Admin', 'Staff']), async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ message: 'Reason for disapproval is required' });
    }
    
    const Event = require('../models/Event');
    const event = await Event.findById(req.params.eventId).populate('attendance.userId', 'name email');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    const attendance = event.attendance.find(a => 
      a.userId._id.toString() === req.params.userId || a.userId.toString() === req.params.userId
    );
    
    if (!attendance) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    
    attendance.registrationApproved = false;
    attendance.registrationApprovedBy = req.user.userId || req.user.id || req.user._id;
    attendance.registrationApprovedAt = new Date();
    attendance.status = 'Disapproved';
    attendance.reason = reason;
    
    await event.save();
    
    res.json({ 
      message: 'Registration disapproved successfully',
      eventId: event._id,
      userId: req.params.userId
    });
    
  } catch (error) {
    console.error('Error disapproving registration:', error);
    res.status(500).json({ message: 'Disapproval failed', error: error.message });
  }
});

// =======================
// ATTENDANCE SYSTEM (Students)
// =======================

// Time in
router.post('/:eventId/time-in/:userId', authMiddleware, roleMiddleware(['Student']), async (req, res) => {
  try {
    const Event = require('../models/Event');
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    const attendance = event.attendance.find(a => 
      a.userId.toString() === req.params.userId
    );
    
    if (!attendance) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    
    if (!attendance.registrationApproved) {
      return res.status(400).json({ message: 'Your registration must be approved before you can time in' });
    }
    
    attendance.timeIn = new Date();
    await event.save();
    
    res.json({ 
      message: 'Time in recorded successfully!',
      timeIn: attendance.timeIn
    });
    
  } catch (error) {
    console.error('Error recording time in:', error);
    res.status(500).json({ message: 'Time in failed', error: error.message });
  }
});

// Time out
router.post('/:eventId/time-out/:userId', authMiddleware, roleMiddleware(['Student']), async (req, res) => {
  try {
    const Event = require('../models/Event');
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    const attendance = event.attendance.find(a => 
      a.userId.toString() === req.params.userId
    );
    
    if (!attendance) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    
    if (!attendance.timeIn) {
      return res.status(400).json({ message: 'You must time in before you can time out' });
    }
    
    attendance.timeOut = new Date();
    await event.save();
    
    res.json({ 
      message: 'Time out recorded successfully!',
      timeOut: attendance.timeOut
    });
    
  } catch (error) {
    console.error('Error recording time out:', error);
    res.status(500).json({ message: 'Time out failed', error: error.message });
  }
});

// =======================
// ATTENDANCE APPROVAL (Admin/Staff)
// =======================

// Approve attendance
router.patch('/:eventId/approve-attendance/:userId', authMiddleware, roleMiddleware(['Admin', 'Staff']), async (req, res) => {
  try {
    const Event = require('../models/Event');
    const event = await Event.findById(req.params.eventId).populate('attendance.userId', 'name email');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    const attendance = event.attendance.find(a => 
      a.userId._id.toString() === req.params.userId || a.userId.toString() === req.params.userId
    );
    
    if (!attendance) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    
    if (!attendance.timeIn || !attendance.timeOut) {
      return res.status(400).json({ 
        message: 'Student must time in and time out before attendance can be approved' 
      });
    }
    
    attendance.status = 'Approved';
    attendance.approvedBy = req.user.userId || req.user.id || req.user._id;
    attendance.approvedAt = new Date();
    
    await event.save();
    
    res.json({ 
      message: 'Attendance approved successfully!',
      eventId: event._id,
      userId: req.params.userId
    });
    
  } catch (error) {
    console.error('Error approving attendance:', error);
    res.status(500).json({ message: 'Attendance approval failed', error: error.message });
  }
});

// Disapprove attendance
router.patch('/:eventId/disapprove-attendance/:userId', authMiddleware, roleMiddleware(['Admin', 'Staff']), async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ message: 'Reason for disapproval is required' });
    }
    
    const Event = require('../models/Event');
    const event = await Event.findById(req.params.eventId).populate('attendance.userId', 'name email');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    const attendance = event.attendance.find(a => 
      a.userId._id.toString() === req.params.userId || a.userId.toString() === req.params.userId
    );
    
    if (!attendance) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    
    attendance.status = 'Disapproved';
    attendance.reason = reason;
    attendance.approvedBy = req.user.userId || req.user.id || req.user._id;
    attendance.approvedAt = new Date();
    
    await event.save();
    
    res.json({ 
      message: 'Attendance disapproved successfully',
      eventId: event._id,
      userId: req.params.userId
    });
    
  } catch (error) {
    console.error('Error disapproving attendance:', error);
    res.status(500).json({ message: 'Attendance disapproval failed', error: error.message });
  }
});

module.exports = router;
