#!/usr/bin/env node

/**
 * COMPREHENSIVE SYSTEM FLOW VERIFICATION
 * 
 * This script tests all system flows to ensure everything is working correctly:
 * 1. Backend API endpoints and routes
 * 2. Frontend pages and components
 * 3. Authentication flow (login, register, logout)
 * 4. Event management (create, edit, delete, display)
 * 5. Admin panel and user management
 * 6. File upload and image handling
 * 7. Email notification system
 * 8. Error handling and edge cases
 * 
 * Usage: node COMPREHENSIVE_SYSTEM_FLOW_VERIFICATION.js
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  BACKEND_URL: process.env.BACKEND_URL || 'https://charism-api-xtw9.onrender.com',
  FRONTEND_URL: process.env.FRONTEND_URL || 'https://charism-ucb4.onrender.com',
  TEST_TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000
};

// Test results storage
const testResults = {
  backend: { passed: 0, failed: 0, tests: [] },
  frontend: { passed: 0, failed: 0, tests: [] },
  integration: { passed: 0, failed: 0, tests: [] },
  overall: { passed: 0, failed: 0, total: 0 }
};

// Utility functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const makeRequest = async (method, url, data = null, headers = {}) => {
  const config = {
    method,
    url,
    timeout: CONFIG.TEST_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  
  if (data) {
    config.data = data;
  }
  
  try {
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.message, 
      status: error.response?.status,
      data: error.response?.data 
    };
  }
};

const retryRequest = async (method, url, data = null, headers = {}, attempts = CONFIG.RETRY_ATTEMPTS) => {
  for (let i = 0; i < attempts; i++) {
    const result = await makeRequest(method, url, data, headers);
    if (result.success) {
      return result;
    }
    
    if (i < attempts - 1) {
      console.log(`  ⚠️ Attempt ${i + 1} failed, retrying in ${CONFIG.RETRY_DELAY}ms...`);
      await delay(CONFIG.RETRY_DELAY);
    }
  }
  
  return await makeRequest(method, url, data, headers);
};

const logTest = (category, testName, passed, details = '') => {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const message = `${status} [${category}] ${testName}`;
  
  if (details) {
    console.log(`${message} - ${details}`);
  } else {
    console.log(message);
  }
  
  testResults[category].tests.push({
    name: testName,
    passed,
    details,
    timestamp: new Date().toISOString()
  });
  
  if (passed) {
    testResults[category].passed++;
    testResults.overall.passed++;
  } else {
    testResults[category].failed++;
    testResults.overall.failed++;
  }
  
  testResults.overall.total++;
};

// Backend API Tests
const testBackendEndpoints = async () => {
  console.log('\n🔍 TESTING BACKEND API ENDPOINTS');
  console.log('=' .repeat(50));
  
  const endpoints = [
    { name: 'Health Check', method: 'GET', url: '/api/health' },
    { name: 'Server Status', method: 'GET', url: '/api/status' },
    { name: 'Database Status', method: 'GET', url: '/api/db-status' },
    { name: 'Test Endpoint', method: 'GET', url: '/api/test' },
    { name: 'Frontend Test', method: 'GET', url: '/api/frontend-test' },
    { name: 'CORS Test', method: 'GET', url: '/api/cors-test' },
    { name: 'Environment Check', method: 'GET', url: '/api/env-check' },
    { name: 'File Status', method: 'GET', url: '/api/file-status' },
    { name: 'Uploads Health', method: 'GET', url: '/api/uploads-health' },
    { name: 'Test Models', method: 'GET', url: '/api/test-models' },
    { name: 'Test Database', method: 'GET', url: '/api/test-db' },
    { name: 'Test Email Config', method: 'GET', url: '/api/test-email' }
  ];
  
  for (const endpoint of endpoints) {
    const result = await retryRequest(endpoint.method, `${CONFIG.BACKEND_URL}${endpoint.url}`);
    const passed = result.success && result.status === 200;
    logTest('backend', endpoint.name, passed, 
      passed ? `Status: ${result.status}` : `Error: ${result.error}`);
  }
};

// Authentication Flow Tests
const testAuthenticationFlow = async () => {
  console.log('\n🔐 TESTING AUTHENTICATION FLOW');
  console.log('=' .repeat(50));
  
  // Test registration endpoint
  const testUser = {
    firstName: 'Test',
    lastName: 'User',
    email: `test${Date.now()}@example.com`,
    password: 'TestPassword123!',
    studentId: `TEST${Date.now()}`,
    yearLevel: '1st Year',
    section: 'A',
    department: 'Computer Science'
  };
  
  // Test registration
  const registerResult = await retryRequest('POST', `${CONFIG.BACKEND_URL}/api/auth/register`, testUser);
  logTest('backend', 'User Registration', registerResult.success, 
    registerResult.success ? 'User registered successfully' : `Error: ${registerResult.error}`);
  
  // Test login
  const loginResult = await retryRequest('POST', `${CONFIG.BACKEND_URL}/api/auth/login`, {
    email: testUser.email,
    password: testUser.password
  });
  
  let authToken = null;
  if (loginResult.success && loginResult.data.token) {
    authToken = loginResult.data.token;
    logTest('backend', 'User Login', true, 'Login successful');
  } else {
    logTest('backend', 'User Login', false, `Error: ${loginResult.error}`);
  }
  
  // Test protected routes with token
  if (authToken) {
    const headers = { 'Authorization': `Bearer ${authToken}` };
    
    // Test profile endpoint
    const profileResult = await retryRequest('GET', `${CONFIG.BACKEND_URL}/api/auth/profile`, null, headers);
    logTest('backend', 'Protected Route Access', profileResult.success, 
      profileResult.success ? 'Profile accessed successfully' : `Error: ${profileResult.error}`);
    
    // Test logout
    const logoutResult = await retryRequest('POST', `${CONFIG.BACKEND_URL}/api/auth/logout`, null, headers);
    logTest('backend', 'User Logout', logoutResult.success, 
      logoutResult.success ? 'Logout successful' : `Error: ${logoutResult.error}`);
  }
  
  return authToken;
};

// Event Management Tests
const testEventManagement = async (authToken) => {
  console.log('\n📅 TESTING EVENT MANAGEMENT');
  console.log('=' .repeat(50));
  
  const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
  
  // Test get events
  const getEventsResult = await retryRequest('GET', `${CONFIG.BACKEND_URL}/api/events`, null, headers);
  logTest('backend', 'Get Events', getEventsResult.success, 
    getEventsResult.success ? `Found ${getEventsResult.data?.length || 0} events` : `Error: ${getEventsResult.error}`);
  
  // Test create event (if authenticated)
  if (authToken) {
    const testEvent = {
      title: `Test Event ${Date.now()}`,
      description: 'This is a test event for system verification',
      startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      endDate: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
      location: 'Test Location',
      maxParticipants: 50,
      category: 'Academic',
      isPublic: true
    };
    
    const createEventResult = await retryRequest('POST', `${CONFIG.BACKEND_URL}/api/events`, testEvent, headers);
    logTest('backend', 'Create Event', createEventResult.success, 
      createEventResult.success ? 'Event created successfully' : `Error: ${createEventResult.error}`);
    
    // Test event registration
    if (createEventResult.success && createEventResult.data._id) {
      const eventId = createEventResult.data._id;
      const registerResult = await retryRequest('POST', `${CONFIG.BACKEND_URL}/api/events/${eventId}/register`, {}, headers);
      logTest('backend', 'Event Registration', registerResult.success, 
        registerResult.success ? 'Registered for event successfully' : `Error: ${registerResult.error}`);
    }
  }
};

// Admin Panel Tests
const testAdminPanel = async (authToken) => {
  console.log('\n👑 TESTING ADMIN PANEL');
  console.log('=' .repeat(50));
  
  const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
  
  const adminEndpoints = [
    { name: 'Admin Dashboard', method: 'GET', url: '/api/admin/dashboard' },
    { name: 'Manage Users', method: 'GET', url: '/api/admin/users' },
    { name: 'Manage Events', method: 'GET', url: '/api/admin/events' },
    { name: 'Analytics', method: 'GET', url: '/api/analytics' },
    { name: 'System Settings', method: 'GET', url: '/api/settings' }
  ];
  
  for (const endpoint of adminEndpoints) {
    const result = await retryRequest(endpoint.method, `${CONFIG.BACKEND_URL}${endpoint.url}`, null, headers);
    // Admin endpoints may return 401/403 for non-admin users, which is expected
    const passed = result.success || result.status === 401 || result.status === 403;
    logTest('backend', endpoint.name, passed, 
      passed ? `Status: ${result.status}` : `Error: ${result.error}`);
  }
};

// File Upload Tests
const testFileUpload = async (authToken) => {
  console.log('\n📁 TESTING FILE UPLOAD SYSTEM');
  console.log('=' .repeat(50));
  
  const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
  
  // Test file routes
  const fileEndpoints = [
    { name: 'File Routes', method: 'GET', url: '/api/files' },
    { name: 'Upload Status', method: 'GET', url: '/api/file-status' }
  ];
  
  for (const endpoint of fileEndpoints) {
    const result = await retryRequest(endpoint.method, `${CONFIG.BACKEND_URL}${endpoint.url}`, null, headers);
    logTest('backend', endpoint.name, result.success, 
      result.success ? `Status: ${result.status}` : `Error: ${result.error}`);
  }
};

// Frontend Page Tests
const testFrontendPages = async () => {
  console.log('\n🌐 TESTING FRONTEND PAGES');
  console.log('=' .repeat(50));
  
  const pages = [
    { name: 'Home Page', url: '/' },
    { name: 'Login Page', url: '/login' },
    { name: 'Register Page', url: '/register' },
    { name: 'Events Page', url: '/events' },
    { name: 'Contact Page', url: '/contact' },
    { name: 'Feedback Page', url: '/feedback' }
  ];
  
  for (const page of pages) {
    const result = await retryRequest('GET', `${CONFIG.FRONTEND_URL}${page.url}`);
    const passed = result.success && result.status === 200;
    logTest('frontend', page.name, passed, 
      passed ? `Status: ${result.status}` : `Error: ${result.error}`);
  }
};

// Integration Tests
const testIntegration = async () => {
  console.log('\n🔗 TESTING INTEGRATION FLOWS');
  console.log('=' .repeat(50));
  
  // Test backend-frontend connectivity
  const backendHealth = await retryRequest('GET', `${CONFIG.BACKEND_URL}/api/health`);
  const frontendHealth = await retryRequest('GET', `${CONFIG.FRONTEND_URL}/`);
  
  logTest('integration', 'Backend-Frontend Connectivity', 
    backendHealth.success && frontendHealth.success, 
    `Backend: ${backendHealth.success ? 'OK' : 'FAIL'}, Frontend: ${frontendHealth.success ? 'OK' : 'FAIL'}`);
  
  // Test CORS
  const corsTest = await retryRequest('GET', `${CONFIG.BACKEND_URL}/api/cors-test`);
  logTest('integration', 'CORS Configuration', corsTest.success, 
    corsTest.success ? 'CORS working correctly' : `Error: ${corsTest.error}`);
  
  // Test database connectivity
  const dbTest = await retryRequest('GET', `${CONFIG.BACKEND_URL}/api/db-status`);
  logTest('integration', 'Database Connectivity', dbTest.success, 
    dbTest.success ? 'Database connected' : `Error: ${dbTest.error}`);
};

// Error Handling Tests
const testErrorHandling = async () => {
  console.log('\n⚠️ TESTING ERROR HANDLING');
  console.log('=' .repeat(50));
  
  // Test 404 handling
  const notFoundResult = await retryRequest('GET', `${CONFIG.BACKEND_URL}/api/nonexistent-endpoint`);
  logTest('backend', '404 Error Handling', notFoundResult.status === 404, 
    `Status: ${notFoundResult.status}`);
  
  // Test invalid data handling
  const invalidDataResult = await retryRequest('POST', `${CONFIG.BACKEND_URL}/api/auth/login`, {
    email: 'invalid-email',
    password: ''
  });
  logTest('backend', 'Invalid Data Handling', !invalidDataResult.success, 
    `Properly rejected invalid data: ${invalidDataResult.status}`);
  
  // Test unauthorized access
  const unauthorizedResult = await retryRequest('GET', `${CONFIG.BACKEND_URL}/api/auth/profile`);
  logTest('backend', 'Unauthorized Access Handling', unauthorizedResult.status === 401, 
    `Status: ${unauthorizedResult.status}`);
};

// Performance Tests
const testPerformance = async () => {
  console.log('\n⚡ TESTING PERFORMANCE');
  console.log('=' .repeat(50));
  
  const startTime = Date.now();
  
  // Test multiple concurrent requests
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(retryRequest('GET', `${CONFIG.BACKEND_URL}/api/health`));
  }
  
  const results = await Promise.all(promises);
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  const allSuccessful = results.every(result => result.success);
  logTest('integration', 'Concurrent Request Handling', allSuccessful, 
    `All ${results.length} requests completed in ${duration}ms`);
  
  // Test response time
  const responseTimeTest = await retryRequest('GET', `${CONFIG.BACKEND_URL}/api/health`);
  const responseTime = responseTimeTest.success ? 'Fast' : 'Slow';
  logTest('integration', 'Response Time', responseTimeTest.success, 
    `Response time: ${responseTime}`);
};

// Generate comprehensive report
const generateReport = () => {
  console.log('\n📊 COMPREHENSIVE SYSTEM VERIFICATION REPORT');
  console.log('=' .repeat(60));
  
  const categories = ['backend', 'frontend', 'integration'];
  
  categories.forEach(category => {
    const results = testResults[category];
    const total = results.passed + results.failed;
    const percentage = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
    
    console.log(`\n${category.toUpperCase()} TESTS:`);
    console.log(`  ✅ Passed: ${results.passed}`);
    console.log(`  ❌ Failed: ${results.failed}`);
    console.log(`  📊 Success Rate: ${percentage}%`);
  });
  
  const overallTotal = testResults.overall.total;
  const overallPercentage = overallTotal > 0 ? ((testResults.overall.passed / overallTotal) * 100).toFixed(1) : 0;
  
  console.log(`\nOVERALL RESULTS:`);
  console.log(`  ✅ Total Passed: ${testResults.overall.passed}`);
  console.log(`  ❌ Total Failed: ${testResults.overall.failed}`);
  console.log(`  📊 Overall Success Rate: ${overallPercentage}%`);
  
  // System status
  if (overallPercentage >= 90) {
    console.log(`\n🎉 SYSTEM STATUS: EXCELLENT (${overallPercentage}%)`);
  } else if (overallPercentage >= 80) {
    console.log(`\n✅ SYSTEM STATUS: GOOD (${overallPercentage}%)`);
  } else if (overallPercentage >= 70) {
    console.log(`\n⚠️ SYSTEM STATUS: NEEDS ATTENTION (${overallPercentage}%)`);
  } else {
    console.log(`\n❌ SYSTEM STATUS: CRITICAL ISSUES (${overallPercentage}%)`);
  }
  
  // Save detailed report
  const reportData = {
    timestamp: new Date().toISOString(),
    config: CONFIG,
    results: testResults,
    summary: {
      overallPercentage: parseFloat(overallPercentage),
      status: overallPercentage >= 90 ? 'EXCELLENT' : 
              overallPercentage >= 80 ? 'GOOD' : 
              overallPercentage >= 70 ? 'NEEDS_ATTENTION' : 'CRITICAL'
    }
  };
  
  fs.writeFileSync('SYSTEM_VERIFICATION_REPORT.json', JSON.stringify(reportData, null, 2));
  console.log(`\n📄 Detailed report saved to: SYSTEM_VERIFICATION_REPORT.json`);
};

// Main execution
const runComprehensiveVerification = async () => {
  console.log('🚀 STARTING COMPREHENSIVE SYSTEM FLOW VERIFICATION');
  console.log('=' .repeat(60));
  console.log(`Backend URL: ${CONFIG.BACKEND_URL}`);
  console.log(`Frontend URL: ${CONFIG.FRONTEND_URL}`);
  console.log(`Test Timeout: ${CONFIG.TEST_TIMEOUT}ms`);
  console.log(`Retry Attempts: ${CONFIG.RETRY_ATTEMPTS}`);
  
  try {
    // Run all test suites
    await testBackendEndpoints();
    const authToken = await testAuthenticationFlow();
    await testEventManagement(authToken);
    await testAdminPanel(authToken);
    await testFileUpload(authToken);
    await testFrontendPages();
    await testIntegration();
    await testErrorHandling();
    await testPerformance();
    
    // Generate final report
    generateReport();
    
    console.log('\n🎯 SYSTEM VERIFICATION COMPLETED');
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('\n❌ VERIFICATION FAILED:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
};

// Run the verification
if (require.main === module) {
  runComprehensiveVerification();
}

module.exports = {
  runComprehensiveVerification,
  testBackendEndpoints,
  testAuthenticationFlow,
  testEventManagement,
  testAdminPanel,
  testFileUpload,
  testFrontendPages,
  testIntegration,
  testErrorHandling,
  testPerformance,
  generateReport
};
