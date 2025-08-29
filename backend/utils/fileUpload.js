const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('../config/cloudinary');

// Configure storage for temporary file uploads (will be deleted after Cloudinary upload)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/temp';
    
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
    const fileName = `event-doc-${uniqueSuffix}${fileExtension}`;
    cb(null, fileName);
  }
});

// File filter for allowed document types
const fileFilter = (req, file, cb) => {
  // Allow only PDF, DOC, DOCX, and image files
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and image files are allowed.'), false);
  }
};

// Configure multer for event documentation uploads
const uploadEventDocs = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per upload
  }
});

// Helper function to upload to Cloudinary
const uploadToCloudinary = async (filePath, folder = 'event-docs') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto'
    });
    
    // Delete temporary file after upload
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      filename: result.original_filename
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file to Cloudinary');
  }
};

// Helper function to delete file from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
};

// Helper function to get file info
const getFileInfo = (file) => {
  return {
    filename: file.filename,
    originalName: file.originalname,
    fileType: file.mimetype,
    fileSize: file.size,
    uploadDate: new Date(),
    description: ''
  };
};

module.exports = {
  uploadEventDocs,
  uploadToCloudinary,
  deleteFromCloudinary,
  getFileInfo
};
