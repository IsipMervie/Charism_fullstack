// Simplified server for Render deployment
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import database configuration
const { initializeDatabase } = require('./config/db');

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

// Basic middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
      : ['http://localhost:3000', 'https://charism.onrender.com'];
    
    if (allowedOrigins.includes(origin) || origin.includes('onrender.com')) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for now
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Test endpoint working',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Charism Backend API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Load routes (with error handling)
try {
  console.log('Loading routes...');
  
  app.use('/api/auth', require('./routes/authRoutes'));
  console.log('✅ Auth routes loaded');
  
  app.use('/api/events', require('./routes/eventRoutes'));
  console.log('✅ Events routes loaded');
  
  app.use('/api/users', require('./routes/userRoutes'));
  console.log('✅ Users routes loaded');
  
  app.use('/api/settings', require('./routes/settingsRoutes'));
  console.log('✅ Settings routes loaded');
  
  app.use('/api/admin', require('./routes/adminRoutes'));
  console.log('✅ Admin routes loaded');
  
  app.use('/api/feedback', require('./routes/feedbackRoutes'));
  console.log('✅ Feedback routes loaded');
  
  console.log('✅ All routes loaded successfully!');
} catch (error) {
  console.error('❌ Error loading routes:', error);
}

// 404 handler
app.use((req, res) => {
  console.log('404 - Route not found:', req.method, req.url);
  res.status(404).json({ 
    message: 'Route not found',
    path: req.url,
    method: req.method
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Initialize database and start server
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Initialize database connection
    console.log('🔄 Initializing database connection...');
    await initializeDatabase();
    console.log('✅ Database connection established');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔗 Test endpoint: http://localhost:${PORT}/api/test`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
