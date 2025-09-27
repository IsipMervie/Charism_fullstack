// Complete API Testing Script
const axios = require('axios');

const BASE_URL = 'https://charism-api-xtw9.onrender.com';

// Test endpoints systematically
async function testAllEndpoints() {
  console.log('🧪 STARTING COMPREHENSIVE API TESTING...\n');
  
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };

  // Test 1: Health Check
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', response.status);
    results.passed++;
  } catch (error) {
    console.log('❌ Health Check Failed:', error.message);
    results.failed++;
    results.errors.push('Health Check');
  }

  // Test 2: API Ping
  try {
    const response = await axios.get(`${BASE_URL}/api/ping`);
    console.log('✅ API Ping:', response.status);
    results.passed++;
  } catch (error) {
    console.log('❌ API Ping Failed:', error.message);
    results.failed++;
    results.errors.push('API Ping');
  }

  // Test 3: Settings Public
  try {
    const response = await axios.get(`${BASE_URL}/api/settings/public`);
    console.log('✅ Settings Public:', response.status);
    results.passed++;
  } catch (error) {
    console.log('❌ Settings Public Failed:', error.message);
    results.failed++;
    results.errors.push('Settings Public');
  }

  // Test 4: Contact Form (should work)
  try {
    const response = await axios.post(`${BASE_URL}/api/contact-us`, {
      name: 'Test User',
      email: 'test@ua.edu.ph',
      message: 'Test message'
    });
    console.log('✅ Contact Form:', response.status);
    results.passed++;
  } catch (error) {
    console.log('❌ Contact Form Failed:', error.response?.status || error.message);
    results.failed++;
    results.errors.push('Contact Form');
  }

  // Test 5: Registration (should return validation error, not 404)
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, {
      name: 'Test User',
      email: 'test@ua.edu.ph',
      password: 'TestPassword123',
      userId: 'TEST001',
      academicYear: '2024-2025',
      year: '1st Year',
      section: 'A',
      department: 'Computer Science',
      role: 'Student'
    });
    console.log('✅ Registration Endpoint:', response.status);
    results.passed++;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Registration Endpoint (400 validation error - expected):', error.response.status);
      results.passed++;
    } else {
      console.log('❌ Registration Failed:', error.response?.status || error.message);
      results.failed++;
      results.errors.push('Registration');
    }
  }

  // Test 6: Feedback Submit
  try {
    const response = await axios.post(`${BASE_URL}/api/feedback/submit`, {
      name: 'Test User',
      email: 'test@ua.edu.ph',
      message: 'Test feedback'
    });
    console.log('✅ Feedback Submit:', response.status);
    results.passed++;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Feedback Submit (400 validation error - expected):', error.response.status);
      results.passed++;
    } else {
      console.log('❌ Feedback Submit Failed:', error.response?.status || error.message);
      results.failed++;
      results.errors.push('Feedback Submit');
    }
  }

  // Test 7: Events Analytics
  try {
    const response = await axios.get(`${BASE_URL}/api/events/analytics`);
    console.log('✅ Events Analytics:', response.status);
    results.passed++;
  } catch (error) {
    console.log('❌ Events Analytics Failed:', error.response?.status || error.message);
    results.failed++;
    results.errors.push('Events Analytics');
  }

  // Test 8: Notifications
  try {
    const response = await axios.get(`${BASE_URL}/api/notifications`);
    console.log('✅ Notifications:', response.status);
    results.passed++;
  } catch (error) {
    console.log('❌ Notifications Failed:', error.response?.status || error.message);
    results.failed++;
    results.errors.push('Notifications');
  }

  console.log('\n📊 TEST RESULTS:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ FAILED ENDPOINTS:');
    results.errors.forEach(error => console.log(`  - ${error}`));
  }

  if (results.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! System is working correctly.');
  } else {
    console.log('\n⚠️  Some endpoints failed. Need to fix these issues.');
  }

  return results;
}

// Run the tests
testAllEndpoints().catch(console.error);
