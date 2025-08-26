const express = require('express');
const router = express.Router();

const feedbackController = require('../controllers/feedbackController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

// Public routes (no authentication required)
router.post('/submit', feedbackController.submitFeedback);

// Admin routes (admin role required) - MUST come before /:feedbackId to avoid conflicts
router.get('/admin/all', authMiddleware, roleMiddleware('Admin'), feedbackController.getAllFeedback);
router.get('/admin/stats', authMiddleware, roleMiddleware('Admin'), feedbackController.getFeedbackStats);
router.put('/admin/:feedbackId', authMiddleware, roleMiddleware('Admin'), feedbackController.updateFeedback);
router.delete('/admin/:feedbackId', authMiddleware, roleMiddleware('Admin'), feedbackController.deleteFeedback);

// User routes (authenticated users) - MUST come after admin routes
router.get('/my-feedback', authMiddleware, feedbackController.getUserFeedback);
router.get('/:feedbackId', authMiddleware, feedbackController.getFeedbackById);

module.exports = router;
