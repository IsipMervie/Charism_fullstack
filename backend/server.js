// server.js
require('dotenv').config();

// Set basic environment variables if not set (no sensitive data)
if (!process.env.NODE_ENV) process.env.NODE_ENV = 'production';
if (!process.env.PORT) process.env.PORT = '10000';
if (!process.env.FRONTEND_URL) process.env.FRONTEND_URL = 'https://charism-ucb4.onrender.com';
if (!process.env.BACKEND_URL) process.env.BACKEND_URL = 'https://charism-api-xtw9.onrender.com';

// SECURITY: Never hardcode database credentials in code!
if (!process.env.MONGO_URI) {
  console.log('🚨 CRITICAL ERROR: MONGO_URI environment variable not set!');
  console.log('🚨 Please set MONGO_URI in your environment variables');
  console.log('🚨 Server cannot start without database connection');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.log('⚠️ JWT_SECRET not set - generating secure fallback');
  // Generate a secure random secret for development
  const crypto = require('crypto');
  process.env.JWT_SECRET = crypto.randomBytes(64).toString('hex');
}
if (!process.env.CORS_ORIGINS) {
  console.log('⚠️ CORS_ORIGINS not set - using default');
  process.env.CORS_ORIGINS = 'https://charism-ucb4.onrender.com,http://localhost:3000';
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

// Import security middleware
const { 
  generalLimiter, 
  authLimiter, 
  contactLimiter, 
  registerLimiter,
  securityHeaders,
  corsOptions,
  sanitizeInput,
  securityLogger 
} = require('./middleware/security');

// Import performance middleware
const {
  cacheMiddleware,
  clearCache,
  clearAllCache,
  compressionMiddleware,
  responseTimeMiddleware,
  optimizeMongoose
} = require('./middleware/performanceMiddleware');

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

// Performance optimizations (MUST be first)
app.use(compressionMiddleware);
app.use(responseTimeMiddleware);

// Security middleware
app.use(securityHeaders);
app.use(securityLogger);
app.use(sanitizeInput);

// Set server timeout for Render optimization
app.use((req, res, next) => {
  // Set timeout to 60 seconds for all endpoints
  req.setTimeout(60000);
  res.setTimeout(60000);
  next();
});

// Render deployment fix - ensure PORT is set correctly
const PORT = process.env.PORT || 10000;



// CORS Configuration - Secure
app.use(cors(corsOptions));

// Rate limiting
app.use('/api', generalLimiter);

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

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    status: 'SUCCESS',
    message: 'Test endpoint working!',
    timestamp: new Date().toISOString(),
    server: 'RUNNING'
  });
});

// TEST APPROVAL ENDPOINT - Direct test
app.put('/api/test-approval/:eventId/registrations/:userId/approve', (req, res) => {
  // CORS handled by main middleware
  
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

// Static files - CORS handled by main middleware

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
    try {
      const { createIndexes } = require('./utils/databaseIndexes');
      await createIndexes();
    } catch (indexError) {
      console.log('⚠️ Database indexes creation failed:', indexError.message);
    }
    
    // Check for email configuration
    if (!process.env.EMAIL_USER) {
      console.log('⚠️ EMAIL_USER not set - email features may not work');
    }
    if (!process.env.EMAIL_PASS) {
      console.log('⚠️ EMAIL_PASS not set - email features may not work');
    }

    const server = app.listen(PORT, '0.0.0.0', () => {
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
        const nextPort = parseInt(PORT) + 1;
        server.listen(nextPort);
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
    // CORS handled by main middleware
    
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
    // CORS handled by main middleware
    // CORS handled by main middleware
    // CORS handled by main middleware
    
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
    // CORS handled by main middleware
    // CORS handled by main middleware
    
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
    // CORS handled by main middleware
    // CORS handled by main middleware
    
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
    // CORS handled by main middleware
    // CORS handled by main middleware
    // CORS handled by main middleware
    
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
    // CORS handled by main middleware
    
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
    // CORS handled by main middleware
    
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
    // CORS handled by main middleware
    
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

app.use('/api/auth', authLimiter);
app.use('/api/auth/register', registerLimiter);
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
app.use('/api/contact-us', contactLimiter);
app.use('/api/contact-us', require('./routes/contactUsRoutes'));
console.log(' Contact us routes loaded');
app.use('/api/events', require('./routes/eventRoutes'));
console.log(' Events routes loaded');



// Debug all API calls
app.all('/api/*', (req, res, next) => {
  console.log('🔍 API CALL:', {
    method: req.method,
    url: req.url,
    path: req.path
  });
  next();
});
app.use('/api/event-chat', require('./routes/eventChatRoutes'));
console.log(' Event chat routes loaded');
app.use('/api/users', require('./routes/userRoutes'));
console.log(' Users routes loaded');

// Additional user routes (singular)
app.get('/api/user/participation', require('./middleware/authMiddleware').authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    const Event = require('./models/Event');
    
    const events = await Event.find({ 'attendance.userId': userId }).populate('createdBy', 'name');
    const participation = events.map(event => ({
      eventId: event._id,
      title: event.title,
      date: event.date,
      status: event.attendance.find(a => a.userId.toString() === userId.toString())?.status || 'Unknown',
      hours: event.hours
    }));
    
    res.json({ participation });
  } catch (error) {
    console.error('Error getting user participation:', error);
    res.status(500).json({ message: 'Error getting user participation', error: error.message });
  }
});

app.get('/api/user/my-events', require('./middleware/authMiddleware').authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    const Event = require('./models/Event');
    
    const events = await Event.find({ 'attendance.userId': userId }).populate('createdBy', 'name');
    res.json({ events });
  } catch (error) {
    console.error('Error getting user events:', error);
    res.status(500).json({ message: 'Error getting user events', error: error.message });
  }
});

app.get('/api/user/participation-history', require('./middleware/authMiddleware').authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    const Event = require('./models/Event');
    
    const events = await Event.find({ 'attendance.userId': userId }).populate('createdBy', 'name');
    const history = events.map(event => ({
      eventId: event._id,
      title: event.title,
      date: event.date,
      location: event.location,
      hours: event.hours,
      attended: event.attendance.find(a => a.userId.toString() === userId.toString())?.attended || false,
      status: event.attendance.find(a => a.userId.toString() === userId.toString())?.status || 'Unknown'
    }));
    
    res.json({ history });
  } catch (error) {
    console.error('Error getting participation history:', error);
    res.status(500).json({ message: 'Error getting participation history', error: error.message });
  }
});
app.use('/api/feedback', require('./routes/feedbackRoutes'));
console.log(' Feedback routes loaded');
app.use('/api/notifications', require('./routes/notificationRoutes'));
console.log(' Notifications routes loaded');

// File serving routes for MongoDB-stored files
app.use('/api/files', require('./routes/fileRoutes'));
console.log(' File routes loaded');

// Simple working routes
app.use('/api', require('./routes/simpleRoutes'));
console.log(' Simple routes loaded');

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