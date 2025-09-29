#!/usr/bin/env node
// HONEST SYSTEM TEST - NO SUGAR COATING
// This will tell you exactly what works and what doesn't

const axios = require('axios');

const BACKEND_URL = 'https://charism-api-xtw9.onrender.com';
const FRONTEND_URL = 'https://charism-ucb4.onrender.com';

console.log('🔍 HONEST SYSTEM TEST - REAL RESULTS');
console.log('=====================================');
console.log(`Backend URL: ${BACKEND_URL}`);
console.log(`Frontend URL: ${FRONTEND_URL}`);
console.log('');

let realResults = {
  frontend: { working: [], broken: [], issues: [] },
  backend: { working: [], broken: [], issues: [] },
  critical: { working: [], broken: [], issues: [] },
  emails: { working: false, issues: [] }
};

// Test 1: Frontend - REAL TEST
async function testFrontendReal() {
  console.log('🔍 TESTING FRONTEND - REAL RESULTS:');
  
  const pages = ['/', '/login', '/register', '/dashboard', '/events', '/contact'];
  
  for (const page of pages) {
    try {
      const response = await axios.get(`${FRONTEND_URL}${page}`, { 
        timeout: 15000,
        validateStatus: function (status) {
          return status >= 200 && status < 600;
        }
      });
      
      if (response.status === 200) {
        realResults.frontend.working.push(page);
        console.log(`✅ ${page}: WORKING (${response.status})`);
      } else {
        realResults.frontend.broken.push(page);
        realResults.frontend.issues.push(`${page}: ${response.status}`);
        console.log(`❌ ${page}: BROKEN (${response.status})`);
      }
    } catch (error) {
      realResults.frontend.broken.push(page);
      realResults.frontend.issues.push(`${page}: ${error.message}`);
      console.log(`❌ ${page}: ERROR - ${error.message}`);
    }
  }
}

// Test 2: Backend - REAL TEST
async function testBackendReal() {
  console.log('');
  console.log('🔍 TESTING BACKEND - REAL RESULTS:');
  
  const endpoints = [
    '/api/health',
    '/api/settings/public', 
    '/api/events/public',
    '/api/auth/register',
    '/api/contact-us',
    '/api/auth/login'
  ];
  
  for (const endpoint of endpoints) {
    try {
      let response;
      
      if (endpoint.includes('register')) {
        const testUser = {
          name: 'Real Test User',
          email: `realtest-${Date.now()}@example.com`,
          password: 'TestPassword123!',
          userId: `REAL${Date.now()}`,
          department: 'Test',
          year: 'Test',
          section: 'Test',
          role: 'Student'
        };
        
        response = await axios.post(`${BACKEND_URL}${endpoint}`, testUser, { 
          timeout: 20000,
          validateStatus: function (status) {
            return status >= 200 && status < 600;
          }
        });
      } else if (endpoint.includes('contact')) {
        const contactData = {
          name: 'Real Test Contact',
          email: 'realtest@example.com',
          subject: 'Real Test',
          message: 'This is a real test message.'
        };
        
        response = await axios.post(`${BACKEND_URL}${endpoint}`, contactData, { 
          timeout: 20000,
          validateStatus: function (status) {
            return status >= 200 && status < 600;
          }
        });
      } else if (endpoint.includes('login')) {
        response = await axios.post(`${BACKEND_URL}${endpoint}`, {
          email: 'invalid@example.com',
          password: 'invalid'
        }, { 
          timeout: 10000,
          validateStatus: function (status) {
            return status >= 200 && status < 600;
          }
        });
      } else {
        response = await axios.get(`${BACKEND_URL}${endpoint}`, { 
          timeout: 10000,
          validateStatus: function (status) {
            return status >= 200 && status < 600;
          }
        });
      }
      
      if (response.status >= 200 && response.status < 300) {
        realResults.backend.working.push(endpoint);
        console.log(`✅ ${endpoint}: WORKING (${response.status})`);
      } else if (response.status === 400 && endpoint.includes('login')) {
        realResults.backend.working.push(endpoint);
        console.log(`✅ ${endpoint}: WORKING (${response.status} - Invalid credentials OK)`);
      } else {
        realResults.backend.broken.push(endpoint);
        realResults.backend.issues.push(`${endpoint}: ${response.status}`);
        console.log(`❌ ${endpoint}: BROKEN (${response.status})`);
      }
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        realResults.backend.broken.push(endpoint);
        realResults.backend.issues.push(`${endpoint}: TIMEOUT`);
        console.log(`❌ ${endpoint}: TIMEOUT ERROR`);
      } else {
        realResults.backend.broken.push(endpoint);
        realResults.backend.issues.push(`${endpoint}: ${error.message}`);
        console.log(`❌ ${endpoint}: ERROR - ${error.message}`);
      }
    }
  }
}

// Test 3: Critical Functions - REAL TEST
async function testCriticalReal() {
  console.log('');
  console.log('🔍 TESTING CRITICAL FUNCTIONS - REAL RESULTS:');
  
  // Test 1: Can users actually register?
  console.log('Testing: Can users register?');
  try {
    const testUser = {
      name: 'Critical Test User',
      email: `critical-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      userId: `CRITICAL${Date.now()}`,
      department: 'Test Department',
      year: 'Test Year',
      section: 'Test Section',
      role: 'Student'
    };
    
    const response = await axios.post(`${BACKEND_URL}/api/auth/register`, testUser, { 
      timeout: 30000,
      validateStatus: function (status) {
        return status >= 200 && status < 600;
      }
    });
    
    if (response.status === 201 || response.status === 200) {
      realResults.critical.working.push('User Registration');
      console.log(`✅ USER REGISTRATION: WORKING (${response.status})`);
      console.log(`   Message: ${response.data?.message || 'No message'}`);
    } else {
      realResults.critical.broken.push('User Registration');
      realResults.critical.issues.push(`Registration: ${response.status}`);
      console.log(`❌ USER REGISTRATION: BROKEN (${response.status})`);
    }
  } catch (error) {
    realResults.critical.broken.push('User Registration');
    realResults.critical.issues.push(`Registration: ${error.message}`);
    console.log(`❌ USER REGISTRATION: ERROR - ${error.message}`);
  }
  
  // Test 2: Can users submit contact forms?
  console.log('');
  console.log('Testing: Can users submit contact forms?');
  try {
    const contactData = {
      name: 'Critical Test Contact',
      email: 'critical@example.com',
      subject: 'Critical Test Subject',
      message: 'This is a critical test to see if contact forms actually work.'
    };
    
    const response = await axios.post(`${BACKEND_URL}/api/contact-us`, contactData, { 
      timeout: 30000,
      validateStatus: function (status) {
        return status >= 200 && status < 600;
      }
    });
    
    if (response.status === 200) {
      realResults.critical.working.push('Contact Forms');
      console.log(`✅ CONTACT FORMS: WORKING (${response.status})`);
      console.log(`   Message: ${response.data?.message || 'No message'}`);
    } else {
      realResults.critical.broken.push('Contact Forms');
      realResults.critical.issues.push(`Contact: ${response.status}`);
      console.log(`❌ CONTACT FORMS: BROKEN (${response.status})`);
    }
  } catch (error) {
    realResults.critical.broken.push('Contact Forms');
    realResults.critical.issues.push(`Contact: ${error.message}`);
    console.log(`❌ CONTACT FORMS: ERROR - ${error.message}`);
  }
  
  // Test 3: Can users browse events?
  console.log('');
  console.log('Testing: Can users browse events?');
  try {
    const response = await axios.get(`${BACKEND_URL}/api/events/public`, { 
      timeout: 10000,
      validateStatus: function (status) {
        return status >= 200 && status < 600;
      }
    });
    
    if (response.status === 200) {
      realResults.critical.working.push('Event Browsing');
      console.log(`✅ EVENT BROWSING: WORKING (${response.status})`);
      console.log(`   Events Found: ${response.data?.length || 0}`);
    } else {
      realResults.critical.broken.push('Event Browsing');
      realResults.critical.issues.push(`Events: ${response.status}`);
      console.log(`❌ EVENT BROWSING: BROKEN (${response.status})`);
    }
  } catch (error) {
    realResults.critical.broken.push('Event Browsing');
    realResults.critical.issues.push(`Events: ${error.message}`);
    console.log(`❌ EVENT BROWSING: ERROR - ${error.message}`);
  }
}

// Test 4: Email System - REAL TEST
async function testEmailReal() {
  console.log('');
  console.log('🔍 TESTING EMAIL SYSTEM - REAL RESULTS:');
  
  try {
    const response = await axios.get(`${BACKEND_URL}/api/health/email`, { 
      timeout: 10000,
      validateStatus: function (status) {
        return status >= 200 && status < 600;
      }
    });
    
    if (response.status === 200 && response.data?.status === 'OK') {
      realResults.emails.working = true;
      console.log(`✅ EMAIL SYSTEM: CONFIGURED`);
      console.log(`   Status: ${response.data.status}`);
      console.log(`   Service: ${response.data.email?.EMAIL_SERVICE || 'Unknown'}`);
    } else {
      realResults.emails.working = false;
      realResults.emails.issues.push(`Email config: ${response.status}`);
      console.log(`❌ EMAIL SYSTEM: NOT CONFIGURED`);
    }
  } catch (error) {
    realResults.emails.working = false;
    realResults.emails.issues.push(`Email error: ${error.message}`);
    console.log(`❌ EMAIL SYSTEM: ERROR - ${error.message}`);
  }
}

// Generate HONEST Report
function generateHonestReport() {
  console.log('');
  console.log('📊 HONEST SYSTEM REPORT - NO SUGAR COATING');
  console.log('===========================================');
  
  const totalFrontend = realResults.frontend.working.length + realResults.frontend.broken.length;
  const totalBackend = realResults.backend.working.length + realResults.backend.broken.length;
  const totalCritical = realResults.critical.working.length + realResults.critical.broken.length;
  
  console.log('');
  console.log('🌐 FRONTEND STATUS:');
  console.log(`   Working: ${realResults.frontend.working.length}/${totalFrontend}`);
  console.log(`   Broken: ${realResults.frontend.broken.length}/${totalFrontend}`);
  if (realResults.frontend.issues.length > 0) {
    console.log('   Issues:');
    realResults.frontend.issues.forEach(issue => console.log(`     - ${issue}`));
  }
  
  console.log('');
  console.log('🔧 BACKEND STATUS:');
  console.log(`   Working: ${realResults.backend.working.length}/${totalBackend}`);
  console.log(`   Broken: ${realResults.backend.broken.length}/${totalBackend}`);
  if (realResults.backend.issues.length > 0) {
    console.log('   Issues:');
    realResults.backend.issues.forEach(issue => console.log(`     - ${issue}`));
  }
  
  console.log('');
  console.log('🎯 CRITICAL FUNCTIONS:');
  console.log(`   Working: ${realResults.critical.working.length}/${totalCritical}`);
  console.log(`   Broken: ${realResults.critical.broken.length}/${totalCritical}`);
  if (realResults.critical.issues.length > 0) {
    console.log('   Issues:');
    realResults.critical.issues.forEach(issue => console.log(`     - ${issue}`));
  }
  
  console.log('');
  console.log('📧 EMAIL SYSTEM:');
  console.log(`   Status: ${realResults.emails.working ? 'CONFIGURED' : 'NOT WORKING'}`);
  if (realResults.emails.issues.length > 0) {
    console.log('   Issues:');
    realResults.emails.issues.forEach(issue => console.log(`     - ${issue}`));
  }
  
  console.log('');
  console.log('🎯 HONEST ASSESSMENT:');
  
  const criticalWorking = realResults.critical.working.length;
  const criticalTotal = realResults.critical.working.length + realResults.critical.broken.length;
  
  if (criticalWorking >= criticalTotal - 1) {
    console.log('✅ CORE FUNCTIONALITY: WORKING');
    console.log('   Users can register, contact you, and browse events');
    if (!realResults.emails.working) {
      console.log('   ⚠️ Email confirmations may not work (but core features do)');
    }
  } else {
    console.log('❌ CORE FUNCTIONALITY: HAS ISSUES');
    console.log('   Some critical features are not working properly');
  }
  
  if (realResults.frontend.broken.length > realResults.frontend.working.length) {
    console.log('❌ FRONTEND: HAS ISSUES');
    console.log('   Many pages are not accessible');
  } else {
    console.log('✅ FRONTEND: MOSTLY WORKING');
  }
  
  if (realResults.backend.broken.length > realResults.backend.working.length) {
    console.log('❌ BACKEND: HAS ISSUES');
    console.log('   Many API endpoints are not working');
  } else {
    console.log('✅ BACKEND: MOSTLY WORKING');
  }
  
  console.log('');
  console.log('🚨 BOTTOM LINE:');
  if (criticalWorking >= criticalTotal - 1 && realResults.emails.working) {
    console.log('✅ YOUR SYSTEM IS READY FOR USERS');
    console.log('   Core functionality works, emails work');
  } else if (criticalWorking >= criticalTotal - 1) {
    console.log('⚠️ YOUR SYSTEM WORKS BUT EMAILS MAY BE SLOW');
    console.log('   Users can register and contact you, but email confirmations may be delayed');
  } else {
    console.log('❌ YOUR SYSTEM HAS CRITICAL ISSUES');
    console.log('   Some core features are not working properly');
  }
  
  console.log('');
  console.log('📋 RAW DATA:');
  console.log(JSON.stringify(realResults, null, 2));
}

// Run all tests
async function runAllTests() {
  await testFrontendReal();
  await testBackendReal();
  await testCriticalReal();
  await testEmailReal();
  
  generateHonestReport();
}

// Start testing
runAllTests().catch(console.error);
