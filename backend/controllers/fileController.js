// backend/controllers/fileController.js

const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');
const Event = require('../models/Event');
const User = require('../models/User');

// Setup GridFSBucket
let bucket;
mongoose.connection.on('connected', () => {
  bucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads'
  });
  console.log('✅ GridFS bucket initialized');
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit (optimized for Render free tier)
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp4|avi|mov/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, documents, and videos are allowed.'));
    }
  }
});

// Upload file
exports.uploadFile = async (req, res) => {
  try {
    upload.single('file')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      if (!bucket) {
        return res.status(500).json({ message: 'GridFS bucket not initialized' });
      }

      // Create readable stream from buffer
      const readableStream = new Readable();
      readableStream.push(req.file.buffer);
      readableStream.push(null);

      // Create upload stream
      const uploadStream = bucket.openUploadStream(req.file.originalname, {
        contentType: req.file.mimetype,
        metadata: {
          originalName: req.file.originalname,
          fileSize: req.file.size,
          uploadDate: new Date(),
          description: req.body.description || ''
        }
      });

      // Pipe the readable stream to the upload stream
      readableStream.pipe(uploadStream)
        .on('error', (error) => {
          console.error('Error uploading file:', error);
          res.status(500).json({ message: 'Error uploading file', error: error.message });
        })
        .on('finish', () => {
          res.json({
            message: 'File uploaded successfully',
            file: {
              fileId: uploadStream.id,
              filename: req.file.originalname,
              contentType: req.file.mimetype,
              fileSize: req.file.size,
              uploadDate: new Date()
            }
          });
        });
    });
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({ message: 'Error uploading file', error: error.message });
  }
};

// Download file
exports.downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    if (!bucket) {
      return res.status(500).json({ message: 'GridFS bucket not initialized' });
    }

    // Convert string ID to ObjectId
    const objectId = new mongoose.Types.ObjectId(fileId);
    
    // Find the file in GridFS
    const files = await bucket.find({ _id: objectId }).toArray();
    
    if (!files || files.length === 0) {
      return res.status(404).json({ message: 'File not found' });
    }

    const file = files[0];
    
    // Set response headers
    res.set('Content-Type', file.contentType);
    res.set('Content-Disposition', `attachment; filename="${file.filename}"`);
    
    // Create download stream and pipe to response
    const downloadStream = bucket.openDownloadStream(objectId);
    downloadStream.pipe(res);
    
    downloadStream.on('error', (error) => {
      console.error('Error downloading file:', error);
      res.status(500).json({ message: 'Error downloading file', error: error.message });
    });
    
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({ message: 'Error downloading file', error: error.message });
  }
};

// Delete file
exports.deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    if (!bucket) {
      return res.status(500).json({ message: 'GridFS bucket not initialized' });
    }

    // Convert string ID to ObjectId
    const objectId = new mongoose.Types.ObjectId(fileId);
    
    // Find the file in GridFS first
    const files = await bucket.find({ _id: objectId }).toArray();
    
    if (!files || files.length === 0) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Delete the file from GridFS
    await bucket.delete(objectId);
    
    res.json({
      message: 'File deleted successfully',
      fileId: fileId
    });
    
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ message: 'Error deleting file', error: error.message });
  }
};

// Upload event image
exports.uploadEventImage = async (req, res) => {
  try {
    upload.single('image')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No image uploaded' });
      }

      const { eventId } = req.params;
      
      const imageData = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
        filename: `${Date.now()}-${req.file.originalname}`,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        uploadDate: new Date()
      };

      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      event.image = imageData;
      await event.save();

      res.json({
        message: 'Event image uploaded successfully',
        imageUrl: `/api/files/event-image/${eventId}`
      });
    });
  } catch (error) {
    console.error('Upload event image error:', error);
    res.status(500).json({ message: 'Error uploading event image', error: error.message });
  }
};

// Get event image
exports.getEventImage = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const event = await Event.findById(eventId);
    if (!event || !event.image || !event.image.data) {
      return res.status(404).json({ message: 'Event image not found' });
    }

    res.set({
      'Content-Type': event.image.contentType,
      'Content-Length': event.image.data.length
    });

    res.send(event.image.data);
  } catch (error) {
    console.error('Get event image error:', error);
    res.status(500).json({ message: 'Error retrieving event image', error: error.message });
  }
};

// Upload profile picture
exports.uploadProfilePicture = async (req, res) => {
  try {
    upload.single('profilePicture')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No profile picture uploaded' });
      }

      const { userId } = req.params;
      
      const imageData = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
        filename: `${Date.now()}-${req.file.originalname}`,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        uploadDate: new Date()
      };

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.profilePicture = imageData;
      await user.save();

      res.json({
        message: 'Profile picture uploaded successfully',
        imageUrl: `/api/files/profile-picture/${userId}`
      });
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({ message: 'Error uploading profile picture', error: error.message });
  }
};

// Get profile picture
exports.getProfilePicture = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user || !user.profilePicture || !user.profilePicture.data) {
      return res.status(404).json({ message: 'Profile picture not found' });
    }

    res.set({
      'Content-Type': user.profilePicture.contentType,
      'Content-Length': user.profilePicture.data.length
    });

    res.send(user.profilePicture.data);
  } catch (error) {
    console.error('Get profile picture error:', error);
    res.status(500).json({ message: 'Error retrieving profile picture', error: error.message });
  }
};
