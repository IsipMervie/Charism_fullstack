// Test the REAL registration approval routes
const axios = require('axios');

const BASE_URL = 'https://charism-api-xtw9.onrender.com/api/events';

async function testRealApprovalRoutes() {
  console.log('🧪 Testing REAL Registration Approval Routes...\n');
  
  try {
    // Test the actual approval route that your frontend is calling
    console.log('1️⃣ Testing REAL approval route...');
    const testEventId = '68ce426bd8ff015084ccba63'; // Your actual event ID
    const testUserId = '68cb3c2bd8ff015084ccba63'; // Your actual user ID
    
    try {
      const response = await axios.put(`${BASE_URL}/${testEventId}/registrations/${testUserId}/approve`);
      console.log('✅ REAL approval route working:', response.status);
      console.log('📋 Response:', response.data);
    } catch (error) {
      console.log('❌ REAL approval route error:', error.response?.status);
      console.log('🔍 Error message:', error.response?.data?.message);
      console.log('🔍 Full error:', error.response?.data);
    }
    
    // Test the actual disapproval route
    console.log('\n2️⃣ Testing REAL disapproval route...');
    try {
      const response = await axios.put(`${BASE_URL}/${testEventId}/registrations/${testUserId}/disapprove`);
      console.log('✅ REAL disapproval route working:', response.status);
      console.log('📋 Response:', response.data);
    } catch (error) {
      console.log('❌ REAL disapproval route error:', error.response?.status);
      console.log('🔍 Error message:', error.response?.data?.message);
      console.log('🔍 Full error:', error.response?.data);
    }
    
    console.log('\n🎯 Real Route Test Summary:');
    console.log('- These are the ACTUAL routes your frontend is calling');
    console.log('- If these fail, that explains why you get 404 errors');
    
  } catch (error) {
    console.error('❌ Test script error:', error.message);
  }
}

// Run the tests
testRealApprovalRoutes();
