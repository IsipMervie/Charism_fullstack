// backend/controllers/userController.js

const User = require('../models/User');
const { uploadProfilePicture, getImageInfo, hasFile } = require('../utils/mongoFileStorage');

// Get all users (Admin only, with optional search/filter)
exports.getUsers = async (req, res) => {
  try {
    const { search, role } = req.query;
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) {
      query.role = role;
    }
    const users = await User.find(query).select('-password');
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
};

// Get a user by ID (profile)
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user', error: err.message });
  }
};

// Update a user by ID (Admin or self)
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error updating user', error: err.message });
  }
};

// Delete a user (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user', error: err.message });
  }
};

// Upload profile picture
exports.uploadProfilePicture = async (req, res) => {
  try {
    console.log('=== Profile Picture Upload Debug ===');
    console.log('req.file:', req.file);
    console.log('req.params.id:', req.params.id);
    console.log('req.user.id:', req.user.id);
    console.log('req.user.role:', req.user.role);
    console.log('req.user.id type:', typeof req.user.id);
    console.log('req.params.id type:', typeof req.params.id);
    console.log('req.body:', req.body);
    console.log('req.headers:', req.headers);
    
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('File details:');
    console.log('- Original name:', req.file.originalname);
    console.log('- Mimetype:', req.file.mimetype);
    console.log('- Size:', req.file.size);
    console.log('- Buffer length:', req.file.buffer ? req.file.buffer.length : 'No buffer');

    const userId = req.params.id;
    const user = await User.findById(userId);
    
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Found user:', user._id);
    console.log('User ID comparison:', req.user.id.toString(), '===', userId);
    
    // Check if user is updating their own profile or if admin is updating
    if (req.user.id.toString() !== userId && req.user.role !== 'Admin') {
      console.log('Not authorized');
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    // Get file info for MongoDB storage
    const imageInfo = getImageInfo(req.file);
    console.log('Image info created:', imageInfo);
    
    // Update user with new profile picture data
    user.profilePicture = imageInfo;
    await user.save();
    console.log('User saved successfully');

    res.status(200).json({
      message: 'Profile picture uploaded successfully',
      profilePicture: imageInfo,
      profilePictureUrl: `/api/files/profile-picture/${userId}`
    });
  } catch (err) {
    console.error('Error in uploadProfilePicture:', err);
    res.status(500).json({ message: 'Error uploading profile picture', error: err.message });
  }
};

// Delete profile picture
exports.deleteProfilePicture = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is updating their own profile or if admin is updating
    if (req.user.id.toString() !== userId && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    if (hasFile(user.profilePicture)) {
      // Remove profile picture data from user document
      user.profilePicture = undefined;
      await user.save();

      res.status(200).json({ message: 'Profile picture deleted successfully' });
    } else {
      res.status(404).json({ message: 'No profile picture found' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error deleting profile picture', error: err.message });
  }
};

