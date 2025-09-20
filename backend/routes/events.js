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

// Get event registrations (All authenticated users)
router.get('/:eventId/registrations', authMiddleware, async (req, res) => {
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

// Get event participants (All authenticated users) - same as registrations
router.get('/:eventId/participants', authMiddleware, async (req, res) => {
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

// Get event attendance (Frontend expects this route)
router.get('/:eventId/attendance', authMiddleware, async (req, res) => {
  try {
    const Event = require('../models/Event');
    const event = await Event.findById(req.params.eventId)
      .populate('attendance.userId', 'name email role department academicYear year section');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json(event.attendance);
  } catch (error) {
    console.error('Error getting attendance:', error);
    res.status(500).json({ message: 'Failed to get attendance', error: error.message });
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

// Join event by event ID (AUTH REQUIRED) - Alternative to token registration
router.post('/:eventId/join', authMiddleware, async (req, res) => {
  try {
    const Event = require('../models/Event');
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ 
        message: 'Event not found',
        error: 'EVENT_NOT_FOUND'
      });
    }
    
    if (!event.isVisibleToStudents || event.status !== 'Active') {
      return res.status(400).json({ 
        message: 'Event is not available for registration',
        error: 'EVENT_NOT_AVAILABLE'
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
    
    // Check max participants
    if (event.attendance.length >= event.maxParticipants) {
      return res.status(400).json({ 
        message: 'Event is full',
        error: 'EVENT_FULL'
      });
    }
    
    // Add registration
    event.attendance.push({
      userId: userId,
      status: event.requiresApproval ? 'Pending' : 'Approved',
      registrationApproved: !event.requiresApproval,
      registeredAt: new Date()
    });
    
    await event.save();
    
    res.json({ 
      message: event.requiresApproval 
        ? 'Registration successful! Your registration is pending approval.'
        : 'Registration successful! You are now registered for this event.',
      eventId: event._id,
      registrationStatus: event.requiresApproval ? 'Pending' : 'Approved'
    });
    
  } catch (error) {
    console.error('Error joining event:', error);
    res.status(500).json({ message: 'Failed to join event', error: error.message });
  }
});

// Create new event (All authenticated users)
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log('🔍 Event creation request received');
    console.log('   User:', req.user);
    console.log('   User ID:', req.user?.userId || req.user?.id || req.user?._id);
    console.log('   User Role:', req.user?.role);
    console.log('   Body:', req.body);
    
    const Event = require('../models/Event');
    
    const {
      title,
      description,
      date,
      startTime,
      endTime,
      location,
      hours,
      maxParticipants,
      departments,
      isForAllDepartments,
      requiresApproval,
      isVisibleToStudents
    } = req.body;
    
    // Validation
    if (!title || !description || !date || !startTime || !endTime || !location) {
      return res.status(400).json({ 
        message: 'Missing required fields: title, description, date, startTime, endTime, location' 
      });
    }
    
    // Generate public registration token
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const publicRegistrationToken = `evt_${timestamp}_${randomString}`;
    
    const eventData = {
      title,
      description,
      date: new Date(date),
      startTime,
      endTime,
      location,
      hours: hours || 1,
      maxParticipants: maxParticipants || 100,
      departments: departments || [],
      isForAllDepartments: isForAllDepartments !== undefined ? isForAllDepartments : true,
      image: req.file ? { url: req.file.path } : {},
      status: 'Active',
      isVisibleToStudents: isVisibleToStudents !== undefined ? isVisibleToStudents : true,
      createdBy: req.user.userId || req.user.id || req.user._id,
      requiresApproval: requiresApproval !== undefined ? requiresApproval : true,
      publicRegistrationToken,
      isPublicRegistrationEnabled: true,
      attendance: []
    };
    
    console.log('📝 Creating event with data:', eventData);
    
    const newEvent = new Event(eventData);
    await newEvent.save();
    
    console.log('✅ Event created successfully:', newEvent._id);
    
    res.status(201).json({
      message: 'Event created successfully!',
      event: newEvent
    });
    
  } catch (error) {
    console.error('❌ Error creating event:', error);
    res.status(500).json({ message: 'Failed to create event', error: error.message });
  }
});

// =======================
// APPROVAL SYSTEM (Admin/Staff)
// =======================

// Approve registration (All authenticated users)
router.put('/approve/:eventId/:userId', authMiddleware, async (req, res) => {
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

// Disapprove registration (All authenticated users)
router.put('/disapprove/:eventId/:userId', authMiddleware, async (req, res) => {
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

// Time in (All authenticated users)
router.post('/:eventId/time-in/:userId', authMiddleware, async (req, res) => {
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

// Time out (All authenticated users)
router.post('/:eventId/time-out/:userId', authMiddleware, async (req, res) => {
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

// Approve attendance (All authenticated users)
router.patch('/:eventId/approve-attendance/:userId', authMiddleware, async (req, res) => {
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

// Disapprove attendance (All authenticated users)
router.patch('/:eventId/disapprove-attendance/:userId', authMiddleware, async (req, res) => {
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

// =======================
// FRONTEND COMPATIBILITY ROUTES
// =======================

// Time in (Frontend format: /events/:eventId/attendance/:userId/time-in)
router.post('/:eventId/attendance/:userId/time-in', authMiddleware, async (req, res) => {
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

// Time out (Frontend format: /events/:eventId/attendance/:userId/time-out)
router.post('/:eventId/attendance/:userId/time-out', authMiddleware, async (req, res) => {
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

// Approve attendance (Frontend format: /events/:eventId/attendance/:userId/approve)
router.patch('/:eventId/attendance/:userId/approve', authMiddleware, async (req, res) => {
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

// Disapprove attendance (Frontend format: /events/:eventId/attendance/:userId/disapprove)
router.patch('/:eventId/attendance/:userId/disapprove', authMiddleware, async (req, res) => {
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

// Set participation status (Frontend format: /events/:eventId/attendance/:userId)
router.patch('/:eventId/attendance/:userId', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    
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
    
    attendance.status = status;
    await event.save();
    
    res.json({ 
      message: 'Participation status updated successfully',
      eventId: event._id,
      userId: req.params.userId,
      status: status
    });
    
  } catch (error) {
    console.error('Error updating participation status:', error);
    res.status(500).json({ message: 'Failed to update participation status', error: error.message });
  }
});

module.exports = router;
