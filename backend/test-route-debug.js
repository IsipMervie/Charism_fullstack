// Debug script to test if routes are actually being hit
const axios = require('axios');

const BASE_URL = 'https://charism-api-xtw9.onrender.com/api/events';

async function testRouteDebug() {
  console.log('🔍 Testing Route Debug...\n');
  
  try {
    // Test with actual event and user IDs from your error
    const eventId = '68ce426bd8ff015084ccba63';
    const userId = '68cb3c2bd8ff015084ccba63';
    
    console.log('🎯 Testing APPROVAL route...');
    console.log(`URL: ${BASE_URL}/${eventId}/registrations/${userId}/approve`);
    
    try {
      const response = await axios.put(`${BASE_URL}/${eventId}/registrations/${userId}/approve`);
      console.log('✅ APPROVAL route working:', response.status);
      console.log('📋 Response:', response.data);
    } catch (error) {
      console.log('❌ APPROVAL route error:', error.response?.status);
      console.log('🔍 Error message:', error.response?.data?.message);
      console.log('🔍 Full error:', error.response?.data);
      
      // Check if it's a 404
      if (error.response?.status === 404) {
        console.log('\n🚨 404 ERROR DETECTED!');
        console.log('This means the route is not being found by Express');
        console.log('Possible causes:');
        console.log('1. Route not registered properly');
        console.log('2. Route order conflict');
        console.log('3. Middleware blocking the route');
        console.log('4. Server not updated with latest code');
      }
    }
    
    console.log('\n🎯 Testing DISAPPROVAL route...');
    console.log(`URL: ${BASE_URL}/${eventId}/registrations/${userId}/disapprove`);
    
    try {
      const response = await axios.put(`${BASE_URL}/${eventId}/registrations/${userId}/disapprove`, {
        reason: 'Test disapproval'
      });
      console.log('✅ DISAPPROVAL route working:', response.status);
      console.log('📋 Response:', response.data);
    } catch (error) {
      console.log('❌ DISAPPROVAL route error:', error.response?.status);
      console.log('🔍 Error message:', error.response?.data?.message);
      console.log('🔍 Full error:', error.response?.data);
      
      if (error.response?.status === 404) {
        console.log('\n🚨 404 ERROR DETECTED!');
        console.log('Same issue as approval route');
      }
    }
    
  } catch (error) {
    console.error('❌ Test script error:', error.message);
  }
}

// Run the test
testRouteDebug();
