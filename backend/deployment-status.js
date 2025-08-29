#!/usr/bin/env node

// Deployment status checker for CommunityLink Backend
require('dotenv').config(); // Load environment variables first

console.log('🔍 CommunityLink Backend Deployment Status Checker\n');

// Check if we're running locally or in production
const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 5000;

console.log(`🌍 Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
console.log(`🚀 Port: ${port}`);
console.log(`📅 Time: ${new Date().toISOString()}\n`);

// Check environment variables
console.log('📋 Environment Variables Status:');
const envVars = [
  'MONGO_URI',
  'JWT_SECRET', 
  'EMAIL_USER',
  'EMAIL_PASS',
  'FRONTEND_URL',
  'CORS_ORIGINS'
];

envVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const displayValue = varName.includes('PASS') || varName.includes('SECRET') 
      ? '***SET***' 
      : value.substring(0, 30) + '...';
    console.log(`✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

console.log('\n🔗 Frontend Configuration:');
console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'NOT SET'}`);
console.log(`CORS Origins: ${process.env.CORS_ORIGINS || 'NOT SET'}`);

console.log('\n📧 Email Configuration:');
console.log(`Email Service: ${process.env.EMAIL_SERVICE || 'NOT SET'}`);
console.log(`Email Host: ${process.env.EMAIL_HOST || 'NOT SET'}`);
console.log(`Email Port: ${process.env.EMAIL_PORT || 'NOT SET'}`);

// Test MongoDB connection
console.log('\n📊 Testing MongoDB Connection...');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    console.log(`Database: ${mongoose.connection.name}`);
    console.log(`Host: ${mongoose.connection.host}`);
    console.log(`Connection State: ${mongoose.connection.readyState}`);
  })
  .catch(err => {
    console.log('❌ MongoDB connection failed:');
    console.log(`Error: ${err.message}`);
    if (err.code === 'ENOTFOUND') {
      console.log('💡 This usually means the MongoDB URI is incorrect or network access is blocked');
    }
  })
  .finally(() => {
    mongoose.connection.close();
    console.log('\n🏁 Status check completed');
    
    if (isProduction) {
      console.log('\n🚀 PRODUCTION DEPLOYMENT NOTES:');
      console.log('1. Make sure all environment variables are set in Render dashboard');
      console.log('2. Check Render logs for any startup errors');
      console.log('3. Verify MongoDB network access is enabled');
      console.log('4. Test the health endpoint: /api/health');
    } else {
      console.log('\n💻 LOCAL DEVELOPMENT NOTES:');
      console.log('1. Make sure your .env file is in the backend folder');
      console.log('2. Check that MongoDB is accessible from your network');
      console.log('3. Test with: npm start');
    }
  });
