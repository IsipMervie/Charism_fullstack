const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authMiddleware } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Department analytics
router.get('/department/:department', authMiddleware, roleMiddleware('Admin', 'Staff'), analyticsController.getDepartmentAnalytics);

// Yearly analytics
router.get('/yearly/:year', authMiddleware, roleMiddleware('Admin', 'Staff'), analyticsController.getYearlyAnalytics);

module.exports = router;