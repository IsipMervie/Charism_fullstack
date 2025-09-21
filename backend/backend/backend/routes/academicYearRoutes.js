// backend/routes/academicYearRoutes.js

const express = require('express');
const router = express.Router();
const academicYearController = require('../controllers/academicYearController');
const { authMiddleware } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Public route to get active academic years (for registration)
router.get('/active', academicYearController.getActiveAcademicYears);

// Admin-only routes
router.get('/', authMiddleware, roleMiddleware('Admin'), academicYearController.getAcademicYears);
router.post('/', authMiddleware, roleMiddleware('Admin'), academicYearController.createAcademicYear);
router.put('/:id', authMiddleware, roleMiddleware('Admin'), academicYearController.updateAcademicYear);
router.delete('/:id', authMiddleware, roleMiddleware('Admin'), academicYearController.deleteAcademicYear);
router.patch('/:id/toggle', authMiddleware, roleMiddleware('Admin'), academicYearController.toggleActiveStatus);

module.exports = router; 