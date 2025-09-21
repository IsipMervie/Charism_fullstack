const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage for local file uploads
const createStorage = (destination, filenamePrefix) => {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = `uploads/${destination}`;
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      // Generate unique filename with timestamp and original extension
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileExtension = path.extname(file.originalname).toLowerCase(); // Ensure lowercase extension
      const fileName = `${filenamePrefix}-${uniqueSuffix}${fileExtension}`;
      cb(null, fileName);
    }
  });
};

// File filter for allowed image types
const imageFilter = (req, file, cb) => {
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

// File filter for allowed document types
const documentFilter = (req, file, cb) => {
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

// Configure multer for profile picture uploads
const uploadProfilePicture = multer({
  storage: createStorage('profile-pictures', 'profile'),
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Maximum 1 file per upload
  }
});

// Configure multer for event image uploads
const uploadEventImage = multer({
  storage: createStorage('event-images', 'event'),
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Maximum 1 file per upload
  }
});

// Configure multer for logo uploads
const uploadLogo = multer({
  storage: createStorage('logos', 'logo'),
  fileFilter: imageFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
    files: 1 // Maximum 1 file per upload
  }
});

// Configure multer for event documentation uploads
const uploadEventDocs = multer({
  storage: createStorage('event-docs', 'event-doc'),
  fileFilter: documentFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per upload
  }
});

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

// Helper function to get file URL (for local storage)
const getFileUrl = (filename, folder) => {
  if (!filename) return null;
  // Return relative path that will be served by the static middleware
  return `/uploads/${folder}/${filename}`;
};

// Helper function to delete file from local storage
const deleteLocalFile = async (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Local file delete error:', error);
    return false;
  }
};

// Helper function to get profile picture URL
const getProfilePictureUrl = (filename) => {
  return getFileUrl(filename, 'profile-pictures');
};

// Helper function to get event image URL
const getEventImageUrl = (filename) => {
  return getFileUrl(filename, 'event-images');
};

// Helper function to get logo URL
const getLogoUrl = (filename) => {
  return getFileUrl(filename, 'logos');
};

module.exports = {
  uploadProfilePicture,
  uploadEventImage,
  uploadLogo,
  uploadEventDocs,
  getFileInfo,
  getFileUrl,
  deleteLocalFile,
  getProfilePictureUrl,
  getEventImageUrl,
  getLogoUrl
};
