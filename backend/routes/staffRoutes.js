// backend/routes/staffRoutes.js

const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const { authMiddleware } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// All routes here are protected: Staff and Admin can access
router.use(authMiddleware, roleMiddleware('Admin', 'Staff'));

// Staff access to events with user data
router.get('/events-with-user-data', adminController.getEventsWithUserData);

module.exports = router;
