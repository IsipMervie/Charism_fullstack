// server.js
require('dotenv').config();

// Set basic environment variables if not set (no sensitive data)
if (!process.env.NODE_ENV) process.env.NODE_ENV = 'production';
if (!process.env.PORT) process.env.PORT = '10000';
if (!process.env.FRONTEND_URL) process.env.FRONTEND_URL = 'https://charism-ucb4.onrender.com';
if (!process.env.BACKEND_URL) process.env.BACKEND_URL = 'https://charism-api-xtw9.onrender.com';

// EMERGENCY: Set critical variables if missing (server needs to work)
if (!process.env.MONGO_URI) {
  console.log('⚠️ MONGO_URI not set - using emergency fallback');
  process.env.MONGO_URI = 'mongodb+srv://admin:admin123@ua-database.wzgg1.mongodb.net/charism?retryWrites=true&w=majority&appName=UA-DATABASE';
}
if (!process.env.JWT_SECRET) {
  console.log('⚠️ JWT_SECRET not set - using emergency fallback');
  process.env.JWT_SECRET = 'mysecretkey123456789';
}
if (!process.env.CORS_ORIGINS) {
  console.log('⚠️ CORS_ORIGINS not set - using default');
  process.env.CORS_ORIGINS = 'https://charism-ucb4.onrender.com,https://charism.onrender.com,http://localhost:3000';
}

// Email configuration fallbacks (non-blocking)
if (!process.env.EMAIL_USER) {
  console.log('⚠️ EMAIL_USER not set - email notifications will be disabled');
  process.env.EMAIL_USER = 'noreply@charism.edu.ph';
}
if (!process.env.EMAIL_PASS) {
  console.log('⚠️ EMAIL_PASS not set - email notifications will be disabled');
  process.env.EMAIL_PASS = 'your_email_password';
}
if (!process.env.EMAIL_SERVICE) {
  process.env.EMAIL_SERVICE = 'gmail';
}

console.log('🔧 Environment variables set:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);

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

// Performance monitoring middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  // Log slow requests
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 5000) { // Log requests taking more than 5 seconds
      console.log(`🐌 SLOW REQUEST: ${req.method} ${req.path} took ${duration}ms`);
    }
  });
  
  next();
});

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



// EMERGENCY CORS FIX - Force headers on every request
app.use((req, res, next) => {
  // Force CORS headers on EVERY response
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'false');
  
  // Handle preflight requests immediately
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// CORS configuration - SIMPLIFIED to avoid credentials issues
app.use(cors({
  origin: '*', // Allow all origins since we disabled credentials
  credentials: false, // DISABLE credentials to avoid CORS issues
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
}));

// Handle preflight requests - EMERGENCY FIX
app.options('*', (req, res) => {
  console.log('🚨 OPTIONS request received:', req.url);
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'false');
  res.status(200).end();
});

// Additional CORS headers for all responses - EMERGENCY FIX
app.use((req, res, next) => {
  console.log('🚨 Request received:', req.method, req.url);
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'false');
  
  if (req.method === 'OPTIONS') {
    console.log('🚨 OPTIONS handled in middleware');
    res.status(200).end();
    return;
  }
  
  next();
});

// Handle preflight requests - SIMPLIFIED
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'false');
  res.status(200).end();
});

// SIMPLE CORS HEADERS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

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

// Quick ping endpoint for server responsiveness check
app.get('/ping', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: Date.now(),
    message: 'Server is responsive'
  });
});

// API ping endpoint for frontend health checks
app.get('/api/ping', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: Date.now(),
    message: 'API server is responsive'
  });
});

// EMERGENCY TEST ENDPOINT - Simple CORS test
app.get('/api/test', (req, res) => {
  console.log('🚨 TEST endpoint called');
  // Force CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  res.json({
    status: 'SUCCESS',
    message: 'Emergency test endpoint working!',
    timestamp: new Date().toISOString(),
    cors: 'FIXED',
    server: 'RUNNING',
    version: '3.0.0 - EMERGENCY CORS FIX DEPLOYED'
  });
});

// EMERGENCY CORS TEST ENDPOINT
app.post('/api/cors-test', (req, res) => {
  console.log('🚨 CORS TEST POST endpoint called');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  res.json({
    status: 'SUCCESS',
    message: 'CORS POST test working!',
    timestamp: new Date().toISOString(),
    cors: 'FIXED',
    method: 'POST'
  });
});

// TEST APPROVAL ENDPOINT - Direct test
app.put('/api/test-approval/:eventId/registrations/:userId/approve', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  res.json({
    status: 'SUCCESS',
    message: 'Approval endpoint test working!',
    eventId: req.params.eventId,
    userId: req.params.userId,
    timestamp: new Date().toISOString(),
    test: 'APPROVAL_ENDPOINT_EXISTS'
  });
});

// Email test endpoint
app.get('/api/test-email', async (req, res) => {
  try {
    const sendEmail = require('./utils/sendEmail');
    const { getEventRegistrationApprovalTemplate } = require('./utils/emailTemplates');
    
    // Test email configuration
    const emailConfig = {
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_PASS: process.env.EMAIL_PASS ? '***configured***' : 'NOT_SET',
      EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'gmail',
      NO_REPLY_EMAIL: process.env.NO_REPLY_EMAIL || 'noreply@charism.edu.ph'
    };
    
    res.json({
      status: 'SUCCESS',
      message: 'Email configuration check',
      emailConfig,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Email test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static folder for uploads (images, attachments, logos, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// Static folder for images
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/api/images', express.static(path.join(__dirname, 'images')));

// Specific route for chat files
app.use('/api/uploads/chat-files', express.static(path.join(__dirname, 'uploads/chat-files')));

// Add CORS headers to static files
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.use('/api/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.use('/images', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.use('/api/images', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.use('/api/uploads/chat-files', (req, res, next) => {
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
    
    // Create database indexes for performance
    const { createIndexes } = require('./utils/databaseIndexes');
    await createIndexes();
    
// Start server with error handling
const PORT = process.env.PORT || 5000;

// Check for email configuration
if (!process.env.EMAIL_USER) {
  console.log('⚠️ EMAIL_USER not set - email features may not work');
}
if (!process.env.EMAIL_PASS) {
  console.log('⚠️ EMAIL_PASS not set - email features may not work');
}

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CORS Origins: ${process.env.CORS_ORIGINS || 'Not set'}`);
  console.log(`📧 Email User: ${process.env.EMAIL_USER || 'Not set'}`);
  console.log(`📊 MongoDB: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Not connected'}`);
  console.log('✅ All routes loaded successfully!');
  console.log('🎯 Server is ready to handle requests!');
});

    // Handle server errors
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.log('Port is already in use, trying next port...');
        server.listen(PORT + 1);
      }
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

// Start the server
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

// Database health endpoint
app.get('/api/health/db', async (req, res) => {
  try {
    console.log('🔍 Database health check requested from:', req.ip || req.connection.remoteAddress);
    
    // Set proper headers
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    
    const dbStatus = mongoose.connection.readyState;
    let message = '';
    
    switch (dbStatus) {
      case 0:
        message = 'disconnected';
        break;
      case 1:
        message = 'connected';
        break;
      case 2:
        message = 'connecting';
        break;
      case 3:
        message = 'disconnecting';
        break;
      default:
        message = 'unknown';
    }

    // Try to ping the database
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

    const healthData = {
      status: dbStatus === 1 ? 'OK' : 'ERROR',
      timestamp: new Date().toISOString(),
      database: {
        readyState: dbStatus,
        status: message,
        ping: pingResult,
        host: mongoose.connection.host || 'unknown',
        name: mongoose.connection.name || 'unknown'
      }
    };
    
    console.log('✅ Database health check response:', healthData);
    res.json(healthData);
  } catch (error) {
    console.error('❌ Database health check error:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Database health check failed',
      error: error.message 
    });
  }
});

// Email health endpoint
app.get('/api/health/email', (req, res) => {
  try {
    console.log('🔍 Email health check requested from:', req.ip || req.connection.remoteAddress);
    
    // Set proper headers
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    
    const emailConfig = {
      EMAIL_USER: process.env.EMAIL_USER ? 'configured' : 'not configured',
      EMAIL_PASS: process.env.EMAIL_PASS ? 'configured' : 'not configured',
      EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'not configured'
    };
    
    const healthData = {
      status: emailConfig.EMAIL_USER === 'configured' && emailConfig.EMAIL_PASS === 'configured' ? 'OK' : 'WARNING',
      timestamp: new Date().toISOString(),
      email: emailConfig,
      message: emailConfig.EMAIL_USER === 'configured' && emailConfig.EMAIL_PASS === 'configured' ? 'Email service configured' : 'Email service not fully configured'
    };
    
    console.log('✅ Email health check response:', healthData);
    res.json(healthData);
  } catch (error) {
    console.error('❌ Email health check error:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Email health check failed',
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

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  try {
    const origin = req.headers.origin;
    const allowedOrigins = [
      'http://localhost:3000',
      'https://charism-ucb4.onrender.com',
      'https://charism-api-xtw9.onrender.com',
    ];
    
    const isAllowed = allowedOrigins.includes(origin) || 
                     (origin && origin.includes('onrender.com')) ||
                     (origin && origin.includes('localhost'));
    
    res.json({
      status: 'OK',
      message: 'CORS test endpoint',
      corsStatus: isAllowed ? 'ALLOWED' : 'BLOCKED',
      origin: origin || 'No origin header',
      allowedOrigins: allowedOrigins,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'CORS test error',
      error: error.message 
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



// Debug all API calls
app.all('/api/*', (req, res, next) => {
  if (req.path.includes('approve') || req.path.includes('disapprove')) {
    console.log('🔍 API APPROVAL/DISAPPROVAL CALL:', {
      method: req.method,
      url: req.url,
      path: req.path,
      params: req.params,
      body: req.body,
      headers: {
        'authorization': req.headers['authorization'] ? 'Present' : 'Missing',
        'content-type': req.headers['content-type']
      }
    });
  }
  next();
});
app.use('/api/event-chat', require('./routes/eventChatRoutes'));
console.log(' Event chat routes loaded');
app.use('/api/users', require('./routes/userRoutes'));
console.log(' Users routes loaded');
app.use('/api/feedback', require('./routes/feedbackRoutes'));
console.log(' Feedback routes loaded');

// File serving routes for MongoDB-stored files
app.use('/api/files', require('./routes/fileRoutes'));
console.log(' File routes loaded');

// File serving fallback
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

// Export the app
module.exports = app;