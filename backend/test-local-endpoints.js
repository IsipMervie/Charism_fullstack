// Test local server endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test all endpoints systematically
const testEndpoints = [
  // Health and basic endpoints
  { path: '/api/health', method: 'GET', auth: false, description: 'Health Check' },
  { path: '/api/test-db', method: 'GET', auth: false, description: 'Database Test' },
  { path: '/api/test-models', method: 'GET', auth: false, description: 'Models Test' },
  
  // Public endpoints (no auth required)
  { path: '/api/settings/public/school', method: 'GET', auth: false, description: 'Public School Settings' },
  { path: '/api/settings/public', method: 'GET', auth: false, description: 'Public Settings' },
  { path: '/api/events', method: 'GET', auth: false, description: 'Public Events' },
  { path: '/api/events/health', method: 'GET', auth: false, description: 'Events Health' },
  { path: '/api/feedback/submit', method: 'POST', auth: false, description: 'Submit Feedback' },
  
  // File serving endpoints
  { path: '/api/files/school-logo', method: 'GET', auth: false, description: 'School Logo' },
  { path: '/api/uploads-health', method: 'GET', auth: false, description: 'Uploads Health' },
  
  // Auth endpoints (POST requests)
  { path: '/api/auth/login', method: 'POST', auth: false, description: 'Login Endpoint' },
  { path: '/api/auth/register', method: 'POST', auth: false, description: 'Register Endpoint' },
  
  // Protected endpoints (will return 401 without auth)
  { path: '/api/settings/school', method: 'GET', auth: true, description: 'Protected School Settings' },
  { path: '/api/settings', method: 'GET', auth: true, description: 'Protected Settings' },
  { path: '/api/users', method: 'GET', auth: true, description: 'Users List' },
  { path: '/api/analytics', method: 'GET', auth: true, description: 'Analytics' },
  { path: '/api/admin', method: 'GET', auth: true, description: 'Admin Panel' },
  { path: '/api/reports', method: 'GET', auth: true, description: 'Reports' },
  { path: '/api/certificates', method: 'GET', auth: true, description: 'Certificates' },
  { path: '/api/messages', method: 'GET', auth: true, description: 'Messages' },
  { path: '/api/contact-us', method: 'GET', auth: true, description: 'Contact Us' },
  { path: '/api/academic-years', method: 'GET', auth: true, description: 'Academic Years' },
  { path: '/api/feedback/my-feedback', method: 'GET', auth: true, description: 'My Feedback' }
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

async function testAllEndpoints() {
  console.log('🧪 Testing Local API Endpoints...\n');
  console.log(`🌐 Base URL: ${BASE_URL}\n`);
  
  const results = [];
  
  for (const endpoint of testEndpoints) {
    const result = await testEndpoint(endpoint);
    results.push({
      ...endpoint,
      ...result
    });
    console.log(''); // Add spacing between tests
  }
  
  // Summary
  console.log('📊 Test Results Summary:');
  console.log('========================');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}\n`);
  
  if (failed > 0) {
    console.log('🚨 Failed Endpoints:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`   ❌ ${result.description}: ${result.path} - ${result.message}`);
    });
  }
  
  console.log('\n🏁 Testing complete!');
}

// Run the tests
testAllEndpoints().catch(console.error);
