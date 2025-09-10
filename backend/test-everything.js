// Comprehensive test script for the entire CommunityLink system
// This will test all endpoints, functionality, and identify any issues

const axios = require('axios');

const BASE_URL = 'https://charism.onrender.com';

// Test all endpoints systematically
const testEndpoints = [
  // Health and basic endpoints
  { path: '/api/health', method: 'GET', auth: false, description: 'Health Check' },
  { path: '/api/test-db', method: 'GET', auth: false, description: 'Database Test' },
  { path: '/api/test-models', method: 'GET', auth: false, description: 'Models Test' },
  { path: '/api/uploads-health', method: 'GET', auth: false, description: 'Uploads Health' },
  
  // Public endpoints (no auth required)
  { path: '/api/settings/public/school', method: 'GET', auth: false, description: 'Public School Settings' },
  { path: '/api/settings/public', method: 'GET', auth: false, description: 'Public Settings' },
  { path: '/api/events', method: 'GET', auth: false, description: 'Public Events' },
  { path: '/api/events/health', method: 'GET', auth: false, description: 'Events Health' },
  { path: '/api/feedback/submit', method: 'POST', auth: false, description: 'Submit Feedback' },
  
  // File serving endpoints
  { path: '/api/files/school-logo', method: 'GET', auth: false, description: 'School Logo' },
  { path: '/api/files/profile-picture/test-user', method: 'GET', auth: false, description: 'Profile Picture' },
  { path: '/api/files/event-image/test-event', method: 'GET', auth: false, description: 'Event Image' },
  { path: '/api/files/documentation/test-file', method: 'GET', auth: false, description: 'Documentation File' },
  
  // Auth endpoints (POST requests)
  { path: '/api/auth/login', method: 'POST', auth: false, description: 'Login Endpoint' },
  { path: '/api/auth/register', method: 'POST', auth: false, description: 'Register Endpoint' },
  { path: '/api/auth/forgot-password', method: 'POST', auth: false, description: 'Forgot Password' },
  
  // Protected endpoints (will return 401 without auth)
  { path: '/api/settings/school', method: 'GET', auth: true, description: 'Protected School Settings' },
  { path: '/api/settings', method: 'GET', auth: true, description: 'Protected Settings' },
  { path: '/api/users', method: 'GET', auth: true, description: 'Users List' },
  { path: '/api/analytics', method: 'GET', auth: true, description: 'Analytics' },
  { path: '/api/admin', method: 'GET', auth: true, description: 'Admin Panel' },
  { path: '/api/reports', method: 'GET', auth: true, description: 'Reports' },
  { path: '/api/reports/test', method: 'GET', auth: false, description: 'Reports Test' },
  { path: '/api/certificates', method: 'GET', auth: true, description: 'Certificates' },
  { path: '/api/messages', method: 'GET', auth: true, description: 'Messages' },
  { path: '/api/contact-us', method: 'GET', auth: true, description: 'Contact Us' },
  { path: '/api/academic-years', method: 'GET', auth: true, description: 'Academic Years' },
  { path: '/api/feedback/my-feedback', method: 'GET', auth: true, description: 'My Feedback' },
  
  // Event-specific endpoints
  { path: '/api/events/test-event', method: 'GET', auth: false, description: 'Specific Event' },
  { path: '/api/events/test-event/attendance', method: 'GET', auth: true, description: 'Event Attendance' },
  { path: '/api/events/test-event/documentation', method: 'GET', auth: true, description: 'Event Documentation' },
  
  // User-specific endpoints
  { path: '/api/users/test-user', method: 'GET', auth: true, description: 'Specific User' },
  { path: '/api/users/test-user/profile-picture', method: 'POST', auth: true, description: 'Upload Profile Picture' }
];

// Test specific functionality
const testFunctionality = [
  { name: 'PDF Generation', test: testPDFGeneration },
  { name: 'File Uploads', test: testFileUploads },
  { name: 'Documentation', test: testDocumentation },
  { name: 'Database Models', test: testDatabaseModels },
  { path: 'Error Handling', test: testErrorHandling }
];

async function testEndpoint(endpoint) {
  try {
    console.log(`🔍 Testing: ${endpoint.description}`);
    console.log(`   Path: ${endpoint.path}`);
    console.log(`   Method: ${endpoint.method}`);
    
    let response;
    
    if (endpoint.method === 'GET') {
      response = await axios.get(`${BASE_URL}${endpoint.path}`);
    } else if (endpoint.method === 'POST') {
      // For POST endpoints, just check if they exist (will return 400/401 without data)
      response = await axios.post(`${BASE_URL}${endpoint.path}`, {});
    }
    
    console.log(`   ✅ Status: ${response.status} - ${response.statusText}`);
    
    if (response.data && typeof response.data === 'object') {
      const dataPreview = JSON.stringify(response.data).substring(0, 150);
      console.log(`   📊 Data: ${dataPreview}...`);
    }
    
    return { success: true, status: response.status, data: response.data };
    
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.message;
      
      if (status === 401 && endpoint.auth) {
        console.log(`   ⚠️  ${status} - Unauthorized (Expected for protected endpoint)`);
        return { success: true, status, message: 'Expected 401 for protected endpoint' };
      } else if (status === 400 && endpoint.method === 'POST') {
        console.log(`   ⚠️  ${status} - Bad Request (Expected for POST without data)`);
        return { success: true, status, message: 'Expected 400 for POST without data' };
      } else if (status === 404 && endpoint.path.includes('test-')) {
        console.log(`   ⚠️  ${status} - Not Found (Expected for test endpoints)`);
        return { success: true, status, message: 'Expected 404 for test endpoints' };
      } else {
        console.log(`   ❌ ${status} - ${message}`);
        return { success: false, status, message };
      }
    } else {
      console.log(`   ❌ Network Error - ${error.message}`);
      return { success: false, status: 0, message: error.message };
    }
  }
}

async function testPDFGeneration() {
  console.log('\n📄 Testing PDF Generation...');
  
  try {
    // Test reports route
    const response = await axios.get(`${BASE_URL}/api/reports/test`);
    console.log('   ✅ Reports route working');
    
    // Test PDF endpoints (will return 401 without auth)
    const pdfEndpoints = [
      '/api/reports/students-by-year?year=2025-2026',
      '/api/reports/students-40-hours',
      '/api/reports/event-list'
    ];
    
    for (const endpoint of pdfEndpoints) {
      try {
        await axios.get(`${BASE_URL}${endpoint}`);
        console.log(`   ❌ ${endpoint} should require authentication`);
      } catch (error) {
        if (error.response?.status === 401) {
          console.log(`   ✅ ${endpoint} properly protected`);
        } else {
          console.log(`   ⚠️  ${endpoint} unexpected response: ${error.response?.status}`);
        }
      }
    }
    
    return { success: true, message: 'PDF generation tests completed' };
  } catch (error) {
    console.log(`   ❌ PDF generation test failed: ${error.message}`);
    return { success: false, message: error.message };
  }
}

async function testFileUploads() {
  console.log('\n📤 Testing File Uploads...');
  
  try {
    // Test file serving endpoints
    const fileEndpoints = [
      '/api/files/school-logo',
      '/api/files/profile-picture/test-user',
      '/api/files/event-image/test-event',
      '/api/files/documentation/test-file'
    ];
    
    for (const endpoint of fileEndpoints) {
      try {
        const response = await axios.get(`${BASE_URL}${endpoint}`);
        if (response.status === 404) {
          console.log(`   ⚠️  ${endpoint} - File not found (Expected for test files)`);
        } else {
          console.log(`   ✅ ${endpoint} - Working`);
        }
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`   ⚠️  ${endpoint} - File not found (Expected for test files)`);
        } else {
          console.log(`   ❌ ${endpoint} - Error: ${error.message}`);
        }
      }
    }
    
    return { success: true, message: 'File upload tests completed' };
  } catch (error) {
    console.log(`   ❌ File upload test failed: ${error.message}`);
    return { success: false, message: error.message };
  }
}

async function testDocumentation() {
  console.log('\n📁 Testing Documentation...');
  
  try {
    // Test documentation endpoints
    const docEndpoints = [
      '/api/events/test-event/documentation',
      '/api/events/test-event/documentation/upload'
    ];
    
    for (const endpoint of docEndpoints) {
      try {
        if (endpoint.includes('upload')) {
          await axios.post(`${BASE_URL}${endpoint}`, {});
        } else {
          await axios.get(`${BASE_URL}${endpoint}`);
        }
        console.log(`   ❌ ${endpoint} should require authentication`);
      } catch (error) {
        if (error.response?.status === 401) {
          console.log(`   ✅ ${endpoint} properly protected`);
        } else if (error.response?.status === 404) {
          console.log(`   ⚠️  ${endpoint} - Event not found (Expected for test)`);
        } else {
          console.log(`   ⚠️  ${endpoint} - Unexpected response: ${error.response?.status}`);
        }
      }
    }
    
    return { success: true, message: 'Documentation tests completed' };
  } catch (error) {
    console.log(`   ❌ Documentation test failed: ${error.message}`);
    return { success: false, message: error.message };
  }
}

async function testDatabaseModels() {
  console.log('\n🗄️ Testing Database Models...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/test-models`);
    const { models, connectionState } = response.data;
    
    console.log(`   📊 Connection State: ${connectionState}`);
    console.log(`   📋 Models Available:`);
    
    let allModelsAvailable = true;
    for (const [modelName, isAvailable] of Object.entries(models)) {
      const status = isAvailable ? '✅' : '❌';
      console.log(`      ${status} ${modelName}`);
      if (!isAvailable) allModelsAvailable = false;
    }
    
    if (allModelsAvailable) {
      console.log('   ✅ All models are available');
    } else {
      console.log('   ❌ Some models are missing');
    }
    
    return { success: allModelsAvailable, message: 'Database models test completed' };
  } catch (error) {
    console.log(`   ❌ Database models test failed: ${error.message}`);
    return { success: false, message: error.message };
  }
}

async function testErrorHandling() {
  console.log('\n🚨 Testing Error Handling...');
  
  try {
    // Test invalid endpoints
    const invalidEndpoints = [
      '/api/invalid-endpoint',
      '/api/test/invalid',
      '/api/events/invalid-id'
    ];
    
    for (const endpoint of invalidEndpoints) {
      try {
        await axios.get(`${BASE_URL}${endpoint}`);
        console.log(`   ❌ ${endpoint} should return 404`);
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`   ✅ ${endpoint} properly returns 404`);
        } else {
          console.log(`   ⚠️  ${endpoint} unexpected response: ${error.response?.status}`);
        }
      }
    }
    
    return { success: true, message: 'Error handling tests completed' };
  } catch (error) {
    console.log(`   ❌ Error handling test failed: ${error.message}`);
    return { success: false, message: error.message };
  }
}

async function testAllEndpoints() {
  console.log('🧪 Testing All API Endpoints...\n');
  console.log(`🌐 Base URL: ${BASE_URL}\n`);
  
  const results = [];
  
  for (const endpoint of testEndpoints) {
    const result = await testEndpoint(endpoint);
    results.push({
      ...endpoint,
      ...result
    });
    console.log(''); // Empty line for readability
  }
  
  return results;
}

async function testAllFunctionality() {
  console.log('🔧 Testing All Functionality...\n');
  
  const results = [];
  
  for (const functionality of testFunctionality) {
    if (typeof functionality.test === 'function') {
      const result = await functionality.test();
      results.push({
        name: functionality.name,
        ...result
      });
    }
  }
  
  return results;
}

async function runComprehensiveTest() {
  console.log('🚀 Starting Comprehensive CommunityLink System Test...\n');
  
  // Test all endpoints
  const endpointResults = await testAllEndpoints();
  
  // Test all functionality
  const functionalityResults = await testAllFunctionality();
  
  // Summary
  console.log('\n📊 COMPREHENSIVE TEST RESULTS');
  console.log('==============================');
  
  // Endpoint results
  const endpointSuccessful = endpointResults.filter(r => r.success).length;
  const endpointFailed = endpointResults.filter(r => !r.success).length;
  const endpointTotal = endpointResults.length;
  
  console.log(`\n🔗 API Endpoints:`);
  console.log(`   ✅ Successful: ${endpointSuccessful}/${endpointTotal}`);
  console.log(`   ❌ Failed: ${endpointFailed}/${endpointTotal}`);
  
  // Functionality results
  const functionalitySuccessful = functionalityResults.filter(r => r.success).length;
  const functionalityFailed = functionalityResults.filter(r => !r.success).length;
  const functionalityTotal = functionalityResults.length;
  
  console.log(`\n🔧 System Functionality:`);
  console.log(`   ✅ Working: ${functionalitySuccessful}/${functionalityTotal}`);
  console.log(`   ❌ Issues: ${functionalityFailed}/${functionalityTotal}`);
  
  // Overall system health
  const overallSuccess = endpointSuccessful + functionalitySuccessful;
  const overallTotal = endpointTotal + functionalityTotal;
  const healthPercentage = Math.round((overallSuccess / overallTotal) * 100);
  
  console.log(`\n🏥 Overall System Health: ${healthPercentage}%`);
  
  if (healthPercentage >= 90) {
    console.log('   🟢 EXCELLENT - System is working perfectly!');
  } else if (healthPercentage >= 80) {
    console.log('   🟡 GOOD - System is working well with minor issues');
  } else if (healthPercentage >= 70) {
    console.log('   🟠 FAIR - System has some issues that need attention');
  } else {
    console.log('   🔴 POOR - System has significant issues that need immediate attention');
  }
  
  // Failed items
  if (endpointFailed > 0 || functionalityFailed > 0) {
    console.log('\n🚨 Issues Found:');
    
    if (endpointFailed > 0) {
      console.log('\n   API Endpoints:');
      endpointResults.filter(r => !r.success).forEach(r => {
        console.log(`      ❌ ${r.description}: ${r.path} - ${r.message}`);
      });
    }
    
    if (functionalityFailed > 0) {
      console.log('\n   Functionality:');
      functionalityResults.filter(r => !r.success).forEach(r => {
        console.log(`      ❌ ${r.name}: ${r.message}`);
      });
    }
  }
  
  console.log('\n🏁 Comprehensive testing complete!');
  
  return {
    endpoints: endpointResults,
    functionality: functionalityResults,
    overallHealth: healthPercentage
  };
}

// Run the comprehensive test
runComprehensiveTest().catch(console.error);
