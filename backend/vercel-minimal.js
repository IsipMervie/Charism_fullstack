// vercel-minimal.js - Minimal test server for Vercel with essential endpoints
const express = require('express');
const cors = require('cors');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Minimal backend is working!',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Minimal Vercel backend is running' });
});

// Essential endpoints for frontend to work
app.get('/api/settings/public/school', (req, res) => {
  res.json({
    brandName: 'CHARISM',
    logo: null,
    description: 'Center for the Holistic Advancement of Religious Instruction, Spirituality, and Mission',
    contactEmail: 'info@charism.edu',
    contactPhone: '+1-234-567-8900',
    address: '123 Education Street, Learning City, LC 12345'
  });
});

// Mock login endpoint (temporary for testing)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // For testing purposes, accept any login
  if (email && password) {
    res.json({
      message: 'Login successful (test mode)',
      token: 'test_token_' + Date.now(),
      user: {
        _id: 'test_user_id',
        name: 'Test User',
        email: email,
        role: 'Admin',
        isApproved: true,
        approvalStatus: 'approved'
      }
    });
  } else {
    res.status(400).json({ message: 'Email and password required' });
  }
});

// Mock user endpoint
app.get('/api/users/profile', (req, res) => {
  res.json({
    _id: 'test_user_id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'Admin',
    isApproved: true,
    approvalStatus: 'approved'
  });
});

// Mock events endpoint
app.get('/api/events', (req, res) => {
  res.json([]);
});

// Mock feedback endpoint
app.get('/api/feedback', (req, res) => {
  res.json([]);
});

// Mock messages endpoint
app.get('/api/messages', (req, res) => {
  res.json([]);
});

// Mock analytics endpoint
app.get('/api/analytics', (req, res) => {
  res.json({
    totalUsers: 0,
    totalEvents: 0,
    totalFeedback: 0
  });
});

// Mock admin endpoint
app.get('/api/admin/dashboard', (req, res) => {
  res.json({
    totalUsers: 0,
    totalEvents: 0,
    totalFeedback: 0,
    recentActivity: []
  });
});

// Catch-all for other API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({ 
    message: 'API endpoint not implemented in minimal server',
    endpoint: req.path,
    method: req.method
  });
});

// For Vercel, export the app
module.exports = app;
