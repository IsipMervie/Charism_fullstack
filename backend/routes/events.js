const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/User');
const { uploadEventImage, getImageInfo } = require('../utils/mongoFileStorage');

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
    console.log('🔍 Getting registrations for event:', req.params.eventId);
    
    const Event = require('../models/Event');
    const event = await Event.findById(req.params.eventId)
      .populate('attendance.userId', 'name email role department academicYear year section');
    
    if (!event) {
      console.log('❌ Event not found:', req.params.eventId);
      return res.status(404).json({ message: 'Event not found' });
    }
    
    console.log('✅ Event found:', event.title);
    console.log('📊 Registrations count:', event.attendance.length);
    console.log('📋 Registrations:', event.attendance);
    
    // Ensure we always return an array, even if empty
    const allRegistrations = event.attendance || [];
    
    // Categorize registrations for frontend
    const categorizedRegistrations = {
      pending: allRegistrations.filter(reg => !reg.registrationApproved && !reg.reason),
      approved: allRegistrations.filter(reg => reg.registrationApproved && !reg.reason),
      disapproved: allRegistrations.filter(reg => reg.reason)
    };
    
    const response = {
      registrations: categorizedRegistrations,
      summary: {
        total: allRegistrations.length,
        pending: categorizedRegistrations.pending.length,
        approved: categorizedRegistrations.approved.length,
        disapproved: categorizedRegistrations.disapproved.length
      }
    };
    
    console.log('📤 Returning categorized registrations:', response);
    res.json(response);
  } catch (error) {
    console.error('❌ Error getting registrations:', error);
    res.status(500).json({ message: 'Failed to get registrations', error: error.message });
  }
});

// Get event participants (All authenticated users) - same as registrations
router.get('/:eventId/participants', authMiddleware, async (req, res) => {
  try {
    console.log('🔍 Getting participants for event:', req.params.eventId);
    
    const Event = require('../models/Event');
    const event = await Event.findById(req.params.eventId)
      .populate('attendance.userId', 'name email role department academicYear year section');
    
    if (!event) {
      console.log('❌ Event not found:', req.params.eventId);
      return res.status(404).json({ message: 'Event not found' });
    }
    
    console.log('✅ Event found:', event.title);
    console.log('📊 Participants count:', event.attendance.length);
    
    // Ensure we always return an array, even if empty
    const participants = event.attendance || [];
    
    res.json(participants);
  } catch (error) {
    console.error('❌ Error getting participants:', error);
    res.status(500).json({ message: 'Failed to get participants', error: error.message });
  }
});

// Get event attendance (Frontend expects this route)
router.get('/:eventId/attendance', authMiddleware, async (req, res) => {
  try {
    console.log('🔍 Getting attendance for event:', req.params.eventId);
    
    const Event = require('../models/Event');
    const event = await Event.findById(req.params.eventId)
      .populate('attendance.userId', 'name email role department academicYear year section');
    
    if (!event) {
      console.log('❌ Event not found:', req.params.eventId);
      return res.status(404).json({ message: 'Event not found' });
    }
    
    console.log('✅ Event found:', event.title);
    console.log('📊 Attendance count:', event.attendance.length);
    
    // Ensure we always return an array, even if empty
    const attendance = event.attendance || [];
    
    res.json(attendance);
  } catch (error) {
    console.error('❌ Error getting attendance:', error);
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
    
    // Send registration confirmation email
    try {
      const user = await User.findById(userId);
      if (user && user.email) {
        const subject = `Event Registration Confirmed - ${event.title}`;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #007bff;">📝 Registration Confirmed!</h2>
            <p>Dear ${user.name},</p>
            <p>Thank you for registering for the event <strong>"${event.title}"</strong>. Your registration has been received and is pending approval.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Event Details:</h3>
              <p><strong>Event:</strong> ${event.title}</p>
              <p><strong>Description:</strong> ${event.description}</p>
              <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${event.startTime} - ${event.endTime}</p>
              <p><strong>Location:</strong> ${event.location}</p>
              <p><strong>Hours:</strong> ${event.hours}</p>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h3>Next Steps:</h3>
              <p>Your registration is currently <strong>pending approval</strong>. You will receive another email once your registration is approved or if any issues arise.</p>
            </div>
            
            <p>Please keep this email for your records. If you have any questions, please contact the event organizer.</p>
            
            <hr style="margin: 30px 0;">
            <p style="color: #6c757d; font-size: 12px;">
              This is an automated message from Charism Community Service System.
            </p>
          </div>
        `;
        
        await sendEmail(user.email, subject, null, html);
        console.log(`✅ Registration confirmation email sent to ${user.email}`);
      }
    } catch (emailError) {
      console.error('❌ Failed to send registration confirmation email:', emailError.message);
    }
    
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
router.post('/', authMiddleware, (req, res, next) => {
  uploadEventImage(req, res, (err) => {
    if (err) {
      console.error('Multer error in event creation:', err);
      return res.status(400).json({ 
        message: 'Image upload error: ' + (err.message || 'Invalid file format or size'),
        error: 'IMAGE_UPLOAD_ERROR'
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    console.log('🔍 Event creation request received');
    console.log('   User:', req.user);
    console.log('   User ID:', req.user?.userId || req.user?.id || req.user?._id);
    console.log('   User Role:', req.user?.role);
    console.log('   Body:', req.body);
    
    // Check if user is authenticated
    if (!req.user) {
      console.log('❌ No user found in request');
      return res.status(401).json({ 
        message: 'Authentication required',
        error: 'AUTHENTICATION_REQUIRED'
      });
    }
    
    const userId = req.user.userId || req.user.id || req.user._id;
    if (!userId) {
      console.log('❌ No user ID found in request');
      return res.status(401).json({ 
        message: 'User ID not found in token',
        error: 'USER_ID_NOT_FOUND'
      });
    }
    
    console.log('✅ User authenticated:', userId);
    
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
    
    // Enhanced validation with detailed error messages
    const missingFields = [];
    if (!title) missingFields.push('title');
    if (!description) missingFields.push('description');
    if (!date) missingFields.push('date');
    if (!startTime) missingFields.push('startTime');
    if (!endTime) missingFields.push('endTime');
    if (!location) missingFields.push('location');
    
    if (missingFields.length > 0) {
      console.log('❌ Validation failed - Missing fields:', missingFields);
      console.log('📝 Request body:', req.body);
      return res.status(400).json({ 
        message: `Missing required fields: ${missingFields.join(', ')}`,
        error: 'VALIDATION_ERROR',
        missingFields: missingFields,
        receivedFields: Object.keys(req.body)
      });
    }
    
    // Validate date format
    if (isNaN(new Date(date).getTime())) {
      console.log('❌ Invalid date format:', date);
      return res.status(400).json({ 
        message: 'Invalid date format. Please use ISO date format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)',
        error: 'INVALID_DATE_FORMAT',
        receivedDate: date
      });
    }
    
    // Validate time format (basic check)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime)) {
      console.log('❌ Invalid start time format:', startTime);
      return res.status(400).json({ 
        message: 'Invalid start time format. Please use HH:MM format (e.g., 09:00)',
        error: 'INVALID_START_TIME_FORMAT',
        receivedStartTime: startTime
      });
    }
    
    if (!timeRegex.test(endTime)) {
      console.log('❌ Invalid end time format:', endTime);
      return res.status(400).json({ 
        message: 'Invalid end time format. Please use HH:MM format (e.g., 17:00)',
        error: 'INVALID_END_TIME_FORMAT',
        receivedEndTime: endTime
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
      image: req.file ? getImageInfo(req.file) : {},
      status: 'Active',
      isVisibleToStudents: isVisibleToStudents !== undefined ? isVisibleToStudents : true,
      createdBy: userId,
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

// Update event (All authenticated users)
router.put('/:eventId/edit', authMiddleware, (req, res, next) => {
  uploadEventImage(req, res, (err) => {
    if (err) {
      console.error('Multer error in event update:', err);
      return res.status(400).json({ 
        message: 'Image upload error: ' + (err.message || 'Invalid file format or size'),
        error: 'IMAGE_UPLOAD_ERROR'
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    console.log('🔍 Event update request received');
    console.log('   Event ID:', req.params.eventId);
    console.log('   User:', req.user);
    console.log('   User ID:', req.user?.userId || req.user?.id || req.user?._id);
    console.log('   Body:', req.body);
    
    const userId = req.user.userId || req.user.id || req.user._id;
    
    const Event = require('../models/Event');
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ 
        message: 'Event not found',
        error: 'EVENT_NOT_FOUND'
      });
    }
    
    // Check if user has permission to edit this event
    // Allow if user is admin, staff, or the creator of the event
    if (req.user.role !== 'Admin' && req.user.role !== 'Staff' && event.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ 
        message: 'You do not have permission to edit this event',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    
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
    
    // Update event fields
    if (title) event.title = title;
    if (description) event.description = description;
    if (date) event.date = new Date(date);
    if (startTime) event.startTime = startTime;
    if (endTime) event.endTime = endTime;
    if (location) event.location = location;
    if (hours) event.hours = Number(hours);
    if (maxParticipants) event.maxParticipants = Number(maxParticipants);
    if (departments) event.departments = departments;
    if (isForAllDepartments !== undefined) event.isForAllDepartments = isForAllDepartments === 'true';
    if (requiresApproval !== undefined) event.requiresApproval = requiresApproval === 'true';
    if (isVisibleToStudents !== undefined) event.isVisibleToStudents = isVisibleToStudents === 'true';
    
    // Update image if provided
    if (req.file) {
      event.image = getImageInfo(req.file);
    }
    
    await event.save();
    
    console.log('✅ Event updated successfully:', event._id);
    
    res.json({
      message: 'Event updated successfully!',
      event: event
    });
    
  } catch (error) {
    console.error('❌ Error updating event:', error);
    res.status(500).json({ message: 'Failed to update event', error: error.message });
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
    
    // Send approval email notification
    try {
      const user = await User.findById(req.params.userId);
      if (user && user.email) {
        const subject = `Event Registration Approved - ${event.title}`;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #28a745;">✅ Registration Approved!</h2>
            <p>Dear ${user.name},</p>
            <p>Great news! Your registration for the event <strong>"${event.title}"</strong> has been approved.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Event Details:</h3>
              <p><strong>Event:</strong> ${event.title}</p>
              <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${event.startTime} - ${event.endTime}</p>
              <p><strong>Location:</strong> ${event.location}</p>
              <p><strong>Hours:</strong> ${event.hours}</p>
            </div>
            
            <p>You can now attend the event. Please arrive on time and remember to time in and time out for attendance tracking.</p>
            
            <p>If you have any questions, please contact the event organizer.</p>
            
            <hr style="margin: 30px 0;">
            <p style="color: #6c757d; font-size: 12px;">
              This is an automated message from Charism Community Service System.
            </p>
          </div>
        `;
        
        await sendEmail(user.email, subject, null, html);
        console.log(`✅ Approval email sent to ${user.email}`);
      }
    } catch (emailError) {
      console.error('❌ Failed to send approval email:', emailError.message);
    }
    
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
    
    // Send disapproval email notification
    try {
      const user = await User.findById(req.params.userId);
      if (user && user.email) {
        const subject = `Event Registration Update - ${event.title}`;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc3545;">⚠️ Registration Update</h2>
            <p>Dear ${user.name},</p>
            <p>We regret to inform you that your registration for the event <strong>"${event.title}"</strong> has not been approved.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Event Details:</h3>
              <p><strong>Event:</strong> ${event.title}</p>
              <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${event.startTime} - ${event.endTime}</p>
              <p><strong>Location:</strong> ${event.location}</p>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h3>Reason:</h3>
              <p>${reason}</p>
            </div>
            
            <p>If you believe this is an error or have questions, please contact the event organizer for clarification.</p>
            
            <p>We encourage you to register for other available events in the future.</p>
            
            <hr style="margin: 30px 0;">
            <p style="color: #6c757d; font-size: 12px;">
              This is an automated message from Charism Community Service System.
            </p>
          </div>
        `;
        
        await sendEmail(user.email, subject, null, html);
        console.log(`✅ Disapproval email sent to ${user.email}`);
      }
    } catch (emailError) {
      console.error('❌ Failed to send disapproval email:', emailError.message);
    }
    
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
    
    // Send attendance approval email notification
    try {
      const user = await User.findById(req.params.userId);
      if (user && user.email) {
        const subject = `Attendance Approved - ${event.title}`;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #28a745;">✅ Attendance Approved!</h2>
            <p>Dear ${user.name},</p>
            <p>Congratulations! Your attendance for the event <strong>"${event.title}"</strong> has been approved.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Event Details:</h3>
              <p><strong>Event:</strong> ${event.title}</p>
              <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${event.startTime} - ${event.endTime}</p>
              <p><strong>Location:</strong> ${event.location}</p>
              <p><strong>Hours Earned:</strong> ${event.hours}</p>
            </div>
            
            <p>Your community service hours have been successfully recorded. Thank you for your participation!</p>
            
            <p>If you have any questions, please contact the event organizer.</p>
            
            <hr style="margin: 30px 0;">
            <p style="color: #6c757d; font-size: 12px;">
              This is an automated message from Charism Community Service System.
            </p>
          </div>
        `;
        
        await sendEmail(user.email, subject, null, html);
        console.log(`✅ Attendance approval email sent to ${user.email}`);
      }
    } catch (emailError) {
      console.error('❌ Failed to send attendance approval email:', emailError.message);
    }
    
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
    
    // Send attendance disapproval email notification
    try {
      const user = await User.findById(req.params.userId);
      if (user && user.email) {
        const subject = `Attendance Update - ${event.title}`;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc3545;">⚠️ Attendance Update</h2>
            <p>Dear ${user.name},</p>
            <p>We regret to inform you that your attendance for the event <strong>"${event.title}"</strong> has not been approved.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Event Details:</h3>
              <p><strong>Event:</strong> ${event.title}</p>
              <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${event.startTime} - ${event.endTime}</p>
              <p><strong>Location:</strong> ${event.location}</p>
              <p><strong>Hours:</strong> ${event.hours}</p>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h3>Reason:</h3>
              <p>${reason}</p>
            </div>
            
            <p>If you believe this is an error or have questions, please contact the event organizer for clarification.</p>
            
            <p>We encourage you to participate in future events.</p>
            
            <hr style="margin: 30px 0;">
            <p style="color: #6c757d; font-size: 12px;">
              This is an automated message from Charism Community Service System.
            </p>
          </div>
        `;
        
        await sendEmail(user.email, subject, null, html);
        console.log(`✅ Attendance disapproval email sent to ${user.email}`);
      }
    } catch (emailError) {
      console.error('❌ Failed to send attendance disapproval email:', emailError.message);
    }
    
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
    
    // Send attendance approval email notification
    try {
      const user = await User.findById(req.params.userId);
      if (user && user.email) {
        const subject = `Attendance Approved - ${event.title}`;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #28a745;">✅ Attendance Approved!</h2>
            <p>Dear ${user.name},</p>
            <p>Congratulations! Your attendance for the event <strong>"${event.title}"</strong> has been approved.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Event Details:</h3>
              <p><strong>Event:</strong> ${event.title}</p>
              <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${event.startTime} - ${event.endTime}</p>
              <p><strong>Location:</strong> ${event.location}</p>
              <p><strong>Hours Earned:</strong> ${event.hours}</p>
            </div>
            
            <p>Your community service hours have been successfully recorded. Thank you for your participation!</p>
            
            <p>If you have any questions, please contact the event organizer.</p>
            
            <hr style="margin: 30px 0;">
            <p style="color: #6c757d; font-size: 12px;">
              This is an automated message from Charism Community Service System.
            </p>
          </div>
        `;
        
        await sendEmail(user.email, subject, null, html);
        console.log(`✅ Attendance approval email sent to ${user.email}`);
      }
    } catch (emailError) {
      console.error('❌ Failed to send attendance approval email:', emailError.message);
    }
    
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
    
    // Send attendance disapproval email notification
    try {
      const user = await User.findById(req.params.userId);
      if (user && user.email) {
        const subject = `Attendance Update - ${event.title}`;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc3545;">⚠️ Attendance Update</h2>
            <p>Dear ${user.name},</p>
            <p>We regret to inform you that your attendance for the event <strong>"${event.title}"</strong> has not been approved.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Event Details:</h3>
              <p><strong>Event:</strong> ${event.title}</p>
              <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${event.startTime} - ${event.endTime}</p>
              <p><strong>Location:</strong> ${event.location}</p>
              <p><strong>Hours:</strong> ${event.hours}</p>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h3>Reason:</h3>
              <p>${reason}</p>
            </div>
            
            <p>If you believe this is an error or have questions, please contact the event organizer for clarification.</p>
            
            <p>We encourage you to participate in future events.</p>
            
            <hr style="margin: 30px 0;">
            <p style="color: #6c757d; font-size: 12px;">
              This is an automated message from Charism Community Service System.
            </p>
          </div>
        `;
        
        await sendEmail(user.email, subject, null, html);
        console.log(`✅ Attendance disapproval email sent to ${user.email}`);
      }
    } catch (emailError) {
      console.error('❌ Failed to send attendance disapproval email:', emailError.message);
    }
    
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
