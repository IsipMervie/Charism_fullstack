const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authMiddleware } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { uploadEventImage } = require('../utils/mongoFileStorage');

// Debug middleware to log all requests
router.use((req, res, next) => {
  if (req.path.includes('approve') || req.path.includes('disapprove')) {
    console.log('🚨 EVENT ROUTER DEBUG:', {
      method: req.method,
      url: req.url,
      path: req.path,
      params: req.params,
      body: req.body,
      timestamp: new Date().toISOString()
    });
  }
  next();
});



// =======================
// Public Routes
// =======================

// Health check
router.get('/health', eventController.healthCheck);

// Test route for approval endpoints
router.get('/test-approval', (req, res) => {
  res.json({ 
    message: 'Approval endpoints are working',
    timestamp: new Date().toISOString(),
    availableRoutes: [
      'PUT /:eventId/registrations/:userId/approve',
      'PUT /:eventId/registrations/:userId/disapprove',
      'PUT /:eventId/approve/:userId',
      'PUT /:eventId/disapprove/:userId'
    ]
  });
});


// Direct test route for disapproval
router.put('/test-disapprove/:eventId/:userId', (req, res) => {
  console.log('🔍 TEST DISAPPROVE ROUTE HIT:', {
    method: req.method,
    url: req.url,
    params: req.params,
    body: req.body
  });
  res.json({ 
    message: 'Test disapprove route working',
    eventId: req.params.eventId,
    userId: req.params.userId,
    timestamp: new Date().toISOString()
  });
});

// Simple test route without auth
router.get('/test-simple', (req, res) => {
  res.json({ 
    message: 'Simple test route working',
    timestamp: new Date().toISOString()
  });
});


// Get all events (public) - MUST come before /:eventId routes
router.get('/', eventController.getAllEvents);

// =======================
// CRITICAL: Approval/Disapproval routes MUST come first to avoid conflicts
// =======================

// TEST ROUTE - Simple test without auth to verify route structure
router.put('/:eventId/registrations/:userId/test-route', (req, res) => {
  console.log('🚨 TEST ROUTE HIT:', {
    method: req.method,
    url: req.url,
    params: req.params,
    timestamp: new Date().toISOString()
  });
  res.json({ 
    message: 'Test route working - route structure is correct',
    eventId: req.params.eventId,
    userId: req.params.userId,
    timestamp: new Date().toISOString()
  });
});

// SIMPLE APPROVAL TEST - No auth required for testing
router.put('/:eventId/registrations/:userId/test-approve', (req, res) => {
  console.log('🚨 TEST APPROVE ROUTE HIT:', {
    method: req.method,
    url: req.url,
    params: req.params,
    timestamp: new Date().toISOString()
  });
  res.json({ 
    message: 'Test approve route working - approval routes are accessible',
    eventId: req.params.eventId,
    userId: req.params.userId,
    timestamp: new Date().toISOString()
  });
});

// =======================
// Public Event Registration Routes
// =======================

// Get event by registration token (public)
router.get('/register/:token', eventController.getEventByRegistrationToken);

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



// Get event details (public) - MUST come after specific routes
router.get('/:eventId', eventController.getEventDetails);

// Get event capacity status (public)
router.get('/:eventId/capacity', eventController.getEventCapacityStatus);

// Get all registrations for an event (Admin/Staff)
router.get(
  '/:eventId/registrations',
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  eventController.getAllEventRegistrations
);

// Get pending registrations for a specific event (Admin/Staff)
router.get(
  '/:eventId/registrations/pending',
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  eventController.getPendingRegistrationsForEvent
);

// =======================
// CRITICAL: Approval/Disapproval routes MUST come before general /:eventId route
// =======================

// Approve registration for specific event (Admin/Staff) - Frontend expects this route
router.put(
  '/:eventId/registrations/:userId/approve',
  (req, res, next) => {
    console.log('🚨 APPROVE ROUTE HIT - DEPLOYMENT TEST:', {
      method: req.method,
      url: req.url,
      params: req.params,
      body: req.body,
      timestamp: new Date().toISOString()
    });
    next();
  },
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  eventController.approveRegistration
);

// Disapprove registration for specific event (Admin/Staff) - Frontend expects this route
router.put(
  '/:eventId/registrations/:userId/disapprove',
  (req, res, next) => {
    console.log('🚨 DISAPPROVE ROUTE HIT - DEPLOYMENT TEST:', {
      method: req.method,
      url: req.url,
      params: req.params,
      body: req.body,
      timestamp: new Date().toISOString()
    });
    next();
  },
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  eventController.disapproveRegistration
);

// Edit (update) event (Admin/Staff) - MUST come after specific routes
router.put(
  '/:eventId',
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

// Get event attendance (Admin/Staff/Student - for chat access)
router.get(
  '/:eventId/attendance',
  authMiddleware,
  eventController.getEventAttendance
);

// Clean up duplicate participants (Admin/Staff)
router.post(
  '/:eventId/cleanup-duplicates',
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  eventController.cleanupDuplicateParticipants
);

// Approve/reject registration (Admin/Staff)
router.patch(
  '/:eventId/attendance/:userId/approve-registration',
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  eventController.approveRegistration
);

// Disapprove registration (Admin/Staff)
router.patch(
  '/:eventId/attendance/:userId/disapprove-registration',
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  eventController.disapproveRegistration
);

// Simple approve route (for compatibility)
router.put(
  '/:eventId/approve/:userId',
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  eventController.approveRegistration
);

// Simple disapprove route (for compatibility)
router.put(
  '/:eventId/disapprove/:userId',
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  eventController.disapproveRegistration
);


// Approve attendance (Admin/Staff)
router.patch(
  '/:eventId/attendance/:userId/approve',
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  eventController.approveAttendance
);

// Disapprove attendance (Admin/Staff)
router.patch(
  '/:eventId/attendance/:userId/disapprove',
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  eventController.disapproveAttendance
);

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

module.exports = router;
