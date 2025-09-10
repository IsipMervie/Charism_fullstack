// Test script for production backend
// This helps verify that all routes and database connections work

const axios = require('axios');

const BASE_URL = 'https://charism.onrender.com';

const testEndpoints = [
  '/api/health',
  '/api/test-db',
  '/api/test-models',
  '/api/events',
  '/api/settings/public/school'
];

async function testBackend() {
  console.log('🧪 Testing Production Backend...\n');
  
  for (const endpoint of testEndpoints) {
    try {
      console.log(`🔍 Testing: ${endpoint}`);
      const response = await axios.get(`${BASE_URL}${endpoint}`);
      console.log(`✅ ${endpoint}: ${response.status} - ${response.statusText}`);
      
      if (response.data) {
        console.log(`   Data:`, JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
      }
    } catch (error) {
      if (error.response) {
        console.log(`❌ ${endpoint}: ${error.response.status} - ${error.response.statusText}`);
        console.log(`   Error:`, error.response.data?.message || error.message);
      } else {
        console.log(`❌ ${endpoint}: Network error - ${error.message}`);
      }
    }
    console.log('');
  }
  
  console.log('🏁 Testing complete!');
}

// Run the test
testBackend().catch(console.error);
