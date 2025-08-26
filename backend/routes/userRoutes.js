const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const { uploadProfilePicture } = require('../utils/profilePictureUpload');

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

// Upload profile picture
router.post('/:id/profile-picture', authMiddleware, uploadProfilePicture.single('profilePicture'), userController.uploadProfilePicture);

// Delete profile picture
router.delete('/:id/profile-picture', authMiddleware, userController.deleteProfilePicture);

module.exports = router;