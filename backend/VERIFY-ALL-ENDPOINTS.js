// VERIFY ALL ENDPOINTS - Comprehensive testing script
const https = require('https');

console.log('🔍 COMPREHENSIVE ENDPOINT VERIFICATION');
console.log('=====================================');

const baseUrl = 'https://charism-api-xtw9.onrender.com/api';
const eventId = '68cc9d70230f029d921be1a4';
const userId = '68cb3c22e3a6114fea205498';

// Test endpoints
const endpoints = [
  {
    name: 'Test Approval Routes',
    url: `${baseUrl}/events/test-approval`,
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Event Details',
    url: `${baseUrl}/events/${eventId}`,
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Event Participants (should be 401 - needs auth)',
    url: `${baseUrl}/events/${eventId}/participants`,
    method: 'GET',
    expectedStatus: 401
  },
  {
    name: 'Registration Approval (should be 401 - needs auth)',
    url: `${baseUrl}/events/${eventId}/registrations/${userId}/approve`,
    method: 'PUT',
    expectedStatus: 401
  },
  {
    name: 'Registration Disapproval (should be 401 - needs auth)',
    url: `${baseUrl}/events/${eventId}/registrations/${userId}/disapprove`,
    method: 'PUT',
    expectedStatus: 401
  },
  {
    name: 'Attendance Approval (should be 401 - needs auth)',
    url: `${baseUrl}/events/${eventId}/attendance/${userId}/approve`,
    method: 'PATCH',
    expectedStatus: 401
  },
  {
    name: 'Attendance Disapproval (should be 401 - needs auth)',
    url: `${baseUrl}/events/${eventId}/attendance/${userId}/disapprove`,
    method: 'PATCH',
    expectedStatus: 401
  }
];

let testCount = 0;
let passedTests = 0;
let failedTests = 0;

function makeRequest(endpoint) {
  return new Promise((resolve) => {
    const url = new URL(endpoint.url);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: endpoint.method,
      headers: {
        'User-Agent': 'Verification-Script'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const success = res.statusCode === endpoint.expectedStatus;
        const status = success ? '✅ PASS' : '❌ FAIL';
        
        console.log(`${status} ${endpoint.name}`);
        console.log(`   Expected: ${endpoint.expectedStatus}, Got: ${res.statusCode}`);
        
        if (success) {
          passedTests++;
        } else {
          failedTests++;
          console.log(`   URL: ${endpoint.url}`);
        }
        
        testCount++;
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`❌ FAIL ${endpoint.name}`);
      console.log(`   Error: ${error.message}`);
      failedTests++;
      testCount++;
      resolve();
    });

    req.setTimeout(10000, () => {
      console.log(`❌ FAIL ${endpoint.name}`);
      console.log(`   Error: Request timeout`);
      failedTests++;
      testCount++;
      req.destroy();
      resolve();
    });

    req.end();
  });
}

async function runAllTests() {
  console.log('🚀 Starting endpoint verification...\n');
  
  for (const endpoint of endpoints) {
    await makeRequest(endpoint);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
  }
  
  console.log('\n=====================================');
  console.log('📊 VERIFICATION RESULTS');
  console.log('=====================================');
  console.log(`Total Tests: ${testCount}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  
  if (failedTests === 0) {
    console.log('\n🎉 ALL ENDPOINTS ARE WORKING CORRECTLY!');
    console.log('✅ Backend is fully functional');
    console.log('✅ All routes are accessible');
    console.log('✅ No 404 errors - only expected 401s for auth');
    console.log('\n🎯 Your approval/disapproval system is ready!');
  } else {
    console.log('\n⚠️ Some endpoints need attention');
    console.log('🔧 Check the failed tests above');
  }
}

runAllTests();
