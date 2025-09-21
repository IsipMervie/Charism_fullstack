const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authMiddleware } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// =======================
// PUBLIC ROUTES (NO AUTH NEEDED)
// =======================

// Get event by registration token (PUBLIC - for registration links)
router.get('/register/:token', async (req, res) => {
  console.log('🔍 PUBLIC REGISTER TOKEN ROUTE:', req.params.token);
  try {
    const Event = require('../models/Event');
    const event = await Event.findOne({ 
      publicRegistrationToken: req.params.token,
      isPublicRegistrationEnabled: true,
      status: 'Active'
    });
    
    if (!event) {
      return res.status(404).json({ 
        message: 'Event not found or public registration is not enabled for this event.',
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
    console.error('❌ Error in register token route:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Register for event using token (PUBLIC - requires login)
router.post('/register/:token', authMiddleware, async (req, res) => {
  console.log('🔍 PUBLIC REGISTER ROUTE:', req.params.token);
  try {
    const Event = require('../models/Event');
    const User = require('../models/User');
    
    const event = await Event.findOne({ 
      publicRegistrationToken: req.params.token,
      isPublicRegistrationEnabled: true,
      status: 'Active'
    });
    
    if (!event) {
      return res.status(404).json({ 
        message: 'Event not found or registration is not available.',
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
        message: 'You are already registered for this event.',
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
    console.error('❌ Error in register route:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// =======================
// ADMIN/STAFF ROUTES (AUTH REQUIRED)
// =======================

// Approve registration (Admin/Staff only)
router.put('/approve/:eventId/:userId', authMiddleware, roleMiddleware(['Admin', 'Staff']), async (req, res) => {
  console.log('🚀 APPROVE REGISTRATION:', req.params);
  try {
    const Event = require('../models/Event');
    const event = await Event.findById(req.params.eventId).populate('attendance.userId', 'name email');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    
    const attendance = event.attendance.find(a => 
      a.userId._id.toString() === req.params.userId || a.userId.toString() === req.params.userId
    );
    
    if (!attendance) {
      return res.status(404).json({ message: 'Registration not found.' });
    }
    
    // Approve registration
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
    console.error('❌ Error approving registration:', error);
    res.status(500).json({ message: 'Approval failed', error: error.message });
  }
});

// Disapprove registration (Admin/Staff only)
router.put('/disapprove/:eventId/:userId', authMiddleware, roleMiddleware(['Admin', 'Staff']), async (req, res) => {
  console.log('🚀 DISAPPROVE REGISTRATION:', req.params);
  try {
    const { reason } = req.body;
    
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ message: 'Reason for disapproval is required.' });
    }
    
    const Event = require('../models/Event');
    const event = await Event.findById(req.params.eventId).populate('attendance.userId', 'name email');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    
    const attendance = event.attendance.find(a => 
      a.userId._id.toString() === req.params.userId || a.userId.toString() === req.params.userId
    );
    
    if (!attendance) {
      return res.status(404).json({ message: 'Registration not found.' });
    }
    
    // Disapprove registration
    attendance.registrationApproved = false;
    attendance.registrationApprovedBy = req.user.userId || req.user.id || req.user._id;
    attendance.registrationApprovedAt = new Date();
    attendance.status = 'Disapproved';
    attendance.reason = reason;
    
    await event.save();
    
    res.json({ 
      message: 'Registration disapproved successfully.',
      eventId: event._id,
      userId: req.params.userId
    });
    
  } catch (error) {
    console.error('❌ Error disapproving registration:', error);
    res.status(500).json({ message: 'Disapproval failed', error: error.message });
  }
});

// =======================
// STUDENT ROUTES (AUTH REQUIRED)
// =======================

// Time in (Student only)
router.post('/:eventId/time-in/:userId', authMiddleware, roleMiddleware(['Student']), async (req, res) => {
  console.log('🕐 TIME IN:', req.params);
  try {
    const Event = require('../models/Event');
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    
    const attendance = event.attendance.find(a => 
      a.userId.toString() === req.params.userId
    );
    
    if (!attendance) {
      return res.status(404).json({ message: 'Registration not found.' });
    }
    
    if (!attendance.registrationApproved) {
      return res.status(400).json({ message: 'Your registration must be approved before you can time in.' });
    }
    
    attendance.timeIn = new Date();
    await event.save();
    
    res.json({ 
      message: 'Time in recorded successfully!',
      timeIn: attendance.timeIn
    });
    
  } catch (error) {
    console.error('❌ Error recording time in:', error);
    res.status(500).json({ message: 'Time in failed', error: error.message });
  }
});

// Time out (Student only)
router.post('/:eventId/time-out/:userId', authMiddleware, roleMiddleware(['Student']), async (req, res) => {
  console.log('🕐 TIME OUT:', req.params);
  try {
    const Event = require('../models/Event');
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    
    const attendance = event.attendance.find(a => 
      a.userId.toString() === req.params.userId
    );
    
    if (!attendance) {
      return res.status(404).json({ message: 'Registration not found.' });
    }
    
    if (!attendance.timeIn) {
      return res.status(400).json({ message: 'You must time in before you can time out.' });
    }
    
    attendance.timeOut = new Date();
    await event.save();
    
    res.json({ 
      message: 'Time out recorded successfully!',
      timeOut: attendance.timeOut
    });
    
  } catch (error) {
    console.error('❌ Error recording time out:', error);
    res.status(500).json({ message: 'Time out failed', error: error.message });
  }
});

// =======================
// ADMIN/STAFF ATTENDANCE ROUTES
// =======================

// Approve attendance (Admin/Staff only)
router.patch('/:eventId/approve-attendance/:userId', authMiddleware, roleMiddleware(['Admin', 'Staff']), async (req, res) => {
  console.log('✅ APPROVE ATTENDANCE:', req.params);
  try {
    const Event = require('../models/Event');
    const event = await Event.findById(req.params.eventId).populate('attendance.userId', 'name email');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    
    const attendance = event.attendance.find(a => 
      a.userId._id.toString() === req.params.userId || a.userId.toString() === req.params.userId
    );
    
    if (!attendance) {
      return res.status(404).json({ message: 'Registration not found.' });
    }
    
    // Check if they have timed in and out
    if (!attendance.timeIn || !attendance.timeOut) {
      return res.status(400).json({ 
        message: 'Student must time in and time out before attendance can be approved.' 
      });
    }
    
    // Approve attendance
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
    console.error('❌ Error approving attendance:', error);
    res.status(500).json({ message: 'Attendance approval failed', error: error.message });
  }
});

// Disapprove attendance (Admin/Staff only)
router.patch('/:eventId/disapprove-attendance/:userId', authMiddleware, roleMiddleware(['Admin', 'Staff']), async (req, res) => {
  console.log('❌ DISAPPROVE ATTENDANCE:', req.params);
  try {
    const { reason } = req.body;
    
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ message: 'Reason for disapproval is required.' });
    }
    
    const Event = require('../models/Event');
    const event = await Event.findById(req.params.eventId).populate('attendance.userId', 'name email');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    
    const attendance = event.attendance.find(a => 
      a.userId._id.toString() === req.params.userId || a.userId.toString() === req.params.userId
    );
    
    if (!attendance) {
      return res.status(404).json({ message: 'Registration not found.' });
    }
    
    // Disapprove attendance
    attendance.status = 'Disapproved';
    attendance.reason = reason;
    attendance.approvedBy = req.user.userId || req.user.id || req.user._id;
    attendance.approvedAt = new Date();
    
    await event.save();
    
  res.json({
      message: 'Attendance disapproved successfully.',
      eventId: event._id,
      userId: req.params.userId
    });
    
  } catch (error) {
    console.error('❌ Error disapproving attendance:', error);
    res.status(500).json({ message: 'Attendance disapproval failed', error: error.message });
  }
});

// =======================
// GET ROUTES
// =======================

// Get all events (with auth check)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const Event = require('../models/Event');
    const events = await Event.find({})
      .populate('attendance.userId', 'name email')
      .sort({ date: -1 });
    
    res.json({ events });
  } catch (error) {
    console.error('❌ Error getting events:', error);
    res.status(500).json({ message: 'Failed to get events', error: error.message });
  }
});

// Get event registrations (Admin/Staff)
router.get('/:eventId/registrations', authMiddleware, roleMiddleware(['Admin', 'Staff']), async (req, res) => {
  try {
    const Event = require('../models/Event');
    const event = await Event.findById(req.params.eventId)
      .populate('attendance.userId', 'name email role department academicYear year section');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    
    res.json(event.attendance);
  } catch (error) {
    console.error('❌ Error getting event registrations:', error);
    res.status(500).json({ message: 'Failed to get event registrations', error: error.message });
  }
});

// Get event participants (Admin/Staff)
router.get('/:eventId/participants', authMiddleware, roleMiddleware(['Admin', 'Staff']), async (req, res) => {
  try {
    const Event = require('../models/Event');
    const event = await Event.findById(req.params.eventId)
      .populate('attendance.userId', 'name email role department academicYear year section');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    
    res.json(event.attendance);
  } catch (error) {
    console.error('❌ Error getting event participants:', error);
    res.status(500).json({ message: 'Failed to get event participants', error: error.message });
  }
});

// Get event details (with auth check for public access)
router.get('/:eventId', async (req, res) => {
  try {
    const Event = require('../models/Event');
    const event = await Event.findById(req.params.eventId)
      .populate('attendance.userId', 'name email')
      .populate('createdBy', 'name');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    
    // If no auth, return limited data
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
    console.error('❌ Error getting event details:', error);
    res.status(500).json({ message: 'Failed to get event details', error: error.message });
  }
});

module.exports = router;
