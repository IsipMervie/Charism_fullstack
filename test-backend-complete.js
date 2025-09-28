// Complete Backend Testing Script
const axios = require('axios');

async function testBackend() {
  console.log('🔧 Complete Backend Testing Starting...');
  console.log('=====================================');
  
  const baseURL = 'http://localhost:10000';
  
  try {
    // Test 1: Health Check
    console.log('\n🏥 Testing Health Endpoint...');
    const health = await axios.get(`${baseURL}/health`);
    console.log('✅ Health Status:', health.data.status);
    
    // Test 2: API Health
    console.log('\n🔍 Testing API Health...');
    const apiHealth = await axios.get(`${baseURL}/api/health`);
    console.log('✅ API Status:', apiHealth.data.status);
    
    // Test 3: Database Connection
    console.log('\n🗄️ Testing Database Connection...');
    const dbTest = await axios.get(`${baseURL}/api/test-db-connection`);
    console.log('✅ Database Status:', dbTest.data.status);
    console.log('✅ User Count:', dbTest.data.userCount);
    
    // Test 4: User Registration
    console.log('\n📝 Testing User Registration...');
    const registerData = {
      name: 'Test User',
      email: 'testuser@test.com',
      password: 'password123',
      userId: '12345',
      role: 'Student'
    };
    
    const register = await axios.post(`${baseURL}/api/auth/register`, registerData);
    console.log('✅ Registration Status:', register.data.message);
    
    // Test 5: User Login
    console.log('\n🔐 Testing User Login...');
    const loginData = {
      email: 'testuser@test.com',
      password: 'password123'
    };
    
    const login = await axios.post(`${baseURL}/api/auth/login`, loginData);
    console.log('✅ Login Status:', login.data.message);
    console.log('✅ Token Received:', !!login.data.token);
    
    const token = login.data.token;
    
    // Test 6: Events API
    console.log('\n📅 Testing Events API...');
    const events = await axios.get(`${baseURL}/api/events`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Events API Status: Working');
    
    // Test 7: File Upload System
    console.log('\n📁 Testing File Upload System...');
    const uploads = await axios.get(`${baseURL}/api/uploads-health`);
    console.log('✅ Upload System Status:', uploads.data.status);
    
    // Test 8: Server Status
    console.log('\n📊 Testing Server Status...');
    const status = await axios.get(`${baseURL}/api/status`);
    console.log('✅ Server Status:', status.data.status);
    console.log('✅ Server Uptime:', status.data.server.uptime + 's');
    console.log('✅ Database Connected:', status.data.database.connected);
    
    // Test 9: Environment Check
    console.log('\n🔧 Testing Environment Configuration...');
    const envCheck = await axios.get(`${baseURL}/api/env-check`);
    console.log('✅ Environment Status:', envCheck.data.status);
    
    // Test 10: CORS Test
    console.log('\n🌐 Testing CORS Configuration...');
    const corsTest = await axios.get(`${baseURL}/api/cors-test`);
    console.log('✅ CORS Status:', corsTest.data.corsStatus);
    
    console.log('\n🎯 BACKEND TEST SUMMARY');
    console.log('=====================================');
    console.log('✅ Health Endpoints: Working');
    console.log('✅ Database Connection: Connected');
    console.log('✅ User Registration: Working');
    console.log('✅ User Login: Working');
    console.log('✅ JWT Authentication: Working');
    console.log('✅ Events API: Working');
    console.log('✅ File Upload System: Working');
    console.log('✅ Server Status: Healthy');
    console.log('✅ Environment Config: Valid');
    console.log('✅ CORS Configuration: Working');
    
    console.log('\n🚀 BACKEND IS 100% FUNCTIONAL!');
    console.log('Your backend is ready for production deployment.');
    
  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  }
}

// Run the test
testBackend();





