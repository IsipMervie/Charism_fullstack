const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const eventController = require('../controllers/eventController');
const { authMiddleware } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer setup for file uploads (event images, reflections)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Preserve original filename with timestamp to avoid conflicts
    const timestamp = Date.now();
    const originalName = file.originalname;
    const ext = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, ext);
    // Sanitize filename to prevent security issues
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '_');
    cb(null, `${timestamp}_${sanitizedName}${ext}`);
  }
});

// File filter to allow specific file types
const fileFilter = (req, file, cb) => {
  // Allow common document and media file types
  const allowedTypes = [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'application/rtf',
    'application/vnd.oasis.opendocument.text',
    
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/tiff',
    'image/webp',
    'image/svg+xml',
    
    // Videos
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/wmv',
    'video/flv',
    'video/webm',
    'video/x-matroska',
    'video/x-msvideo',
    'video/quicktime',
    
    // Audio
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/aac',
    'audio/flac',
    
    // Archives
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/x-tar',
    'application/gzip',
    
    // Presentations
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    
    // Code files
    'text/html',
    'text/css',
    'application/javascript',
    'application/json',
    'application/xml',
    'text/x-python',
    'text/x-java-source',
    'text/x-c++src',
    'text/x-csrc',
    'application/x-httpd-php',
    'application/sql',
    
    // Other common formats
    'text/markdown'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed. Please upload a supported file type.`), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: 'File too large. Maximum file size is 50MB.' 
      });
    }
    return res.status(400).json({ 
      message: 'File upload error: ' + err.message 
    });
  } else if (err) {
    // Handle file type errors
    if (err.message && err.message.includes('File type')) {
      return res.status(400).json({ 
        message: err.message 
      });
    }
    return res.status(500).json({ 
      message: 'File upload error: ' + err.message 
    });
  }
  next();
};

// =======================
// Public Routes
// =======================

// Get all events (public)
router.get('/', eventController.getAllEvents);

// =======================
// Analytics Routes (Admin/Staff) - Must come before /:eventId routes
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

// =======================
// Event Management Routes (Admin/Staff) - Must come before /:eventId routes
// =======================

// Create Event (Admin/Staff)
router.post(
  '/create',
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  upload.single('image'),
  handleMulterError,
  eventController.createEvent
);

// =======================
// Parameterized Routes (must come after specific routes)
// =======================

// Get event details (public)
router.get('/:eventId', eventController.getEventDetails);

// Edit (update) event (Admin/Staff)
router.put(
  '/:eventId',
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  upload.single('image'),
  handleMulterError,
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
  '/:eventId/attendance/:userId/time-in',  // Fixed route to match controller
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

// Upload reflection/attachment (Student)
router.post(
  '/:eventId/attendance/:userId/reflection',
  authMiddleware,
  roleMiddleware('Student'),
  upload.single('file'),
  handleMulterError,
  eventController.uploadReflection
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

// Download reflection/attachment (Admin/Staff)
router.get(
  '/:eventId/attendance/:userId/reflection',
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  eventController.downloadReflection
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
