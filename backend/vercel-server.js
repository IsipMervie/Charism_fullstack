// vercel-server.js - Production server for Vercel
const express = require('express');
const cors = require('cors');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

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

// For Vercel, export the app
module.exports = app;
