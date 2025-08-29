#!/usr/bin/env node

// Test script to check backend configuration
require('dotenv').config();

console.log('🔍 Testing Backend Configuration...\n');

// Check environment variables
const requiredVars = [
  'MONGO_URI',
  'JWT_SECRET',
  'EMAIL_USER',
  'EMAIL_PASS',
  'FRONTEND_URL',
  'CORS_ORIGINS'
];

console.log('📋 Environment Variables Check:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${varName.includes('PASS') ? '***SET***' : value.substring(0, 50) + '...'}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

console.log('\n🌍 Current Environment:');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`PORT: ${process.env.PORT || 5000}`);

console.log('\n🔗 Frontend Configuration:');
console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL || 'NOT SET'}`);
console.log(`CORS_ORIGINS: ${process.env.CORS_ORIGINS || 'NOT SET'}`);

console.log('\n📧 Email Configuration:');
console.log(`EMAIL_SERVICE: ${process.env.EMAIL_SERVICE || 'NOT SET'}`);
console.log(`EMAIL_HOST: ${process.env.EMAIL_HOST || 'NOT SET'}`);
console.log(`EMAIL_PORT: ${process.env.EMAIL_PORT || 'NOT SET'}`);

// Test MongoDB connection
console.log('\n📊 Testing MongoDB Connection...');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    console.log(`Database: ${mongoose.connection.name}`);
    console.log(`Host: ${mongoose.connection.host}`);
  })
  .catch(err => {
    console.log('❌ MongoDB connection failed:');
    console.log(err.message);
  })
  .finally(() => {
    mongoose.connection.close();
    console.log('\n🏁 Test completed');
  });
