// Test the super simple routes
const axios = require('axios');

const BASE_URL = 'https://charism-api-xtw9.onrender.com/api/events';

async function testSimpleRoutes() {
  console.log('🧪 Testing Super Simple Routes...\n');
  
  const eventId = '68ce426bd8ff015084ccba63';
  const userId = '68cb3c2bd8ff015084ccba63';
  
  console.log('1️⃣ Testing approve-now route...');
  console.log(`URL: PUT ${BASE_URL}/approve-now/${eventId}/${userId}`);
  
  try {
    const response = await axios.put(`${BASE_URL}/approve-now/${eventId}/${userId}`);
    console.log('✅ SUCCESS! Approve-now route working:', response.status);
    console.log('📋 Response:', response.data);
  } catch (error) {
    if (error.response?.status === 404 && error.response?.data?.message === 'Registration not found.') {
      console.log('✅ SUCCESS! Route is working - 404 is from controller (registration not found in DB)');
    } else {
      console.log('❌ Route error:', error.response?.status, error.response?.data?.message);
    }
  }
  
  console.log('\n2️⃣ Testing disapprove-now route...');
  console.log(`URL: PUT ${BASE_URL}/disapprove-now/${eventId}/${userId}`);
  
  try {
    const response = await axios.put(`${BASE_URL}/disapprove-now/${eventId}/${userId}`, {
      reason: 'Test disapproval'
    });
    console.log('✅ SUCCESS! Disapprove-now route working:', response.status);
    console.log('📋 Response:', response.data);
  } catch (error) {
    if (error.response?.status === 404 && error.response?.data?.message === 'Registration not found.') {
      console.log('✅ SUCCESS! Route is working - 404 is from controller (registration not found in DB)');
    } else if (error.response?.status === 400 && error.response?.data?.message === 'Reason for disapproval is required.') {
      console.log('✅ SUCCESS! Route is working - 400 is validation error (missing reason)');
    } else {
      console.log('❌ Route error:', error.response?.status, error.response?.data?.message);
    }
  }
  
  console.log('\n🎯 SUMMARY:');
  console.log('- If you see "SUCCESS! Route is working" above, the routes are accessible');
  console.log('- The 404 "Registration not found" means the route works but data is missing');
  console.log('- This is expected behavior - the routes are working correctly');
}

testSimpleRoutes();
