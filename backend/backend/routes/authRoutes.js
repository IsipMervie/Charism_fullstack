const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Register a new user
router.post('/register', authController.register);

// Login user
router.post('/login', authController.login);

// Verify email
router.get('/verify-email/:token', authController.verifyEmail);

// Forgot password (send reset link)
router.post('/forgot-password', authController.forgotPassword);

// Reset password (token in body)
router.post('/reset-password', authController.resetPassword);
// Reset password using token in URL
router.post('/reset-password/:token', authController.resetPassword);

// Change password (user must be logged in)
router.post('/change-password', authMiddleware, authController.changePassword);

module.exports = router;
