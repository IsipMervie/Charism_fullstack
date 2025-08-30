// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

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
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Get allowed origins from environment variable or use defaults
    const allowedOrigins = process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(',')
      : [
          'http://localhost:3000',
          'https://charism.vercel.app',
          'https://charism-backend.vercel.app'
        ];
    
    console.log('🔗 Allowed CORS origins:', allowedOrigins);
    console.log('🔍 Request origin:', origin);
    
    // Check if origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200
}));

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
const { mongoose, connection } = require('./config/db');

// Wait for database connection before starting server
const startServer = async () => {
  try {
    // Wait for database connection
    if (connection) {
      await connection;
      console.log('✅ Database connection established');
    } else {
      console.log('⚠️ No database connection available');
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
    process.exit(1);
  }
};

// Start the server
if (require.main === module) {
  startServer();
}

// For Vercel, export the app
module.exports = app;

// Health check (must come before other routes)
app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

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

// 404 handler
app.use((req, res) => {
  console.log('404 - Route not found:', req.method, req.url);
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  // Don't leak error details in production
  const errorMessage = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
    
  res.status(500).json({ 
    message: 'Server error', 
    error: errorMessage,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  if (mongoose.connection.readyState === 1) {
    mongoose.connection.close(() => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  if (mongoose.connection.readyState === 1) {
    mongoose.connection.close(() => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});