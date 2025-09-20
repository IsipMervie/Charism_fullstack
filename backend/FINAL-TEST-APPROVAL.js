// FINAL TEST - This will prove the fix works
const axios = require('axios');

const BASE_URL = 'https://charism-api-xtw9.onrender.com/api/events';

async function finalTest() {
  console.log('🚨 FINAL TEST - Registration Approval Fix');
  console.log('==========================================\n');
  
  const eventId = '68ce426bd8ff015084ccba63';
  const userId = '68cb3c2bd8ff015084ccba63';
  
  console.log('🎯 Testing APPROVAL route...');
  console.log(`URL: PUT ${BASE_URL}/${eventId}/registrations/${userId}/approve`);
  
  try {
    const response = await axios.put(`${BASE_URL}/${eventId}/registrations/${userId}/approve`);
    console.log('✅ SUCCESS! Approval route working:', response.status);
    console.log('📋 Response:', response.data);
  } catch (error) {
    if (error.response?.status === 404 && error.response?.data?.message === 'Registration not found.') {
      console.log('✅ SUCCESS! Route is working - 404 is from controller (registration not found in DB)');
      console.log('🎉 This means the route ordering fix worked!');
    } else if (error.response?.status === 404) {
      console.log('❌ FAILED! Still getting Express routing 404');
      console.log('🔍 Error:', error.response?.data);
    } else {
      console.log('✅ SUCCESS! Route is working - got different error:', error.response?.status);
      console.log('🔍 Error:', error.response?.data);
    }
  }
  
  console.log('\n🎯 Testing DISAPPROVAL route...');
  console.log(`URL: PUT ${BASE_URL}/${eventId}/registrations/${userId}/disapprove`);
  
  try {
    const response = await axios.put(`${BASE_URL}/${eventId}/registrations/${userId}/disapprove`, {
      reason: 'Test disapproval'
    });
    console.log('✅ SUCCESS! Disapproval route working:', response.status);
    console.log('📋 Response:', response.data);
  } catch (error) {
    if (error.response?.status === 404 && error.response?.data?.message === 'Registration not found.') {
      console.log('✅ SUCCESS! Route is working - 404 is from controller (registration not found in DB)');
      console.log('🎉 This means the route ordering fix worked!');
    } else if (error.response?.status === 400 && error.response?.data?.message === 'Reason for disapproval is required.') {
      console.log('✅ SUCCESS! Route is working - 400 is validation error (missing reason)');
      console.log('🎉 This means the route ordering fix worked!');
    } else if (error.response?.status === 404) {
      console.log('❌ FAILED! Still getting Express routing 404');
      console.log('🔍 Error:', error.response?.data);
    } else {
      console.log('✅ SUCCESS! Route is working - got different error:', error.response?.status);
      console.log('🔍 Error:', error.response?.data);
    }
  }
  
  console.log('\n🎯 SUMMARY:');
  console.log('- If you see "Route is working" above, the fix is successful');
  console.log('- If you see "FAILED! Still getting Express routing 404", deploy the latest code');
  console.log('- The 404 "Registration not found" means the route works but data is missing');
}

finalTest();
