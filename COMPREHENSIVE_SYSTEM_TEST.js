const axios = require('axios');

console.log('=== COMPREHENSIVE SYSTEM FUNCTIONALITY TEST ===');
console.log('Testing all system components...\n');

// Test backend health endpoint
async function testBackendHealth() {
  try {
    console.log('🔍 Testing backend health endpoint...');
    const response = await axios.get('https://charism-api-xtw9.onrender.com/api/health', { timeout: 10000 });
    console.log('✅ Backend health check passed:', response.status);
    console.log('Response:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Backend health check failed:', error.message);
    return false;
  }
}

// Test database connection
async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    const response = await axios.get('https://charism-api-xtw9.onrender.com/api/health/db', { timeout: 10000 });
    console.log('✅ Database connection test passed:', response.status);
    console.log('Response:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Database connection test failed:', error.message);
    return false;
  }
}

// Test authentication endpoints
async function testAuthEndpoints() {
  try {
    console.log('🔍 Testing authentication endpoints...');
    
    // Test register endpoint (should return validation error for empty data)
    const registerResponse = await axios.post('https://charism-api-xtw9.onrender.com/api/auth/register', {}, { timeout: 10000 });
    console.log('✅ Register endpoint accessible:', registerResponse.status);
    
    // Test login endpoint (should return validation error for empty data)
    const loginResponse = await axios.post('https://charism-api-xtw9.onrender.com/api/auth/login', {}, { timeout: 10000 });
    console.log('✅ Login endpoint accessible:', loginResponse.status);
    
    return true;
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ Auth endpoints accessible (validation errors expected):', error.response.status);
      return true;
    }
    console.log('❌ Auth endpoints test failed:', error.message);
    return false;
  }
}

// Test events endpoints
async function testEventsEndpoints() {
  try {
    console.log('🔍 Testing events endpoints...');
    const response = await axios.get('https://charism-api-xtw9.onrender.com/api/events', { timeout: 10000 });
    console.log('✅ Events endpoint accessible:', response.status);
    console.log('Events count:', response.data?.events?.length || 0);
    return true;
  } catch (error) {
    console.log('❌ Events endpoints test failed:', error.message);
    return false;
  }
}

// Test users endpoints
async function testUsersEndpoints() {
  try {
    console.log('🔍 Testing users endpoints...');
    const response = await axios.get('https://charism-api-xtw9.onrender.com/api/users', { timeout: 10000 });
    console.log('✅ Users endpoint accessible:', response.status);
    return true;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Users endpoint accessible (auth required):', error.response.status);
      return true;
    }
    console.log('❌ Users endpoints test failed:', error.message);
    return false;
  }
}

// Test file upload endpoints
async function testFileEndpoints() {
  try {
    console.log('🔍 Testing file upload endpoints...');
    const response = await axios.get('https://charism-api-xtw9.onrender.com/api/files/health', { timeout: 10000 });
    console.log('✅ File endpoints accessible:', response.status);
    return true;
  } catch (error) {
    console.log('❌ File endpoints test failed:', error.message);
    return false;
  }
}

// Test email functionality
async function testEmailFunctionality() {
  try {
    console.log('🔍 Testing email functionality...');
    const response = await axios.get('https://charism-api-xtw9.onrender.com/api/health/email', { timeout: 10000 });
    console.log('✅ Email functionality test passed:', response.status);
    console.log('Response:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Email functionality test failed:', error.message);
    return false;
  }
}

// Test image handling
async function testImageHandling() {
  try {
    console.log('🔍 Testing image handling...');
    const response = await axios.get('https://charism-api-xtw9.onrender.com/api/files/images/health', { timeout: 10000 });
    console.log('✅ Image handling test passed:', response.status);
    return true;
  } catch (error) {
    console.log('❌ Image handling test failed:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  const results = {
    backendHealth: await testBackendHealth(),
    databaseConnection: await testDatabaseConnection(),
    authEndpoints: await testAuthEndpoints(),
    eventsEndpoints: await testEventsEndpoints(),
    usersEndpoints: await testUsersEndpoints(),
    fileEndpoints: await testFileEndpoints(),
    emailFunctionality: await testEmailFunctionality(),
    imageHandling: await testImageHandling()
  };
  
  console.log('\n=== TEST RESULTS SUMMARY ===');
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? 'PASSED' : 'FAILED';
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${test}: ${status}`);
  });
  
  console.log(`\n📊 Overall: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! System is working properly.');
  } else {
    console.log('⚠️ Some tests failed. System may have issues.');
  }
  
  return results;
}

runAllTests().catch(console.error);
