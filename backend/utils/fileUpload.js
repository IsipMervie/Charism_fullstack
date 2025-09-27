const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage for temporary file uploads (will be deleted after local storage upload)
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
    const fileExtension = path.extname(file.originalname).toLowerCase(); // Ensure lowercase extension
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
    fileSize: 5 * 1024 * 1024, // 5MB limit (reduced for Render free tier)
    files: 3 // Maximum 3 files per upload (reduced for performance)
  }
});

// Helper function to move file to permanent location
const moveToPermanentLocation = async (filePath, destination, filename) => {
  try {
    const finalDir = `uploads/${destination}`;
    const finalPath = path.join(finalDir, filename);
    
    // Create destination directory if it doesn't exist
    if (!fs.existsSync(finalDir)) {
      fs.mkdirSync(finalDir, { recursive: true });
    }
    
    // Move file to permanent location
    fs.renameSync(filePath, finalPath);
    
    return {
      url: `/uploads/${destination}/${filename}`,
      filename: filename,
      path: finalPath
    };
  } catch (error) {
    console.error('File move error:', error);
    throw new Error('Failed to move file to permanent location');
  }
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

// Helper function to get file info for MongoDB storage
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

// Helper function to get file info for MongoDB storage (with data)
const getFileInfoWithData = (file) => {
  return {
    data: file.buffer || fs.readFileSync(file.path), // Handle both memory and disk storage
    contentType: file.mimetype,
    filename: file.filename,
    originalName: file.originalname,
    fileSize: file.size,
    uploadDate: new Date(),
    description: ''
  };
};

// Helper function to check if file exists (works with both local and MongoDB storage)
const hasFile = (fileData) => {
  if (!fileData) return false;
  
  // Check if it's MongoDB storage (has data buffer)
  if (fileData.data && fileData.data.length > 0) return true;
  
  // Check if it's local storage (has filename and path)
  if (fileData.filename && fileData.path && fs.existsSync(fileData.path)) return true;
  
  // Check if it's just filename reference
  if (fileData.filename && fileData.fileSize > 0) return true;
  
  return false;
};

// Helper function to get file size in human readable format
const getFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to get file URL (for local storage)
const getFileUrl = (filename, folder) => {
  if (!filename) return null;
  // Return relative path that will be served by the static middleware
  return `/uploads/${folder}/${filename}`;
};

module.exports = {
  uploadEventDocs,
  moveToPermanentLocation,
  deleteLocalFile,
  getFileInfo,
  getFileInfoWithData,
  hasFile,
  getFileSize,
  getFileUrl
};
