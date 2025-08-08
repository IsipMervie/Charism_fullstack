// backend/routes/settingsRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const settingsController = require('../controllers/settingsController');
const { authMiddleware } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Get public school settings (no auth required, for navbar)
router.get(
  '/public/school',
  settingsController.getPublicSchoolSettings
);

// Multer setup for logo uploads
const upload = multer({ dest: path.join(__dirname, '..', 'uploads') });

// Get school settings (Admin only)
router.get(
  '/school',
  authMiddleware,
  roleMiddleware('Admin'),
  settingsController.getSchoolSettings
);

// Get all registration settings (Admin only)
router.get(
  '/',
  authMiddleware,
  roleMiddleware('Admin'),
  settingsController.getSettings
);

// Get public registration settings (for registration page, no auth required)
router.get(
  '/public',
  settingsController.getPublicSettings
);

// Update school settings (Admin only, with logo upload)
router.post(
  '/school',
  authMiddleware,
  roleMiddleware('Admin'),
  upload.single('logo'),
  settingsController.updateSchoolSettings
);

// Get user profile (all authenticated users)
router.get(
  '/profile',
  authMiddleware,
  settingsController.getProfile
);

// Update user profile/settings (all users)
router.post(
  '/profile',
  authMiddleware,
  settingsController.updateProfile
);



// Sections Management (Admin only)
router.post(
  '/sections',
  authMiddleware,
  roleMiddleware('Admin'),
  settingsController.addSection
);

router.put(
  '/sections/:id',
  authMiddleware,
  roleMiddleware('Admin'),
  settingsController.updateSection
);

router.delete(
  '/sections/:id',
  authMiddleware,
  roleMiddleware('Admin'),
  settingsController.deleteSection
);

// Year Levels Management (Admin only)
router.post(
  '/year-levels',
  authMiddleware,
  roleMiddleware('Admin'),
  settingsController.addYearLevel
);

router.put(
  '/year-levels/:id',
  authMiddleware,
  roleMiddleware('Admin'),
  settingsController.updateYearLevel
);

router.delete(
  '/year-levels/:id',
  authMiddleware,
  roleMiddleware('Admin'),
  settingsController.deleteYearLevel
);

// Departments Management (Admin only)
router.post(
  '/departments',
  authMiddleware,
  roleMiddleware('Admin'),
  settingsController.addDepartment
);

router.put(
  '/departments/:id',
  authMiddleware,
  roleMiddleware('Admin'),
  settingsController.updateDepartment
);

router.delete(
  '/departments/:id',
  authMiddleware,
  roleMiddleware('Admin'),
  settingsController.deleteDepartment
);

module.exports = router;