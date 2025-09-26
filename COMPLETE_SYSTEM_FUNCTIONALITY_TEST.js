#!/usr/bin/env node

/**
 * COMPLETE END-TO-END SYSTEM FUNCTIONALITY TEST
 * Tests every page, flow, and functionality from frontend to backend
 */

const axios = require('axios');
const fs = require('fs');

const CONFIG = {
  BACKEND_URL: 'https://charism-api-xtw9.onrender.com',
  FRONTEND_URL: 'https://charism-ucb4.onrender.com',
  TIMEOUT: 15000
};

const testResults = {
  pages: { passed: 0, failed: 0, tests: [] },
  flows: { passed: 0, failed: 0, tests: [] },
  apis: { passed: 0, failed: 0, tests: [] },
  overall: { passed: 0, failed: 0, total: 0 }
};

const logTest = (category, testName, passed, details = '') => {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} [${category}] ${testName}${details ? ' - ' + details : ''}`);
  
  testResults[category].tests.push({ name: testName, passed, details });
  
  if (passed) {
    testResults[category].passed++;
    testResults.overall.passed++;
  } else {
    testResults[category].failed++;
    testResults.overall.failed++;
  }
  
  testResults.overall.total++;
};

const testPage = async (pageName, url) => {
  try {
    const response = await axios.get(url, { timeout: CONFIG.TIMEOUT });
    const passed = response.status === 200;
    logTest('pages', pageName, passed, `Status: ${response.status}`);
    return passed;
  } catch (error) {
    logTest('pages', pageName, false, `Error: ${error.message}`);
    return false;
  }
};

const testAPI = async (apiName, method, url, data = null, headers = {}) => {
  try {
    const config = { method, url, timeout: CONFIG.TIMEOUT, headers };
    if (data) config.data = data;
    
    const response = await axios(config);
    const passed = response.status >= 200 && response.status < 300;
    logTest('apis', apiName, passed, `Status: ${response.status}`);
    return { success: passed, data: response.data, status: response.status };
  } catch (error) {
    const status = error.response?.status || 'ERROR';
    logTest('apis', apiName, false, `Error: ${error.message} (${status})`);
    return { success: false, error: error.message, status };
  }
};

const runCompleteSystemTest = async () => {
  console.log('🚀 COMPLETE END-TO-END SYSTEM FUNCTIONALITY TEST');
  console.log('=' .repeat(60));
  console.log(`Testing: ${CONFIG.FRONTEND_URL} → ${CONFIG.BACKEND_URL}`);
  
  // Test all frontend pages
  console.log('\n📄 TESTING ALL FRONTEND PAGES');
  console.log('=' .repeat(40));
  
  const pages = [
    ['Home Page', '/'],
    ['Login Page', '/login'],
    ['Register Page', '/register'],
    ['Events List', '/events'],
    ['Contact Page', '/contact'],
    ['Feedback Page', '/feedback'],
    ['Simple Events', '/simple-events'],
    ['Event Chat List', '/event-chat'],
    ['Forgot Password', '/forgot-password'],
    ['Admin Dashboard', '/admin/dashboard'],
    ['Staff Dashboard', '/staff/dashboard'],
    ['Student Dashboard', '/student/dashboard'],
    ['Create Event', '/admin/create-event'],
    ['Manage Events', '/admin/manage-events'],
    ['Manage Users', '/admin/manage-users'],
    ['Analytics', '/analytics'],
    ['Settings', '/settings'],
    ['Profile', '/profile'],
    ['My Participation', '/my-participation'],
    ['Student Documentation', '/student-documentation'],
    ['Registration Management', '/admin/registration-management'],
    ['Registration Approvals', '/admin/registration-approvals'],
    ['Staff Approvals', '/admin/staff-approvals'],
    ['Students 40 Hours', '/students-40-hours'],
    ['Students By Year', '/students-by-year'],
    ['Admin View Documentation', '/admin/student-documentation'],
    ['Staff Attendance', '/staff/attendance'],
    ['Staff Create Event', '/staff/create-event'],
    ['Staff Documentation', '/staff/student-documentation'],
    ['Change Password', '/change-password']
  ];
  
  for (const [pageName, path] of pages) {
    await testPage(pageName, `${CONFIG.FRONTEND_URL}${path}`);
  }
  
  // Test all backend API endpoints
  console.log('\n🔌 TESTING ALL BACKEND API ENDPOINTS');
  console.log('=' .repeat(40));
  
  const apiEndpoints = [
    // Health and Status
    ['Health Check', 'GET', '/api/health'],
    ['Server Status', 'GET', '/api/status'],
    ['Database Status', 'GET', '/api/db-status'],
    ['Test Endpoint', 'GET', '/api/test'],
    ['Frontend Test', 'GET', '/api/frontend-test'],
    ['CORS Test', 'GET', '/api/cors-test'],
    ['Environment Check', 'GET', '/api/env-check'],
    ['File Status', 'GET', '/api/file-status'],
    ['Uploads Health', 'GET', '/api/uploads-health'],
    ['Test Models', 'GET', '/api/test-models'],
    ['Test Database', 'GET', '/api/test-db'],
    ['Test Email Config', 'GET', '/api/test-email'],
    
    // Authentication APIs
    ['Auth Register', 'POST', '/api/auth/register'],
    ['Auth Login', 'POST', '/api/auth/login'],
    ['Auth Logout', 'POST', '/api/auth/logout'],
    ['Auth Profile', 'GET', '/api/auth/profile'],
    ['Auth Verify Email', 'POST', '/api/auth/verify-email'],
    ['Auth Forgot Password', 'POST', '/api/auth/forgot-password'],
    ['Auth Reset Password', 'POST', '/api/auth/reset-password'],
    ['Auth Change Password', 'POST', '/api/auth/change-password'],
    
    // Event APIs
    ['Events List', 'GET', '/api/events'],
    ['Events Create', 'POST', '/api/events'],
    ['Events Update', 'PUT', '/api/events/:id'],
    ['Events Delete', 'DELETE', '/api/events/:id'],
    ['Event Register', 'POST', '/api/events/:id/register'],
    ['Event Unregister', 'DELETE', '/api/events/:id/unregister'],
    ['Event Participants', 'GET', '/api/events/:id/participants'],
    ['Event Approve Registration', 'PUT', '/api/events/:id/registrations/:userId/approve'],
    ['Event Disapprove Registration', 'PUT', '/api/events/:id/registrations/:userId/disapprove'],
    
    // User APIs
    ['Users List', 'GET', '/api/users'],
    ['User Profile', 'GET', '/api/users/:id'],
    ['User Update', 'PUT', '/api/users/:id'],
    ['User Delete', 'DELETE', '/api/users/:id'],
    ['User Approve', 'PUT', '/api/users/:id/approve'],
    ['User Disapprove', 'PUT', '/api/users/:id/disapprove'],
    
    // Admin APIs
    ['Admin Dashboard', 'GET', '/api/admin/dashboard'],
    ['Admin Users', 'GET', '/api/admin/users'],
    ['Admin Events', 'GET', '/api/admin/events'],
    ['Admin Analytics', 'GET', '/api/analytics'],
    ['Admin Settings', 'GET', '/api/settings'],
    ['Admin Settings Update', 'PUT', '/api/settings'],
    
    // File APIs
    ['File Upload', 'POST', '/api/files/upload'],
    ['File Download', 'GET', '/api/files/:id'],
    ['File Delete', 'DELETE', '/api/files/:id'],
    
    // Message APIs
    ['Messages List', 'GET', '/api/messages'],
    ['Message Create', 'POST', '/api/messages'],
    ['Message Update', 'PUT', '/api/messages/:id'],
    ['Message Delete', 'DELETE', '/api/messages/:id'],
    
    // Feedback APIs
    ['Feedback List', 'GET', '/api/feedback'],
    ['Feedback Create', 'POST', '/api/feedback'],
    ['Feedback Update', 'PUT', '/api/feedback/:id'],
    ['Feedback Delete', 'DELETE', '/api/feedback/:id'],
    
    // Event Chat APIs
    ['Event Chat Messages', 'GET', '/api/event-chat/:eventId/messages'],
    ['Event Chat Send', 'POST', '/api/event-chat/:eventId/messages'],
    ['Event Chat Upload', 'POST', '/api/event-chat/:eventId/upload'],
    
    // Contact APIs
    ['Contact Submit', 'POST', '/api/contact-us'],
    
    // Reports APIs
    ['Reports Generate', 'GET', '/api/reports'],
    
    // Certificates APIs
    ['Certificates List', 'GET', '/api/certificates'],
    ['Certificate Generate', 'POST', '/api/certificates/generate'],
    
    // Academic Year APIs
    ['Academic Years List', 'GET', '/api/academic-years'],
    ['Academic Year Create', 'POST', '/api/academic-years'],
    ['Academic Year Update', 'PUT', '/api/academic-years/:id'],
    ['Academic Year Delete', 'DELETE', '/api/academic-years/:id'],
    
    // Staff APIs
    ['Staff Dashboard', 'GET', '/api/staff/dashboard'],
    ['Staff Events', 'GET', '/api/staff/events'],
    ['Staff Users', 'GET', '/api/staff/users']
  ];
  
  for (const [apiName, method, path] of apiEndpoints) {
    await testAPI(apiName, method, `${CONFIG.BACKEND_URL}${path}`);
  }
  
  // Test complete user flows
  console.log('\n🔄 TESTING COMPLETE USER FLOWS');
  console.log('=' .repeat(40));
  
  // Flow 1: User Registration Flow
  console.log('\n📝 Testing User Registration Flow:');
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
  
  const registerResult = await testAPI('User Registration', 'POST', `${CONFIG.BACKEND_URL}/api/auth/register`, testUser);
  logTest('flows', 'Registration Flow', registerResult.success, registerResult.success ? 'User registered' : 'Registration failed');
  
  // Flow 2: User Login Flow
  console.log('\n🔐 Testing User Login Flow:');
  const loginResult = await testAPI('User Login', 'POST', `${CONFIG.BACKEND_URL}/api/auth/login`, {
    email: testUser.email,
    password: testUser.password
  });
  
  let authToken = null;
  if (loginResult.success && loginResult.data?.token) {
    authToken = loginResult.data.token;
    logTest('flows', 'Login Flow', true, 'Login successful');
  } else {
    logTest('flows', 'Login Flow', false, 'Login failed');
  }
  
  // Flow 3: Event Management Flow (if authenticated)
  if (authToken) {
    console.log('\n📅 Testing Event Management Flow:');
    const headers = { 'Authorization': `Bearer ${authToken}` };
    
    // Create Event
    const testEvent = {
      title: `Test Event ${Date.now()}`,
      description: 'This is a test event for system verification',
      startDate: new Date(Date.now() + 86400000).toISOString(),
      endDate: new Date(Date.now() + 172800000).toISOString(),
      location: 'Test Location',
      maxParticipants: 50,
      category: 'Academic',
      isPublic: true
    };
    
    const createEventResult = await testAPI('Create Event', 'POST', `${CONFIG.BACKEND_URL}/api/events`, testEvent, headers);
    logTest('flows', 'Event Creation Flow', createEventResult.success, createEventResult.success ? 'Event created' : 'Event creation failed');
    
    // Register for Event
    if (createEventResult.success && createEventResult.data?._id) {
      const eventId = createEventResult.data._id;
      const registerEventResult = await testAPI('Event Registration', 'POST', `${CONFIG.BACKEND_URL}/api/events/${eventId}/register`, {}, headers);
      logTest('flows', 'Event Registration Flow', registerEventResult.success, registerEventResult.success ? 'Registered for event' : 'Event registration failed');
    }
    
    // Get User Profile
    const profileResult = await testAPI('Get Profile', 'GET', `${CONFIG.BACKEND_URL}/api/auth/profile`, null, headers);
    logTest('flows', 'Profile Access Flow', profileResult.success, profileResult.success ? 'Profile accessed' : 'Profile access failed');
    
    // Logout
    const logoutResult = await testAPI('User Logout', 'POST', `${CONFIG.BACKEND_URL}/api/auth/logout`, null, headers);
    logTest('flows', 'Logout Flow', logoutResult.success, logoutResult.success ? 'Logout successful' : 'Logout failed');
  }
  
  // Flow 4: Admin Flow (test without authentication - should get 401)
  console.log('\n👑 Testing Admin Access Flow:');
  const adminResult = await testAPI('Admin Dashboard Access', 'GET', `${CONFIG.BACKEND_URL}/api/admin/dashboard`);
  logTest('flows', 'Admin Access Control', adminResult.status === 401, adminResult.status === 401 ? 'Properly protected' : 'Security issue');
  
  // Flow 5: Public Event Access
  console.log('\n🌐 Testing Public Event Access Flow:');
  const publicEventsResult = await testAPI('Public Events Access', 'GET', `${CONFIG.BACKEND_URL}/api/events`);
  logTest('flows', 'Public Events Flow', publicEventsResult.success, publicEventsResult.success ? 'Public access working' : 'Public access failed');
  
  // Generate comprehensive report
  console.log('\n📊 COMPLETE SYSTEM FUNCTIONALITY REPORT');
  console.log('=' .repeat(60));
  
  const categories = ['pages', 'flows', 'apis'];
  
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
  
  fs.writeFileSync('COMPLETE_SYSTEM_FUNCTIONALITY_REPORT.json', JSON.stringify(reportData, null, 2));
  console.log(`\n📄 Detailed report saved to: COMPLETE_SYSTEM_FUNCTIONALITY_REPORT.json`);
  
  return reportData;
};

// Run the complete test
runCompleteSystemTest().catch(console.error);
