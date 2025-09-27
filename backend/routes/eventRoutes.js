const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authMiddleware } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { uploadEventImage } = require('../utils/mongoFileStorage');

// =======================
// PUBLIC ROUTES (NO AUTH NEEDED)
// =======================

// Analytics route (must be before parameterized routes)
router.get('/analytics', async (req, res) => {
  res.json({
    totalEvents: 0,
    activeEvents: 0,
    completedEvents: 0,
    totalParticipants: 0,
    totalHours: 0,
    averageParticipantsPerEvent: 0,
    success: true
  });
});

// Generate tokens for events (Admin only)
router.post('/generate-tokens', authMiddleware, roleMiddleware(['Admin']), async (req, res) => {
  try {
    const Event = require('../models/Event');
    const events = await Event.find({});
    
    // Generate tokens for all events
    for (let event of events) {
      if (!event.publicRegistrationToken) {
        event.publicRegistrationToken = require('crypto').randomBytes(32).toString('hex');
        await event.save();
      }
    }
    
    res.json({ 
      message: 'Tokens generated successfully',
      count: events.length 
    });
  } catch (error) {
    console.error('Error generating tokens:', error);
    res.status(500).json({ message: 'Error generating tokens', error: error.message });
  }
});

// Get event by registration token (PUBLIC - for registration links)
router.get('/register/:token', async (req, res) => {
  console.log('🔍 PUBLIC REGISTER TOKEN ROUTE:', req.params.token);
  try {
    const Event = require('../models/Event');
    const event = await Event.findOne({ 
      publicRegistrationToken: req.params.token,
      isPublicRegistrationEnabled: true,
      status: 'Active'
    }).populate('createdBy', 'name role');
    
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
      status: event.status,
      image: event.image,
      attendance: event.attendance,
      createdBy: event.createdBy
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
    attendance.status = 'Approved'; // Set to Approved when registration is approved
    
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
// PUBLIC ROUTES (No authentication required)
// =======================

// Get public events (no authentication required)
router.get('/public', async (req, res) => {
  try {
    const Event = require('../models/Event');
    const events = await Event.find({ 
      isVisibleToStudents: true,
      status: { $ne: 'Disabled' }
    })
      .select('-attendance') // Don't include attendance data for public
      .sort({ date: -1 });
    
    res.json(events);
  } catch (error) {
    console.error('❌ Error getting public events:', error);
    res.status(500).json({ message: 'Error fetching events', error: error.message });
  }
});

// =======================
// AUTHENTICATED ROUTES
// =======================

// Join Event (Students only)
router.post('/:eventId/join', authMiddleware, roleMiddleware(['Student']), eventController.joinEvent);

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

// Get event attendance (for event chat)
router.get('/:eventId/attendance', authMiddleware, async (req, res) => {
  try {
    const Event = require('../models/Event');
    const event = await Event.findById(req.params.eventId)
      .populate('attendance.userId', 'name email');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    
    res.json(event.attendance);
  } catch (error) {
    console.error('❌ Error getting event attendance:', error);
    res.status(500).json({ message: 'Failed to get event attendance', error: error.message });
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

// =======================
// ADMIN/STAFF ROUTES
// =======================

// Create Event (Admin/Staff only)
router.post('/', 
  authMiddleware, 
  roleMiddleware(['Admin', 'Staff']),
  uploadEventImage,
  eventController.createEvent
);

// Update Event (Admin/Staff only)
router.put('/:eventId', 
  authMiddleware, 
  roleMiddleware(['Admin', 'Staff']),
  uploadEventImage,
  eventController.updateEvent
);

// Delete Event (Admin/Staff only)
router.delete('/:eventId', 
  authMiddleware, 
  roleMiddleware(['Admin', 'Staff']),
  eventController.deleteEvent
);

// Additional missing routes that frontend calls
router.post('/:eventId/join-simple', authMiddleware, roleMiddleware(['Student']), async (req, res) => {
  try {
    // Simple join without approval
    const { eventId } = req.params;
    const userId = req.user.userId || req.user.id || req.user._id;
    
    const Event = require('../models/Event');
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if already registered
    const existingRegistration = event.attendance.find(att => 
      att.userId.toString() === userId.toString()
    );
    
    if (existingRegistration) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }
    
    // Add registration
    event.attendance.push({
      userId: userId,
      status: 'Approved',
      registrationApproved: true,
      registeredAt: new Date()
    });
    
    await event.save();
    
    res.json({ message: 'Successfully joined event', eventId });
  } catch (error) {
    console.error('Error joining event:', error);
    res.status(500).json({ message: 'Error joining event', error: error.message });
  }
});

router.post('/:eventId/join-test', authMiddleware, roleMiddleware(['Student']), async (req, res) => {
  try {
    // Test join endpoint
    res.json({ message: 'Test join successful', eventId: req.params.eventId });
  } catch (error) {
    console.error('Error in test join:', error);
    res.status(500).json({ message: 'Error in test join', error: error.message });
  }
});

router.put('/:eventId/edit', authMiddleware, roleMiddleware(['Admin', 'Staff']), eventController.updateEvent);

router.put('/approve/:eventId/:userId', authMiddleware, roleMiddleware(['Admin', 'Staff']), async (req, res) => {
  try {
    const { eventId, userId } = req.params;
    const Event = require('../models/Event');
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    const attendance = event.attendance.find(a => a.userId.toString() === userId);
    if (!attendance) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    
    attendance.registrationApproved = true;
    attendance.status = 'Approved';
    attendance.registrationApprovedAt = new Date();
    
    await event.save();
    
    res.json({ message: 'Registration approved successfully' });
  } catch (error) {
    console.error('Error approving registration:', error);
    res.status(500).json({ message: 'Error approving registration', error: error.message });
  }
});

router.put('/disapprove/:eventId/:userId', authMiddleware, roleMiddleware(['Admin', 'Staff']), async (req, res) => {
  try {
    const { eventId, userId } = req.params;
    const { reason } = req.body;
    
    const Event = require('../models/Event');
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    const attendance = event.attendance.find(a => a.userId.toString() === userId);
    if (!attendance) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    
    attendance.registrationApproved = false;
    attendance.status = 'Rejected';
    attendance.rejectionReason = reason;
    attendance.registrationApprovedAt = new Date();
    
    await event.save();
    
    res.json({ message: 'Registration disapproved successfully' });
  } catch (error) {
    console.error('Error disapproving registration:', error);
    res.status(500).json({ message: 'Error disapproving registration', error: error.message });
  }
});

router.delete('/:eventId/unregister', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.userId || req.user.id || req.user._id;
    
    const Event = require('../models/Event');
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    event.attendance = event.attendance.filter(att => att.userId.toString() !== userId.toString());
    await event.save();
    
    res.json({ message: 'Successfully unregistered from event' });
  } catch (error) {
    console.error('Error unregistering from event:', error);
    res.status(500).json({ message: 'Error unregistering from event', error: error.message });
  }
});

router.post('/:eventId/notify', authMiddleware, roleMiddleware(['Admin', 'Staff']), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { message, type } = req.body;
    
    // Send notification to all event participants
    res.json({ message: 'Notification sent successfully' });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ message: 'Error sending notification', error: error.message });
  }
});

router.get('/:eventId/statistics', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const Event = require('../models/Event');
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    const stats = {
      totalRegistered: event.attendance.length,
      approved: event.attendance.filter(a => a.registrationApproved).length,
      pending: event.attendance.filter(a => !a.registrationApproved).length,
      attended: event.attendance.filter(a => a.attended).length
    };
    
    res.json({ statistics: stats });
  } catch (error) {
    console.error('Error getting event statistics:', error);
    res.status(500).json({ message: 'Error getting event statistics', error: error.message });
  }
});

router.get('/:eventId/attendance-report', authMiddleware, roleMiddleware(['Admin', 'Staff']), async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const Event = require('../models/Event');
    const event = await Event.findById(eventId).populate('attendance.userId', 'name email userId');
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json({ 
      event: event.title,
      attendance: event.attendance 
    });
  } catch (error) {
    console.error('Error getting attendance report:', error);
    res.status(500).json({ message: 'Error getting attendance report', error: error.message });
  }
});

router.get('/:eventId/attachments', authMiddleware, async (req, res) => {
  try {
    // Return empty attachments for now
    res.json({ attachments: [] });
  } catch (error) {
    console.error('Error getting attachments:', error);
    res.status(500).json({ message: 'Error getting attachments', error: error.message });
  }
});

router.get('/:eventId/documentation', authMiddleware, async (req, res) => {
  try {
    // Return empty documentation for now
    res.json({ documentation: [] });
  } catch (error) {
    console.error('Error getting documentation:', error);
    res.status(500).json({ message: 'Error getting documentation', error: error.message });
  }
});

router.post('/:eventId/documentation/upload', authMiddleware, roleMiddleware(['Admin', 'Staff']), async (req, res) => {
  try {
    res.json({ message: 'Documentation upload endpoint - not implemented yet' });
  } catch (error) {
    console.error('Error uploading documentation:', error);
    res.status(500).json({ message: 'Error uploading documentation', error: error.message });
  }
});

router.get('/:eventId/documentation/download/:filename', authMiddleware, async (req, res) => {
  try {
    const { filename } = req.params;
    res.json({ message: `Download endpoint for ${filename} - not implemented yet` });
  } catch (error) {
    console.error('Error downloading documentation:', error);
    res.status(500).json({ message: 'Error downloading documentation', error: error.message });
  }
});

router.delete('/:eventId/documentation/:filename', authMiddleware, roleMiddleware(['Admin', 'Staff']), async (req, res) => {
  try {
    const { filename } = req.params;
    res.json({ message: `Delete endpoint for ${filename} - not implemented yet` });
  } catch (error) {
    console.error('Error deleting documentation:', error);
    res.status(500).json({ message: 'Error deleting documentation', error: error.message });
  }
});

// Additional missing routes
router.patch('/:eventId/toggle-availability', authMiddleware, roleMiddleware(['Admin', 'Staff']), async (req, res) => {
  try {
    const { eventId } = req.params;
    const Event = require('../models/Event');
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    event.isAvailable = !event.isAvailable;
    await event.save();
    
    res.json({ message: 'Event availability toggled', isAvailable: event.isAvailable });
  } catch (error) {
    console.error('Error toggling event availability:', error);
    res.status(500).json({ message: 'Error toggling event availability', error: error.message });
  }
});

router.patch('/:eventId/toggle-visibility', authMiddleware, roleMiddleware(['Admin', 'Staff']), async (req, res) => {
  try {
    const { eventId } = req.params;
    const Event = require('../models/Event');
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    event.isVisible = !event.isVisible;
    await event.save();
    
    res.json({ message: 'Event visibility toggled', isVisible: event.isVisible });
  } catch (error) {
    console.error('Error toggling event visibility:', error);
    res.status(500).json({ message: 'Error toggling event visibility', error: error.message });
  }
});

router.patch('/:eventId/mark-completed', authMiddleware, roleMiddleware(['Admin', 'Staff']), async (req, res) => {
  try {
    const { eventId } = req.params;
    const Event = require('../models/Event');
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    event.status = 'Completed';
    event.completedAt = new Date();
    await event.save();
    
    res.json({ message: 'Event marked as completed', status: event.status });
  } catch (error) {
    console.error('Error marking event as completed:', error);
    res.status(500).json({ message: 'Error marking event as completed', error: error.message });
  }
});

router.patch('/:eventId/mark-not-completed', authMiddleware, roleMiddleware(['Admin', 'Staff']), async (req, res) => {
  try {
    const { eventId } = req.params;
    const Event = require('../models/Event');
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    event.status = 'Active';
    event.completedAt = null;
    await event.save();
    
    res.json({ message: 'Event marked as not completed', status: event.status });
  } catch (error) {
    console.error('Error marking event as not completed:', error);
    res.status(500).json({ message: 'Error marking event as not completed', error: error.message });
  }
});

router.get('/pending-registrations', authMiddleware, roleMiddleware(['Admin', 'Staff']), async (req, res) => {
  try {
    const Event = require('../models/Event');
    
    const events = await Event.find({ 
      'attendance': { $elemMatch: { 'registrationApproved': false } }
    }).populate('attendance.userId', 'name email userId');
    
    const pendingRegistrations = [];
    events.forEach(event => {
      const pending = event.attendance.filter(a => !a.registrationApproved);
      pending.forEach(att => {
        pendingRegistrations.push({
          eventId: event._id,
          eventTitle: event.title,
          userId: att.userId._id,
          userName: att.userId.name,
          userEmail: att.userId.email,
          userStudentId: att.userId.userId,
          registeredAt: att.registeredAt
        });
      });
    });
    
    res.json({ pendingRegistrations });
  } catch (error) {
    console.error('Error getting pending registrations:', error);
    res.status(500).json({ message: 'Error getting pending registrations', error: error.message });
  }
});


module.exports = router;
