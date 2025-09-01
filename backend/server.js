// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import utilities
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
          'http://localhost:3000',
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

// Wait for database connection before starting server
const startServer = async () => {
  try {
    // Get database connection lazily
    const connection = await getLazyConnection();
    
    if (connection) {
      try {
        console.log('✅ Database connection established');
      } catch (dbError) {
        console.error('❌ Database connection failed:', dbError.message);
        if (process.env.NODE_ENV === 'production') {
          console.log('🚨 Production mode - continuing without database');
        } else {
          console.error('❌ Development mode - database connection required');
          throw dbError;
        }
      }
    } else {
      console.log('⚠️ No database connection available');
      if (process.env.NODE_ENV === 'production') {
        console.log('🚨 Production mode - continuing without database');
      } else {
        console.error('❌ Development mode - database connection required');
        throw new Error('Database connection not available');
      }
    }
    
    // Start server
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 CORS Origins: ${process.env.CORS_ORIGINS || 'Not set'}`);
      console.log(`📧 Email User: ${process.env.EMAIL_USER || 'Not set'}`);
      console.log(`📊 MongoDB: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Not connected'}`);
      console.log('✅ All routes loaded successfully!');
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

      switch (error.code) {
        case 'EACCES':
          console.error(bind + ' requires elevated privileges');
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(bind + ' is already in use');
          process.exit(1);
          break;
        default:
          throw error;
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    if (process.env.NODE_ENV === 'production') {
      console.log('🚨 Production mode - exiting gracefully');
      process.exit(0);
    } else {
      process.exit(1);
    }
  }
};

// Start the server only if running directly (not on Vercel)
if (require.main === module) {
  startServer();
}

// Health check (must come before other routes)
app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

// Environment variables checker (for debugging)
app.get('/api/env-check', (req, res) => {
  const envVars = {
    NODE_ENV: process.env.NODE_ENV || 'Not set',
    MONGO_URI: process.env.MONGO_URI ? 'Set (' + process.env.MONGO_URI.substring(0, 30) + '...)' : 'Not set',
    JWT_SECRET: process.env.JWT_SECRET ? 'Set (' + process.env.JWT_SECRET.length + ' chars)' : 'Not set',
    EMAIL_USER: process.env.EMAIL_USER || 'Not set',
    EMAIL_PASS: process.env.EMAIL_PASS ? 'Set' : 'Not set',
    CORS_ORIGINS: process.env.CORS_ORIGINS || 'Not set',
    FRONTEND_URL: process.env.FRONTEND_URL || 'Not set',
    BACKEND_URL: process.env.BACKEND_URL || 'Not set'
  };
  
  res.json({
    status: 'Environment Check',
    environment: process.env.NODE_ENV || 'development',
    variables: envVars,
    timestamp: new Date().toISOString()
  });
});

// Test if models are working
app.get('/api/test-models', (req, res) => {
  try {
    const { mongoose } = require('./config/db');
    const models = {
      Section: !!mongoose.models.Section,
      YearLevel: !!mongoose.models.YearLevel,
      Department: !!mongoose.models.Department,
      AcademicYear: !!mongoose.models.AcademicYear
    };
    
    res.json({
      models,
      connectionState: mongoose.connection.readyState,
      connectionString: process.env.MONGO_URI ? 'Set' : 'Not set'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const { mongoose } = require('./config/db');
    
    // Test if we can query the database
    const userCount = await mongoose.models.User.countDocuments();
    const eventCount = await mongoose.models.Event.countDocuments();
    
    res.json({
      status: 'OK',
      connectionState: mongoose.connection.readyState,
      userCount,
      eventCount,
      message: 'Database connection working'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Use the comprehensive error handler
app.use(globalErrorHandler);

// Global database health check middleware - MUST come BEFORE routes
app.use(async (req, res, next) => {
  // Skip health check endpoints
  if (req.path === '/api/health' || req.path === '/api/env-check' || req.path === '/api/test-db') {
    return next();
  }
  
  // Check database connection for API routes
  if (req.path.startsWith('/api/')) {
    try {
      const { mongoose } = require('./config/db');
      if (mongoose.connection.readyState !== 1) {
        console.log(`Database not connected for ${req.method} ${req.path}`);
        return res.status(503).json({ 
          message: 'Service temporarily unavailable. Database connection not ready.',
          error: 'Database not connected',
          retryAfter: 5
        });
      }
    } catch (error) {
      console.log(`Database check failed for ${req.method} ${req.path}:`, error.message);
      // Continue anyway - let individual routes handle database errors
    }
  }
  
  next();
});

// Routes - Mount in specific order to avoid conflicts
console.log('Loading routes...');

app.use('/api/auth', require('./routes/authRoutes'));
console.log(' Auth routes loaded');
app.use('/api/analytics', require('./routes/analyticsRoutes'));
console.log(' Analytics routes loaded');
app.use('/api/admin', require('./routes/adminRoutes'));
console.log(' Admin routes loaded');
app.use('/api/academic-years', require('./routes/academicYearRoutes'));
console.log(' Academic years routes loaded');
app.use('/api/certificates', require('./routes/certificateRoutes'));
console.log(' Certificates routes loaded');
app.use('/api/reports', require('./routes/reportRoutes'));
console.log(' Reports routes loaded');
app.use('/api/settings', require('./routes/settingsRoutes'));
console.log(' Settings routes loaded');
app.use('/api/messages', require('./routes/messageRoutes'));
console.log(' Messages routes loaded');
app.use('/api/contact-us', require('./routes/contactUsRoutes'));
console.log(' Contact us routes loaded');
app.use('/api/events', require('./routes/eventRoutes'));
console.log(' Events routes loaded');
app.use('/api/users', require('./routes/userRoutes'));
console.log(' Users routes loaded');
app.use('/api/feedback', require('./routes/feedbackRoutes'));
console.log(' Feedback routes loaded');

// File serving routes for MongoDB-stored files
app.use('/api/files', require('./routes/fileRoutes'));
console.log(' File routes loaded');

// File serving fallback for Vercel
app.get('/api/files/*', (req, res) => {
  res.status(404).json({ 
    message: 'File not found',
    note: 'Files are stored in database, not in file system',
    path: req.path
  });
});

// File serving status and debugging
app.get('/api/file-status', (req, res) => {
  const fs = require('fs');
  const uploadsPath = path.join(__dirname, 'uploads');
  
  try {
    const uploadsExists = fs.existsSync(uploadsPath);
    const uploadsFiles = uploadsExists ? fs.readdirSync(uploadsPath) : [];
    
    res.json({
      status: 'File System Status',
      uploads: {
        exists: uploadsExists,
        path: uploadsPath,
        fileCount: uploadsFiles.length,
        files: uploadsFiles.slice(0, 10)
      },
      database: {
        connection: mongoose.connection.readyState === 1 ? 'Connected' : 'Not connected',
        models: {
          User: !!mongoose.models.User,
          Event: !!mongoose.models.Event,
          SchoolSettings: !!mongoose.models.SchoolSettings
        }
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'Not set',
        isProduction: process.env.NODE_ENV === 'production',
        hasMongoUri: !!process.env.MONGO_URI
      },
      note: 'Files are primarily stored in MongoDB, not in file system'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: error.message,
      note: 'Error checking file system status'
    });
  }
});

// 404 handler
app.use((req, res) => {
  console.log('404 - Route not found:', req.method, req.url);
  res.status(404).json({ message: 'Route not found' });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  if (mongoose.connection.readyState === 1) {
    mongoose.connection.close().then(() => {
      console.log('MongoDB connection closed');
      process.exit(0);
    }).catch((err) => {
      console.error('Error closing MongoDB connection:', err);
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  if (mongoose.connection.readyState === 1) {
    mongoose.connection.close().then(() => {
      console.log('MongoDB connection closed');
      process.exit(0);
    }).catch((err) => {
      console.error('Error closing MongoDB connection:', err);
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

// For Vercel, export the app
module.exports = app;