// vercel-server.js - Production server for Vercel
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import utilities and models
const { globalErrorHandler } = require('./utils/errorHandler');

// Import models to ensure they are registered with Mongoose
require('./models/Section');
require('./models/YearLevel');
require('./models/Department');
require('./models/AcademicYear');
require('./models/User');
require('./models/SchoolSettings');
require('./models/Event');
require('./models/Message');
require('./models/Feedback');

const app = express();

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests, or Vercel internal requests)
    if (!origin) {
      console.log('✅ Allowing request with no origin');
      return callback(null, true);
    }
    
    // Get allowed origins from environment variable or use defaults
    const allowedOrigins = process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
      : [
          'https://charism.vercel.app',
          'https://charism-backend.vercel.app',
          'https://vercel.app',
          'https://*.vercel.app'
        ];
    
    console.log('🔗 Allowed CORS origins:', allowedOrigins);
    console.log('🔍 Request origin:', origin);
    
    // Check if origin is allowed (including wildcard matching)
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        // Handle wildcard domains like *.vercel.app
        const pattern = allowedOrigin.replace('*', '.*');
        return new RegExp(pattern).test(origin);
      }
      return allowedOrigin === origin;
    });
    
    if (isAllowed) {
      console.log('✅ CORS allowed for origin:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      // In production, be more permissive for debugging
      if (process.env.NODE_ENV === 'production') {
        console.log('🚨 Production mode - allowing blocked origin for debugging');
        callback(null, true);
      } else {
        // Additional fallback for Vercel domains
        if (origin.includes('vercel.app') || origin.includes('vercel.com')) {
          console.log('✅ Allowing Vercel domain:', origin);
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
}));

// Additional CORS headers for all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// Handle preflight requests
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static folder for uploads (images, attachments, logos, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add CORS headers to static files
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Health check for uploads folder
app.get('/api/uploads-health', (req, res) => {
  const fs = require('fs');
  const uploadsPath = path.join(__dirname, 'uploads');
  
  try {
    if (fs.existsSync(uploadsPath)) {
      const files = fs.readdirSync(uploadsPath);
      res.json({ 
        status: 'OK', 
        uploadsPath, 
        fileCount: files.length,
        files: files.slice(0, 10) // Show first 10 files
      });
    } else {
      res.json({ status: 'ERROR', message: 'Uploads folder not found' });
    }
  } catch (error) {
    res.json({ status: 'ERROR', message: error.message });
  }
});

// Database connection is handled in config/db.js
const { mongoose, getLazyConnection } = require('./config/db');

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Vercel backend is running' });
});

// Simple test for database
app.get('/api/test-db-simple', async (req, res) => {
  try {
    // Check if we can require mongoose
    const mongoose = require('mongoose');
    
    res.json({
      status: 'OK',
      mongooseAvailable: true,
      connectionState: mongoose.connection.readyState,
      message: 'Mongoose is available'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR',
      error: error.message,
      message: 'Mongoose not available'
    });
  }
});

// Import and use all routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const eventRoutes = require('./routes/eventRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const messageRoutes = require('./routes/messageRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const academicYearRoutes = require('./routes/academicYearRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const contactUsRoutes = require('./routes/contactUsRoutes');
const reportRoutes = require('./routes/reportRoutes');
const fileRoutes = require('./routes/fileRoutes');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/academic-years', academicYearRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/contact-us', contactUsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/files', fileRoutes);

// Global error handler
app.use(globalErrorHandler);

// For Vercel, export the app
module.exports = app;
