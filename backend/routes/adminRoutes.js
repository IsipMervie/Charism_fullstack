// backend/routes/adminRoutes.js

const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const { authMiddleware } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// All routes here are protected: only Admins can access
router.use(authMiddleware, roleMiddleware('Admin'));

// Dashboard analytics
router.get('/dashboard', adminController.getAdminDashboard);

// User management
router.get('/users', adminController.getAllUsers);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Student reports
router.get('/students-by-year', adminController.getStudentsByYear);
router.get('/students-by-year-filter-options', adminController.getStudentsByYearFilterOptions);
router.get('/students-40-hours', adminController.getStudents40Hours);

// Event management
router.get('/events', adminController.getAllEvents);
router.get('/events-with-user-data', adminController.getEventsWithUserData);
router.delete('/events/:id', adminController.deleteEvent);

// Message management (contact-us)
router.get('/messages', adminController.getAllMessages);
router.delete('/messages/:id', adminController.deleteMessage);

// Staff approval management
router.get('/staff-approvals', adminController.getPendingStaffApprovals);
router.post('/staff-approvals/:userId/approve', adminController.approveStaff);
router.post('/staff-approvals/:userId/reject', adminController.rejectStaff);

module.exports = router;