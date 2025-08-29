const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage for profile pictures
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/profile-pictures';
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const fileName = `profile-${uniqueSuffix}${fileExtension}`;
    cb(null, fileName);
  }
});

// File filter for allowed image types
const fileFilter = (req, file, cb) => {
  // Allow only image files
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
  }
};

// Configure multer for profile picture uploads
const uploadProfilePicture = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Maximum 1 file per upload
  }
});

// Helper function to get file info
const getFileInfo = (file) => {
  return {
    filename: file.filename,
    originalName: file.originalname,
    fileType: file.mimetype,
    fileSize: file.size,
    uploadDate: new Date()
  };
};

// Helper function to delete file
const deleteFile = (filename) => {
  const filePath = path.join('uploads/profile-pictures', filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
};

// Helper function to get file path
const getFilePath = (filename) => {
  return path.join('uploads/profile-pictures', filename);
};

// Helper function to get full URL for profile picture
const getProfilePictureUrl = (filename) => {
  if (!filename) return null;
  // Return full URL for production, relative path for development
  if (process.env.NODE_ENV === 'production') {
    return `${process.env.BACKEND_URL || 'https://charism-backend.vercel.app'}/uploads/profile-pictures/${filename}`;
  }
  return `/uploads/profile-pictures/${filename}`;
};

module.exports = {
  uploadProfilePicture,
  getFileInfo,
  deleteFile,
  getFilePath,
  getProfilePictureUrl
};
