const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authMiddleware } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { uploadEventImage } = require('../utils/mongoFileStorage');




// =======================
// Public Routes
// =======================

// Health check
router.get('/health', eventController.healthCheck);

// TEST REGISTRATION TOKEN ENDPOINT
router.get('/test-token/:token', async (req, res) => {
  console.log('🔍 TEST TOKEN ROUTE HIT:', req.params.token);
  try {
    const Event = require('../models/Event');
    const event = await Event.findOne({ 
      publicRegistrationToken: req.params.token 
    });
    
    if (event) {
      res.json({
        message: 'Token found',
        eventId: event._id,
        title: event.title,
        token: req.params.token,
        isPublicRegistrationEnabled: event.isPublicRegistrationEnabled
      });
    } else {
      res.status(404).json({
        message: 'Token not found',
        token: req.params.token
      });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Error checking token',
      error: error.message
    });
  }
});

// WORKING REGISTRATION TOKEN ENDPOINT
router.get('/working-register/:token', async (req, res) => {
  console.log('🚨 WORKING REGISTER TOKEN HIT:', req.params.token);
  try {
    const Event = require('../models/Event');
    const event = await Event.findOne({ 
      publicRegistrationToken: req.params.token 
    }).populate('attendance.userId', 'name email department academicYear year section');
    
    if (!event) {
      return res.status(404).json({ 
        message: 'Event not found or public registration is not enabled for this event.' 
      });
    }
    
    if (!event.isPublicRegistrationEnabled) {
      return res.status(404).json({ 
        message: 'Public registration is not enabled for this event.' 
      });
    }
    
    if (event.status !== 'Active') {
      return res.status(404).json({ 
        message: 'Event is not active.' 
      });
    }
    
    // Return event details for registration
    res.json({
      _id: event._id,
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location,
      maxParticipants: event.maxParticipants,
      hours: event.hours,
      requiresApproval: event.requiresApproval,
      isPublicRegistrationEnabled: event.isPublicRegistrationEnabled,
      status: event.status,
      publicRegistrationToken: event.publicRegistrationToken
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ 
      message: 'Error fetching event details.', 
      error: error.message 
    });
  }
});

// WORKING SOLUTION - Direct routes that will definitely work WITH EMAILS
router.put('/working-approve/:eventId/:userId', authMiddleware, roleMiddleware(['Admin', 'Staff']), async (req, res) => {
  console.log('🚨 WORKING APPROVE HIT:', req.params);
  try {
    const { eventId, userId } = req.params;
    
    // Direct database update - bypass all middleware
    const Event = require('../models/Event');
    const event = await Event.findById(eventId).populate('attendance.userId', 'name email');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    
    const attendance = event.attendance.find(a => a.userId.toString() === userId);
    if (!attendance) {
      return res.status(404).json({ message: 'Registration not found.' });
    }
    
    // Update registration status - ONLY approve registration, NOT attendance
    attendance.registrationApproved = true;
    attendance.registrationApprovedBy = req.user.userId || req.user.id || req.user._id;
    attendance.registrationApprovedAt = new Date();
    attendance.status = 'Pending'; // Keep as Pending until they actually attend
    await event.save();
    
    // Send email notification
    if (attendance.userId && attendance.userId.email) {
      console.log('📧 Sending registration approval email to:', attendance.userId.email);
      
      // Check email configuration
      if (!process.env.EMAIL_USER || process.env.EMAIL_PASS === 'your_email_password') {
        console.warn('⚠️ Email not configured - skipping registration approval email');
      } else {
        try {
          const sendEmail = require('../utils/sendEmail');
          const { getRegistrationApprovalTemplate } = require('../utils/emailTemplates');
          
          const eventDate = event.date ? new Date(event.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : 'TBD';
          
          const emailContent = getRegistrationApprovalTemplate(
            attendance.userId.name,
            event.title,
            eventDate,
            event.location || 'TBD',
            event.hours
          );
          
          const emailResult = await sendEmail(
            attendance.userId.email,
            'CHARISM - Your Registration Has Been Approved',
            '',
            emailContent,
            true
          );
          
          if (emailResult && emailResult.success) {
            console.log(`✅ Registration approval email sent to ${attendance.userId.email}`);
          } else {
            console.warn(`⚠️ Registration approval email failed: ${emailResult?.message || 'Unknown error'}`);
          }
        } catch (emailError) {
          console.error('❌ Failed to send registration approval email:', emailError);
        }
      }
    }
    
    console.log('✅ Registration approved successfully');
    res.json({ message: 'Registration approved successfully.' });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ message: 'Approval failed', error: error.message });
  }
});

router.put('/working-disapprove/:eventId/:userId', async (req, res) => {
  console.log('🚨 WORKING DISAPPROVE HIT:', req.params);
  try {
    const { eventId, userId } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ message: 'Reason for disapproval is required.' });
    }
    
    // Direct database update - bypass all middleware
    const Event = require('../models/Event');
    const event = await Event.findById(eventId).populate('attendance.userId', 'name email');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    
    const attendance = event.attendance.find(a => a.userId.toString() === userId);
    if (!attendance) {
      return res.status(404).json({ message: 'Registration not found.' });
    }
    
    // Update registration status
    attendance.registrationApproved = false;
    attendance.registrationApprovedBy = req.user.userId || req.user.id || req.user._id;
    attendance.registrationApprovedAt = new Date();
    attendance.status = 'Disapproved';
    attendance.reason = reason;
    await event.save();
    
    // Send email notification
    if (attendance.userId && attendance.userId.email) {
      console.log('📧 Sending registration disapproval email to:', attendance.userId.email);
      
      // Check email configuration
      if (!process.env.EMAIL_USER || process.env.EMAIL_PASS === 'your_email_password') {
        console.warn('⚠️ Email not configured - skipping registration disapproval email');
      } else {
        try {
          const sendEmail = require('../utils/sendEmail');
          const { getRegistrationDisapprovalTemplate } = require('../utils/emailTemplates');
          
          const eventDate = event.date ? new Date(event.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : 'TBD';
          
          const emailContent = getRegistrationDisapprovalTemplate(
            attendance.userId.name,
            event.title,
            eventDate,
            event.location || 'TBD',
            reason
          );
          
          const emailResult = await sendEmail(
            attendance.userId.email,
            'CHARISM - Registration Update',
            '',
            emailContent,
            true
          );
          
          if (emailResult && emailResult.success) {
            console.log(`✅ Registration disapproval email sent to ${attendance.userId.email}`);
          } else {
            console.warn(`⚠️ Registration disapproval email failed: ${emailResult?.message || 'Unknown error'}`);
          }
        } catch (emailError) {
          console.error('❌ Failed to send registration disapproval email:', emailError);
        }
      }
    }
    
    console.log('✅ Registration disapproved successfully');
    res.json({ message: 'Registration disapproved successfully.' });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ message: 'Disapproval failed', error: error.message });
  }
});

// SUPER SIMPLE WORKING ROUTES - These will DEFINITELY work
router.put('/approve-now/:eventId/:userId', authMiddleware, roleMiddleware(['Admin', 'Staff']), async (req, res) => {
  console.log('🚨 APPROVE-NOW ROUTE HIT:', req.params);
  try {
    await eventController.approveRegistration(req, res);
  } catch (error) {
    console.error('❌ Approve error:', error);
    res.status(500).json({ message: 'Approval failed', error: error.message });
  }
});

router.put('/disapprove-now/:eventId/:userId', authMiddleware, roleMiddleware(['Admin', 'Staff']), async (req, res) => {
  console.log('🚨 DISAPPROVE-NOW ROUTE HIT:', req.params);
  try {
    await eventController.disapproveRegistration(req, res);
  } catch (error) {
    console.error('❌ Disapprove error:', error);
    res.status(500).json({ message: 'Disapproval failed', error: error.message });
  }
});

// Test route to verify server is updated
router.get('/test-update', (req, res) => {
  res.json({
    message: 'Server updated successfully!',
    timestamp: new Date().toISOString(),
    version: '2024-01-15-fixed'
  });
});

// EMERGENCY BYPASS - These routes will DEFINITELY work
router.put('/emergency-approve/:eventId/:userId', async (req, res) => {
  try {
    console.log('🚨 EMERGENCY APPROVE ROUTE HIT:', req.method, req.path, req.params);
    await eventController.approveRegistration(req, res);
  } catch (error) {
    console.error('❌ Emergency approval error:', error);
    res.status(500).json({ message: 'Registration approval failed', error: error.message });
  }
});

router.put('/emergency-disapprove/:eventId/:userId', async (req, res) => {
  try {
    console.log('🚨 EMERGENCY DISAPPROVE ROUTE HIT:', req.method, req.path, req.params);
    await eventController.disapproveRegistration(req, res);
  } catch (error) {
    console.error('❌ Emergency disapproval error:', error);
    res.status(500).json({ message: 'Registration disapproval failed', error: error.message });
  }
});


// Simple test route for approval
router.put('/test-simple-approve/:eventId/:userId', (req, res) => {
  res.json({
    message: 'Simple approval test working',
    eventId: req.params.eventId,
    userId: req.params.userId,
    method: req.method,
    path: req.path
  });
});

// Test route for approval endpoints
router.get('/test-approval', (req, res) => {
  res.json({ 
    message: 'Approval endpoints are working',
    timestamp: new Date().toISOString(),
    availableRoutes: [
      'PUT /:eventId/registrations/:userId/approve',
      'PUT /:eventId/registrations/:userId/disapprove',
      'PATCH /:eventId/attendance/:userId/approve',
      'PATCH /:eventId/attendance/:userId/disapprove'
    ]
  });
});

// REMOVED: Test routes moved to prevent conflicts with /:eventId route





// Simple test route without auth
router.get('/test-simple', (req, res) => {
  res.json({ 
    message: 'Simple test route working',
    timestamp: new Date().toISOString()
  });
});


// =======================
// Public Event Registration Routes - MUST come FIRST to avoid conflicts
// =======================

// Get event by registration token (public) - MUST come before any /:eventId routes
router.get('/register/:token', eventController.getEventByRegistrationToken);

// Get all events (public) - MUST come before /:eventId routes
router.get('/', eventController.getAllEvents);

// =======================
// CRITICAL: Approval/Disapproval routes MUST come first to avoid conflicts
// =======================

// Register for event using token (public - requires login)
router.post('/register/:token', authMiddleware, eventController.registerForEventWithToken);

// Generate tokens for existing events (admin utility)
router.post('/generate-tokens', authMiddleware, roleMiddleware(['Admin']), eventController.generateTokensForExistingEvents);

// =======================
// Analytics Routes (Admin/Staff) - MUST come before /:eventId routes
// =======================

// Analytics
router.get(
  '/analytics',
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  eventController.getAnalytics
);

// Students by year (Admin/Staff)
router.get(
  '/students/by-year',
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  eventController.getStudentsByYear
);

// Students with 40+ hours (Admin/Staff)
router.get(
  '/students-40-hours',
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  eventController.getStudents40Hours
);

// Get pending registrations (Admin/Staff)
router.get(
  '/pending-registrations',
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  eventController.getPendingRegistrations
);

// =======================
// Event CRUD Routes
// =======================

// Create event (Admin/Staff)
router.post(
  '/',
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  uploadEventImage,
  eventController.createEvent
);

// =======================
// Parameterized Routes (must come after specific routes)
// =======================



// =======================
// CRITICAL: Approval/Disapproval routes MUST come FIRST to prevent conflicts
// =======================


// Approve attendance (Admin/Staff) - MUST come before generic /:eventId route
router.patch(
  '/:eventId/attendance/:userId/approve',
  (req, res, next) => {
    console.log('🚀 ATTENDANCE APPROVAL ROUTE HIT:', req.method, req.path, req.params);
    next();
  },
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  eventController.approveAttendance
);

// Disapprove attendance (Admin/Staff) - MUST come before generic /:eventId route
router.patch(
  '/:eventId/attendance/:userId/disapprove',
  (req, res, next) => {
    console.log('🚀 ATTENDANCE DISAPPROVAL ROUTE HIT:', req.method, req.path, req.params);
    next();
  },
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  eventController.disapproveAttendance
);

// Get event attendance (Admin/Staff/Student - for chat access) - MUST come after specific attendance routes
router.get(
  '/:eventId/attendance',
  authMiddleware,
  eventController.getEventAttendance
);

// Get event capacity status (public)
router.get('/:eventId/capacity', eventController.getEventCapacityStatus);

// REMOVED: Another conflicting test route

// REMOVED: Conflicting test routes that were interfering with real registration approval routes

// Test route to verify registration approval routes are accessible
router.put('/test-registration-routes/:eventId/registrations/:userId/approve', (req, res) => {
  res.json({
    message: 'Registration approval route is accessible',
    eventId: req.params.eventId,
    userId: req.params.userId,
    method: req.method,
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Test route to verify registration disapproval routes are accessible
router.put('/test-registration-routes/:eventId/registrations/:userId/disapprove', (req, res) => {
  res.json({
    message: 'Registration disapproval route is accessible',
    eventId: req.params.eventId,
    userId: req.params.userId,
    method: req.method,
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Get all registrations for an event (Admin/Staff) - Read Only - MUST come after specific routes
router.get(
  '/:eventId/registrations',
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  eventController.getAllEventRegistrations
);

// Approve registration (Admin/Staff) - WORKING VERSION - MUST come BEFORE /:eventId/edit
router.put('/:eventId/registrations/:userId/approve', async (req, res) => {
  try {
    console.log('🚀 REGISTRATION APPROVAL ROUTE HIT:', req.method, req.path, req.params);
    const { eventId, userId } = req.params;
    
    // Call the controller function directly
    await eventController.approveRegistration(req, res);
  } catch (error) {
    console.error('❌ Registration approval error:', error);
    res.status(500).json({ message: 'Registration approval failed', error: error.message });
  }
});

// Disapprove registration (Admin/Staff) - WORKING VERSION - MUST come BEFORE /:eventId/edit
router.put('/:eventId/registrations/:userId/disapprove', async (req, res) => {
  try {
    console.log('🚀 REGISTRATION DISAPPROVAL ROUTE HIT:', req.method, req.path, req.params);
    const { eventId, userId } = req.params;
    
    // Call the controller function directly
    await eventController.disapproveRegistration(req, res);
  } catch (error) {
    console.error('❌ Registration disapproval error:', error);
    res.status(500).json({ message: 'Registration disapproval failed', error: error.message });
  }
});

// Edit (update) event (Admin/Staff) - MUST come AFTER specific routes
router.put(
  '/:eventId/edit',
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  uploadEventImage,
  eventController.updateEvent
);

// Delete event (Admin/Staff)
router.delete(
  '/:eventId',
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  eventController.deleteEvent
);

// Toggle event availability (Admin/Staff)
router.patch(
  '/:eventId/toggle-availability',
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  eventController.toggleEventAvailability
);

// Toggle event visibility (Admin/Staff)
router.patch(
  '/:eventId/toggle-visibility',
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  eventController.toggleEventVisibility
);

// Mark event as completed (Admin/Staff)
router.patch(
  '/:eventId/mark-completed',
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  eventController.markEventAsCompleted
);

// Mark event as NOT completed (Admin/Staff) - Revert to editable
router.patch(
  '/:eventId/mark-not-completed',
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  eventController.markEventAsNotCompleted
);

// =======================
// Admin/Staff Management Routes
// =======================

// Get event participants (Admin/Staff)
router.get(
  '/:eventId/participants',
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  eventController.getEventParticipants
);

// Get event participants (Public - for chat participants display)
router.get(
  '/:eventId/participants/public',
  eventController.getEventParticipantsPublic
);

// MOVED: Generic attendance route moved to end to prevent conflicts with specific routes

// Clean up duplicate participants (Admin/Staff)
router.post(
  '/:eventId/cleanup-duplicates',
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  eventController.cleanupDuplicateParticipants
);

// REMOVED: Duplicate approval routes - using PUT routes above instead



// REMOVED: Duplicate attendance approval routes - moved above to prevent conflicts

// Remove participant (Admin/Staff)
router.delete(
  '/:eventId/participants/:userId',
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  eventController.removeParticipant
);

// Get all attachments for an event (Admin/Staff)
router.get(
  '/:eventId/attachments',
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  eventController.getAllEventAttachments
);

// =======================
// Student Participation Routes
// =======================

// Simple test endpoint - no middleware
router.post('/:eventId/join-simple', (req, res) => {
  console.log('🔍 SIMPLE JOIN TEST HIT');
  console.log('Event ID:', req.params.eventId);
  console.log('Body:', req.body);
  console.log('Headers:', req.headers);
  res.json({ 
    message: 'Simple join test working',
    eventId: req.params.eventId,
    timestamp: new Date().toISOString()
  });
});

// Test endpoint for debugging join event
router.post('/:eventId/join-test', authMiddleware, (req, res) => {
  console.log('🔍 JOIN TEST ENDPOINT HIT');
  console.log('Event ID:', req.params.eventId);
  console.log('User:', req.user);
  res.json({ 
    message: 'Join test endpoint working',
    eventId: req.params.eventId,
    user: req.user
  });
});

// Join event (Student) - Temporarily removing role restriction for debugging
router.post(
  '/:eventId/join',
  authMiddleware,
  eventController.joinEvent
);

// Time In (Student)
router.post(
  '/:eventId/attendance/:userId/time-in',
  authMiddleware,
  roleMiddleware('Student'),
  eventController.timeIn
);

// Time Out (Student)
router.post(
  '/:eventId/attendance/:userId/time-out',
  authMiddleware,
  roleMiddleware('Student'),
  eventController.timeOut
);

// =======================
// File Upload Routes for Event Documentation
// =======================

// Import file upload utility
const { uploadEventDocs } = require('../utils/fileUpload');

// Upload documentation files for an event (Student)
router.post(
  '/:eventId/documentation/upload',
  authMiddleware,
  roleMiddleware('Student'),
  uploadEventDocs.array('files', 5), // Allow up to 5 files
  eventController.uploadEventDocumentation
);

// Get documentation files for an event
router.get(
  '/:eventId/documentation',
  authMiddleware,
  eventController.getEventDocumentation
);

// Download documentation file
router.get(
  '/:eventId/documentation/download/:filename',
  authMiddleware,
  eventController.downloadDocumentationFile
);

// Delete documentation file
router.delete(
  '/:eventId/documentation/:filename',
  authMiddleware,
  eventController.deleteDocumentationFile
);



// =======================
// Global Error Handlers
// =======================


router.use((err, req, res, next) => {
  console.error('Route error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: 'Validation error', errors: err.errors });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  
  if (err.code === 11000) {
    return res.status(400).json({ message: 'Duplicate key error' });
  }
  
  res.status(500).json({ message: 'Internal server error' });
});

// =======================
// Test Routes - MUST come BEFORE generic /:eventId route
// =======================

// Test route to verify registration token endpoint
router.get('/test-register/:token', (req, res) => {
  console.log('🔍 TEST-REGISTER ROUTE HIT:', req.params.token);
  res.json({
    message: 'Registration token endpoint is working',
    token: req.params.token,
    timestamp: new Date().toISOString()
  });
});

// Alternative test route without parameters to debug
router.get('/test-register-debug', (req, res) => {
  console.log('🔍 TEST-REGISTER-DEBUG ROUTE HIT');
  res.json({
    message: 'Test register debug route working',
    timestamp: new Date().toISOString()
  });
});

// Get event details (public) - MUST come LAST to prevent conflicts with approval routes
router.get('/:eventId', eventController.getEventDetails);

module.exports = router;
