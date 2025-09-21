const multer = require('multer');

// Configure multer for memory storage (stores file in memory as Buffer)
const storage = multer.memoryStorage();

// File filter for images
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// File filter for documents
const documentFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, Word, Excel, and text files are allowed!'), false);
  }
};

// Create multer instances
const uploadProfilePicture = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
}).single('profilePicture');

// Add error handling wrapper for profile picture upload
const uploadProfilePictureWithErrorHandling = (req, res, next) => {
  uploadProfilePicture(req, res, (err) => {
    if (err) {
      console.error('Multer error in profile picture upload:', err);
      
      if (err instanceof multer.MulterError) {
        // Multer-specific errors
        switch (err.code) {
          case 'LIMIT_FILE_SIZE':
            return res.status(400).json({ 
              message: 'File too large. Maximum size is 5MB.' 
            });
          case 'LIMIT_FILE_COUNT':
            return res.status(400).json({ 
              message: 'Too many files. Only one file allowed.' 
            });
          case 'LIMIT_UNEXPECTED_FILE':
            return res.status(400).json({ 
              message: 'Unexpected file field name. Use "profilePicture".' 
            });
          default:
            return res.status(400).json({ 
              message: 'File upload error: ' + err.message 
            });
        }
      } else {
        // Custom errors (like file type validation)
        return res.status(400).json({ 
          message: err.message || 'File upload failed' 
        });
      }
    }
    
    // No error, continue to next middleware
    next();
  });
};

const uploadEventImage = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
}).single('image');

const uploadLogo = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  }
}).single('logo');

const uploadEventDocs = multer({
  storage: storage,
  fileFilter: documentFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit
  }
}).array('documents', 10); // Allow up to 10 documents

// Helper function to get file info for MongoDB storage
const getFileInfo = (file) => {
  return {
    data: file.buffer,
    contentType: file.mimetype,
    filename: `${Date.now()}_${file.originalname}`,
    originalName: file.originalname,
    fileSize: file.size,
    uploadDate: new Date()
  };
};

// Helper function to get image info for MongoDB storage
const getImageInfo = (file) => {
  return {
    data: file.buffer,
    contentType: file.mimetype,
    filename: `${Date.now()}_${file.originalname}`,
    uploadedAt: new Date()
  };
};

// Helper function to check if file exists
const hasFile = (fileData) => {
  // Defensive check for malformed data
  if (!fileData) return false;
  if (typeof fileData === 'string') return false;
  if (typeof fileData !== 'object') return false;
  
  return fileData.data && fileData.data.length > 0;
};

// Helper function to get file size in human readable format
const getFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

module.exports = {
  uploadProfilePicture,
  uploadProfilePictureWithErrorHandling,
  uploadEventImage,
  uploadLogo,
  uploadEventDocs,
  getFileInfo,
  getImageInfo,
  hasFile,
  getFileSize
};
