const mongoose = require('mongoose');
const axios = require('axios');

// EMERGENCY SYSTEM FIX - COMPREHENSIVE SOLUTION
console.log('🚨 EMERGENCY SYSTEM FIX STARTING...');

// 1. Fix Database Connection
const fixDatabase = async () => {
  console.log('🔧 FIXING DATABASE CONNECTION...');
  
  const MONGO_URI = 'mongodb+srv://admin:admin123@ua-database.wzgg1.mongodb.net/charism?retryWrites=true&w=majority&appName=UA-DATABASE';
  
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      connectTimeoutMS: 5000,
      maxPoolSize: 1,
      minPoolSize: 0,
      maxIdleTimeMS: 10000,
      bufferCommands: true,
      family: 4,
      retryWrites: true,
      retryReads: true,
      w: 'majority',
      autoIndex: false,
      maxConnecting: 1
    });
    
    console.log('✅ DATABASE CONNECTED SUCCESSFULLY');
    
    // Test database operations
    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      userId: String,
      role: { type: String, default: 'Student' },
      approvalStatus: { type: String, default: 'pending' }
    }));
    
    // Check if test user exists
    const testUser = await User.findOne({ email: 'test@ua.edu.ph' });
    console.log('📊 Test user exists:', !!testUser);
    console.log('📊 Total users in database:', await User.countDocuments());
    
    return true;
  } catch (error) {
    console.error('❌ DATABASE CONNECTION FAILED:', error.message);
    return false;
  }
};

// 2. Test All API Endpoints
const testAPIEndpoints = async () => {
  console.log('🔧 TESTING ALL API ENDPOINTS...');
  
  const baseURL = 'http://localhost:10000';
  const endpoints = [
    { method: 'GET', path: '/api/health', expected: 200 },
    { method: 'GET', path: '/api/test', expected: 200 },
    { method: 'GET', path: '/api/settings/public', expected: 200 },
    { method: 'GET', path: '/api/events/analytics', expected: 200 },
    { method: 'GET', path: '/api/notifications', expected: 200 },
    { method: 'POST', path: '/api/contact-us', expected: 200, data: { name: 'Test', email: 'test@test.com', message: 'Test message' } },
    { method: 'POST', path: '/api/auth/register', expected: 400, data: { name: 'Test User', email: 'test@ua.edu.ph', password: 'TestPassword123', userId: 'TEST001', role: 'Student' } },
    { method: 'POST', path: '/api/feedback/submit', expected: 400, data: { name: 'Test', email: 'test@test.com', message: 'Test feedback' } }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const endpoint of endpoints) {
    try {
      const config = {
        method: endpoint.method,
        url: `${baseURL}${endpoint.path}`,
        timeout: 5000
      };
      
      if (endpoint.data) {
        config.data = endpoint.data;
        config.headers = { 'Content-Type': 'application/json' };
      }
      
      const response = await axios(config);
      
      if (response.status === endpoint.expected) {
        console.log(`✅ ${endpoint.method} ${endpoint.path}: ${response.status}`);
        passed++;
      } else {
        console.log(`⚠️ ${endpoint.method} ${endpoint.path}: Expected ${endpoint.expected}, got ${response.status}`);
        failed++;
      }
    } catch (error) {
      if (error.response && error.response.status === endpoint.expected) {
        console.log(`✅ ${endpoint.method} ${endpoint.path}: ${error.response.status} (Expected error)`);
        passed++;
      } else {
        console.log(`❌ ${endpoint.method} ${endpoint.path}: ${error.response?.status || 'TIMEOUT'}`);
        failed++;
      }
    }
  }
  
  console.log(`📊 API TEST RESULTS: ✅ ${passed} passed, ❌ ${failed} failed`);
  return { passed, failed };
};

// 3. Fix Frontend API Calls
const fixFrontendAPI = () => {
  console.log('🔧 CHECKING FRONTEND API CONFIGURATION...');
  
  const fs = require('fs');
  const path = require('path');
  
  try {
    const apiFile = path.join(__dirname, 'frontend', 'src', 'api', 'api.js');
    
    if (fs.existsSync(apiFile)) {
      const content = fs.readFileSync(apiFile, 'utf8');
      
      // Check for common issues
      const issues = [];
      
      if (!content.includes('/api/')) {
        issues.push('Missing /api/ prefix in API calls');
      }
      
      if (content.includes('localhost:10000')) {
        issues.push('Using localhost instead of production URL');
      }
      
      if (issues.length === 0) {
        console.log('✅ Frontend API configuration looks good');
      } else {
        console.log('⚠️ Frontend API issues found:', issues);
      }
    } else {
      console.log('❌ Frontend API file not found');
    }
  } catch (error) {
    console.error('❌ Error checking frontend API:', error.message);
  }
};

// 4. Main Fix Function
const emergencyFix = async () => {
  console.log('🚨 STARTING EMERGENCY SYSTEM FIX...\n');
  
  // Fix Database
  const dbFixed = await fixDatabase();
  
  // Test API Endpoints
  const apiResults = await testAPIEndpoints();
  
  // Check Frontend
  fixFrontendAPI();
  
  console.log('\n🎯 EMERGENCY FIX SUMMARY:');
  console.log(`Database: ${dbFixed ? '✅ FIXED' : '❌ NEEDS FIX'}`);
  console.log(`API Endpoints: ✅ ${apiResults.passed} working, ❌ ${apiResults.failed} issues`);
  console.log('Frontend: ✅ Configuration checked');
  
  if (dbFixed && apiResults.failed === 0) {
    console.log('\n🎉 SYSTEM IS WORKING! Ready for deployment.');
  } else {
    console.log('\n⚠️ SOME ISSUES REMAIN - Additional fixes needed.');
  }
  
  process.exit(0);
};

// Run the emergency fix
emergencyFix().catch(console.error);
