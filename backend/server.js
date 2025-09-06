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
require('./models/Event');
require('./models/Message');
require('./models/Feedback');

const app = express();

// Set server timeout for long-running requests (like analytics)
app.use((req, res, next) => {
  // Set timeout to 90 seconds for analytics endpoints
  if (req.path === '/analytics' || req.path.startsWith('/analytics/')) {
    req.setTimeout(90000); // 90 seconds
    res.setTimeout(90000);
  } else {
    req.setTimeout(30000); // 30 seconds for other endpoints
    res.setTimeout(30000);
  }
  next();
});

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
          'https://charism.onrender.com',
          'https://charism-api.onrender.com',
          'https://charism.vercel.app',
          'https://charism-server-ua-backend.vercel.app'
        ];
    
    console.log('🔗 Allowed CORS origins:', allowedOrigins);
    console.log('🔍 Request origin:', origin);
    
    // Check if origin is allowed
    const isAllowed = allowedOrigins.includes(origin);
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
        // Additional fallback for Render domains
        if (origin.includes('onrender.com')) {
          console.log('✅ Allowing Render domain:', origin);
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

// Handle preflight requests
app.options('*', cors());

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Charism Backend API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      test: '/api/test',
      frontendTest: '/api/frontend-test',
      auth: '/api/auth',
      events: '/api/events',
      users: '/api/users',
      admin: '/api/admin'
    },
    note: 'This is the backend API server. Use specific endpoints for functionality.'
  });
});

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

// Root route for base URL
app.get('/', (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    res.json({
      status: 'OK',
      message: 'Charism Backend API Server',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/api/health',
        test: '/api/test',
        frontendTest: '/api/frontend-test',
        auth: '/api/auth',
        events: '/api/events',
        users: '/api/users',
        admin: '/api/admin'
      },
      note: 'This is the backend API server. Use specific endpoints for functionality.'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Root endpoint failed' 
    });
  }
});

// Test database connection endpoint
app.get('/api/test-db-connection', async (req, res) => {
  try {
    console.log('🔍 Testing database connection...');
    
    const { getLazyConnection } = require('./config/db');
    const isConnected = await getLazyConnection();
    
    console.log('📊 Database connection result:', isConnected);
    
    if (isConnected) {
      // Try to query the database
      const User = require('./models/User');
      const userCount = await User.countDocuments();
      
      res.json({
        status: 'OK',
        message: 'Database connection successful',
        userCount,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        status: 'ERROR',
        message: 'Database connection failed',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ Database test error:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Database test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check (must come before other routes)
app.get('/api/health', (req, res) => {
  try {
    console.log('🔍 Health check requested from:', req.ip || req.connection.remoteAddress);
    
    // Set proper headers
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    const healthData = { 
      status: 'OK',
      timestamp: new Date().toISOString(),
      message: 'Server is running',
      version: '1.0.0'
    };
    
    console.log('✅ Health check response:', healthData);
    res.json(healthData);
  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Health check failed',
      error: error.message 
    });
  }
});

// Database status endpoint
app.get('/api/db-status', async (req, res) => {
  try {
    console.log('🔍 Database status check requested from:', req.ip || req.connection.remoteAddress);
    
    // Set proper headers
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    const { mongoose } = require('./config/db');
    
    // Check database connection status
    const dbStatus = mongoose.connection.readyState;
    let status = 'unknown';
    let message = '';
    
    switch (dbStatus) {
      case 0:
        status = 'disconnected';
        message = 'Database is disconnected';
        break;
      case 1:
        status = 'connected';
        message = 'Database is connected';
        break;
      case 2:
        status = 'connecting';
        message = 'Database is connecting';
        break;
      case 3:
        status = 'disconnecting';
        message = 'Database is disconnecting';
        break;
      default:
        status = 'unknown';
        message = 'Database status is unknown';
    }
    
    // Try to ping the database if connected
    let pingResult = 'unknown';
    if (dbStatus === 1) {
      try {
        await mongoose.connection.db.admin().ping();
        pingResult = 'success';
      } catch (pingError) {
        pingResult = 'failed';
        console.error('Database ping failed:', pingError);
      }
    }
    
    const dbData = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: {
        status: status,
        readyState: dbStatus,
        ping: pingResult,
        host: mongoose.connection.host || 'unknown',
        name: mongoose.connection.name || 'unknown',
        message: message
      }
    };
    
    console.log('✅ Database status response:', dbData);
    res.json(dbData);
  } catch (error) {
    console.error('❌ Database status check error:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Database status check failed',
      error: error.message,
      database: {
        status: 'error',
        readyState: -1,
        ping: 'failed',
        host: 'unknown',
        name: 'unknown',
        message: 'Database status check failed'
      }
    });
  }
});

// Simple test endpoint for frontend connectivity testing
app.get('/api/test', (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    res.json({
      status: 'OK',
      message: 'Test endpoint working',
      timestamp: new Date().toISOString(),
      frontend: 'Connection successful'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Test endpoint failed' 
    });
  }
});

// Frontend test endpoint
app.get('/api/frontend-test', (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    res.json({
      status: 'OK',
      message: 'Frontend test successful',
      timestamp: new Date().toISOString(),
      backend: 'Running and accessible'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Frontend test failed' 
    });
  }
});

// Server status endpoint
app.get('/api/status', (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const { mongoose } = require('./config/db');
    
    res.json({
      status: 'OK',
      message: 'Server Status',
      timestamp: new Date().toISOString(),
      server: {
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
      },
      database: {
        connected: mongoose.connection.readyState === 1,
        state: mongoose.connection.readyState
      },
      endpoints: {
        root: '/',
        health: '/api/health',
        status: '/api/status',
        test: '/api/test',
        frontendTest: '/api/frontend-test'
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Status endpoint failed',
      error: error.message
    });
  }
});

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
  // Skip health check endpoints and basic endpoints
  if (req.path === '/api/health' || 
      req.path === '/api/env-check' || 
      req.path === '/api/test-db' ||
      req.path === '/api/test' ||
      req.path === '/api/frontend-test' ||
      req.path === '/api/status' ||
      req.path === '/api/db-status' ||
      req.path === '/api/test-db-connection' ||
      req.path === '/api/test-models' ||
      req.path === '/api/uploads-health' ||
      req.path === '/api/file-status') {
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
app.use('/api/staff', require('./routes/staffRoutes'));
console.log(' Staff routes loaded');
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
          Event: !!mongoose.models.Event
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