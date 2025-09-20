// Test script for registration approval routes
const axios = require('axios');

const BASE_URL = 'http://localhost:10000/api/events';

async function testRegistrationRoutes() {
  console.log('🧪 Testing Registration Approval Routes Locally...\n');
  
  try {
    // Test 1: Test the debug routes (no auth required)
    console.log('1️⃣ Testing debug registration routes...');
    try {
      const response = await axios.put(`${BASE_URL}/test-registration-routes/test-event-id/registrations/test-user-id/approve`);
      console.log('✅ Debug approve route working:', response.status);
      console.log('📋 Response:', response.data.message);
    } catch (error) {
      console.log('❌ Debug approve route error:', error.response?.status, error.response?.data?.message);
    }
    
    try {
      const response = await axios.put(`${BASE_URL}/test-registration-routes/test-event-id/registrations/test-user-id/disapprove`);
      console.log('✅ Debug disapprove route working:', response.status);
      console.log('📋 Response:', response.data.message);
    } catch (error) {
      console.log('❌ Debug disapprove route error:', error.response?.status, error.response?.data?.message);
    }
    
    // Test 2: Test the real registration routes (without auth - temporarily disabled)
    console.log('\n2️⃣ Testing real registration routes (no auth)...');
    try {
      const response = await axios.put(`${BASE_URL}/test-event-id/registrations/test-user-id/approve`);
      console.log('✅ Real approve route working:', response.status);
      console.log('📋 Response:', response.data.message || 'Route hit successfully');
    } catch (error) {
      console.log('❌ Real approve route error:', error.response?.status, error.response?.data?.message);
    }
    
    try {
      const response = await axios.put(`${BASE_URL}/test-event-id/registrations/test-user-id/disapprove`);
      console.log('✅ Real disapprove route working:', response.status);
      console.log('📋 Response:', response.data.message || 'Route hit successfully');
    } catch (error) {
      console.log('❌ Real disapprove route error:', error.response?.status, error.response?.data?.message);
    }
    
    console.log('\n🎯 Test Summary:');
    console.log('- If debug routes work but real routes don\'t, there\'s a route conflict');
    console.log('- If both work, the routes are accessible');
    console.log('- If neither work, there\'s a server/routing issue');
    
  } catch (error) {
    console.error('❌ Test script error:', error.message);
  }
}

// Run the tests
testRegistrationRoutes();
