// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

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
  origin: [
    'http://localhost:3000',
    process.env.FRONTEND_URL || 'https://communitylink.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder for uploads (images, attachments, logos, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection is handled in config/db.js
require('./config/db');

// Health check (must come before other routes)
app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

// Test if models are working
app.get('/api/test-models', (req, res) => {
  try {
    const mongoose = require('mongoose');
    const models = {
      Section: !!mongoose.models.Section,
      YearLevel: !!mongoose.models.YearLevel,
      Department: !!mongoose.models.Department,
      AcademicYear: !!mongoose.models.AcademicYear
    };
    
    res.json({
      models,
      connectionState: mongoose.connection.readyState,
      connectionString: process.env.MONGO_URI || 'mongodb://localhost:27017/communitylink'
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
console.log(' User routes loaded');
app.use('/api/feedback', require('./routes/feedbackRoutes'));
console.log(' Feedback routes loaded');

// Reflection routes removed - no longer needed

// 404 handler
app.use((req, res) => {
  console.log('404 - Route not found:', req.method, req.url);
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Server error', error: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('All routes loaded successfully!');
});