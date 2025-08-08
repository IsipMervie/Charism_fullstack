const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const reportController = require('../controllers/reportController');

// Students by year PDF report
router.get(
  '/students-by-year',
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  reportController.studentsByYearPDF
);

// Students with 40+ hours PDF report
router.get(
  '/students-40-hours',
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  reportController.students40HoursPDF
);

// Event attendance PDF report
router.get(
  '/event-attendance/:eventId',
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  reportController.eventAttendancePDF
);

// Event list PDF report (for Admin/Staff)
router.get(
  '/event-list',
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  reportController.eventListPDF
);

module.exports = router;