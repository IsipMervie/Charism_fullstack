// Simple endpoint test script
const axios = require('axios');

const BASE_URL = 'https://charism-api-xtw9.onrender.com/api/events';

async function testEndpoints() {
  console.log('🧪 Testing Event Endpoints...\n');
  
  try {
    // Test 1: Registration token endpoint
    console.log('1️⃣ Testing registration token endpoint...');
    const token = 'evt_68ce426bd8ff015084ccba63_1758347899119';
    try {
      const response = await axios.get(`${BASE_URL}/register/${token}`);
      console.log('✅ Registration token endpoint working:', response.status);
      console.log('📋 Event found:', response.data.title || 'Unknown');
    } catch (error) {
      console.log('❌ Registration token endpoint error:', error.response?.status, error.response?.data?.message);
    }
    
    // Test 2: Test approval endpoints
    console.log('\n2️⃣ Testing approval endpoints...');
    try {
      const response = await axios.get(`${BASE_URL}/test-approval`);
      console.log('✅ Test approval endpoint working:', response.status);
      console.log('📋 Available routes:', response.data.availableRoutes);
    } catch (error) {
      console.log('❌ Test approval endpoint error:', error.response?.status, error.response?.data?.message);
    }
    
    // Test 3: Test registration token test endpoint
    console.log('\n3️⃣ Testing registration token test endpoint...');
    try {
      const response = await axios.get(`${BASE_URL}/test-register/test-token`);
      console.log('✅ Registration token test endpoint working:', response.status);
      console.log('📋 Token received:', response.data.token);
    } catch (error) {
      console.log('❌ Registration token test endpoint error:', error.response?.status, error.response?.data?.message);
      console.log('🔍 Full error response:', error.response?.data);
    }
    
    // Test 4: Test a simple route to verify basic connectivity
    console.log('\n4️⃣ Testing simple test route...');
    try {
      const response = await axios.get(`${BASE_URL}/test-simple`);
      console.log('✅ Simple test route working:', response.status);
      console.log('📋 Message:', response.data.message);
    } catch (error) {
      console.log('❌ Simple test route error:', error.response?.status, error.response?.data?.message);
    }
    
    // Test 5: Test debug route without parameters
    console.log('\n5️⃣ Testing debug route without parameters...');
    try {
      const response = await axios.get(`${BASE_URL}/test-register-debug`);
      console.log('✅ Debug route working:', response.status);
      console.log('📋 Message:', response.data.message);
    } catch (error) {
      console.log('❌ Debug route error:', error.response?.status, error.response?.data?.message);
    }
    
    console.log('\n🎯 Test Summary:');
    console.log('- Check the results above to see which endpoints are working');
    console.log('- If you see ✅, the endpoint is working');
    console.log('- If you see ❌, there may still be an issue');
    
  } catch (error) {
    console.error('❌ Test script error:', error.message);
  }
}

// Run the tests
testEndpoints();
