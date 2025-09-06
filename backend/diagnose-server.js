// Server diagnosis script
require('dotenv').config();

console.log('🔍 Backend Server Diagnosis');
console.log('============================');

// Check environment variables
console.log('\n📋 Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('PORT:', process.env.PORT || 'not set');
console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
console.log('CORS_ORIGINS:', process.env.CORS_ORIGINS || 'not set');

// Check if MongoDB URI is valid
if (process.env.MONGO_URI) {
  const mongoUri = process.env.MONGO_URI;
  console.log('MONGO_URI format valid:', mongoUri.includes('mongodb'));
  console.log('MONGO_URI length:', mongoUri.length);
} else {
  console.log('❌ MONGO_URI not found!');
}

// Test basic Express server
console.log('\n🚀 Testing Express Server...');
const express = require('express');
const app = express();

// Simple health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Test server startup
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`✅ Express server started on port ${PORT}`);
  console.log(`🌐 Health check available at: http://localhost:${PORT}/health`);
  
  // Test the health endpoint
  const http = require('http');
  const options = {
    hostname: 'localhost',
    port: PORT,
    path: '/health',
    method: 'GET'
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('✅ Health check response:', JSON.parse(data));
      server.close();
      console.log('\n🎯 Diagnosis complete!');
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Health check failed:', error.message);
    server.close();
  });
  
  req.end();
});

server.on('error', (error) => {
  console.error('❌ Server startup failed:', error.message);
});
