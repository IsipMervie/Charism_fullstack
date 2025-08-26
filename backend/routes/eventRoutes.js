const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const eventController = require('../controllers/eventController');
const { authMiddleware } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// Enhanced multer config with file filtering
const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1 // Only allow 1 file
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for reflections (users can upload various document types)
    // This is more permissive than the frontend accept attribute
    cb(null, true);
  }
});

// Enhanced error handling
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(413).json({ 
          message: 'File is too large. Maximum size is 50MB.',
          error: 'FILE_TOO_LARGE'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({ 
          message: 'Too many files. Only one file is allowed.',
          error: 'TOO_MANY_FILES'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({ 
          message: 'Unexpected file field.',
          error: 'UNEXPECTED_FILE'
        });
      default:
        return res.status(400).json({ 
          message: `Upload error: ${err.message}`,
          error: 'UPLOAD_ERROR'
        });
    }
  }
  
  // Handle other file-related errors
  if (err.code === 'ENOSPC') {
    return res.status(507).json({ 
      message: 'Server storage is full. Please try again later.',
      error: 'STORAGE_FULL'
    });
  }
  
  next(err);
};

// =======================
// Public Routes
// =======================

// Health check
router.get('/health', eventController.healthCheck);

// Get all events (public) - MUST come before /:eventId routes
router.get('/', eventController.getAllEvents);

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
  upload.single('image'),
  eventController.createEvent
);

// =======================
// Parameterized Routes (must come after specific routes)
// =======================

// Get event details (public)
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

// Edit (update) event (Admin/Staff)
router.put(
  '/:eventId',
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  upload.single('image'),
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

// Approve registration for specific event (Admin/Staff) - Frontend expects this route
router.put(
  '/:eventId/registrations/:userId/approve',
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  eventController.approveRegistration
);

// Disapprove registration for specific event (Admin/Staff) - Frontend expects this route
router.put(
  '/:eventId/registrations/:userId/disapprove',
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

// Join event (Student)
router.post(
  '/:eventId/join',
  authMiddleware,
  roleMiddleware('Student'),
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

// 404 handler for undefined routes
router.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
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
