const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

// Get all users (Admin/Staff)
router.get(
  '/',
  authMiddleware,
  roleMiddleware('Admin', 'Staff'),
  userController.getUsers
);

// Get user profile by ID (self or admin)
router.get('/:id', authMiddleware, userController.getUserById);

// Update user profile by ID (self or admin)
router.put('/:id', authMiddleware, userController.updateUser);

module.exports = router;