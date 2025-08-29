#!/usr/bin/env node

// Production start script for Render deployment
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting CommunityLink Backend in Production Mode...');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Port:', process.env.PORT || 5000);
console.log('Frontend URL:', process.env.FRONTEND_URL || 'Not set');
console.log('CORS Origins:', process.env.CORS_ORIGINS || 'Not set');

// Check if required environment variables are set
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('Please set these variables in your Render dashboard');
  process.exit(1);
}

console.log('✅ All required environment variables are set');

// Start the server
const server = spawn('node', ['server.js'], {
  stdio: 'inherit',
  env: process.env
});

server.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.kill('SIGINT');
});
