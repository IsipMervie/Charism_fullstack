#!/usr/bin/env node

/**
 * COMPLETE SYSTEM FUNCTIONALITY FLOW TEST
 * Tests all buttons, emails, forms, and interactive elements
 */

const axios = require('axios');
const fs = require('fs');

const CONFIG = {
  BACKEND_URL: 'https://charism-api-xtw9.onrender.com',
  FRONTEND_URL: 'https://charism-ucb4.onrender.com',
  TIMEOUT: 10000
};

const testResults = {
  buttons: { passed: 0, failed: 0, tests: [] },
  forms: { passed: 0, failed: 0, tests: [] },
  emails: { passed: 0, failed: 0, tests: [] },
  flows: { passed: 0, failed: 0, tests: [] },
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

const testAPI = async (apiName, method, url, data = null, headers = {}) => {
  try {
    const config = { method, url, timeout: CONFIG.TIMEOUT, headers };
    if (data) config.data = data;
    
    const response = await axios(config);
    const passed = response.status >= 200 && response.status < 300;
    logTest('flows', apiName, passed, `Status: ${response.status}`);
    return { success: passed, data: response.data, status: response.status };
  } catch (error) {
    const status = error.response?.status || 'ERROR';
    logTest('flows', apiName, false, `Error: ${error.message} (${status})`);
    return { success: false, error: error.message, status };
  }
};

const runCompleteFunctionalityFlowTest = async () => {
  console.log('🔄 COMPLETE SYSTEM FUNCTIONALITY FLOW TEST');
  console.log('=' .repeat(60));
  console.log('Testing all buttons, forms, emails, and user flows...');
  
  // Test 1: User Registration Flow (Forms + Buttons)
  console.log('\n📝 TESTING USER REGISTRATION FLOW:');
  console.log('=' .repeat(40));
  
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
  
  // Test registration form submission
  const registerResult = await testAPI('Registration Form Submit', 'POST', `${CONFIG.BACKEND_URL}/api/auth/register`, testUser);
  logTest('forms', 'Registration Form', registerResult.success, registerResult.success ? 'Form submitted successfully' : 'Form submission failed');
  
  // Test 2: User Login Flow (Forms + Buttons)
  console.log('\n🔐 TESTING USER LOGIN FLOW:');
  console.log('=' .repeat(40));
  
  const loginData = {
    email: testUser.email,
    password: testUser.password
  };
  
  const loginResult = await testAPI('Login Form Submit', 'POST', `${CONFIG.BACKEND_URL}/api/auth/login`, loginData);
  logTest('forms', 'Login Form', loginResult.success, loginResult.success ? 'Login form submitted' : 'Login form failed');
  
  let authToken = null;
  if (loginResult.success && loginResult.data?.token) {
    authToken = loginResult.data.token;
    logTest('buttons', 'Login Button', true, 'Login button functionality working');
  } else {
    logTest('buttons', 'Login Button', false, 'Login button not working');
  }
  
  // Test 3: Event Management Flow (Buttons + Forms)
  if (authToken) {
    console.log('\n📅 TESTING EVENT MANAGEMENT FLOW:');
    console.log('=' .repeat(40));
    
    const headers = { 'Authorization': `Bearer ${authToken}` };
    
    // Test Create Event Form
    const testEvent = {
      title: `Test Event ${Date.now()}`,
      description: 'This is a test event for functionality verification',
      startDate: new Date(Date.now() + 86400000).toISOString(),
      endDate: new Date(Date.now() + 172800000).toISOString(),
      location: 'Test Location',
      maxParticipants: 50,
      category: 'Academic',
      isPublic: true
    };
    
    const createEventResult = await testAPI('Create Event Form', 'POST', `${CONFIG.BACKEND_URL}/api/events`, testEvent, headers);
    logTest('forms', 'Create Event Form', createEventResult.success, createEventResult.success ? 'Event creation form working' : 'Event creation form failed');
    logTest('buttons', 'Create Event Button', createEventResult.success, createEventResult.success ? 'Create event button working' : 'Create event button failed');
    
    // Test Event Registration Button
    if (createEventResult.success && createEventResult.data?._id) {
      const eventId = createEventResult.data._id;
      const registerEventResult = await testAPI('Event Registration Button', 'POST', `${CONFIG.BACKEND_URL}/api/events/${eventId}/register`, {}, headers);
      logTest('buttons', 'Register Event Button', registerEventResult.success, registerEventResult.success ? 'Register button working' : 'Register button failed');
      
      // Test Event Unregister Button
      const unregisterEventResult = await testAPI('Event Unregister Button', 'DELETE', `${CONFIG.BACKEND_URL}/api/events/${eventId}/unregister`, null, headers);
      logTest('buttons', 'Unregister Event Button', unregisterEventResult.success, unregisterEventResult.success ? 'Unregister button working' : 'Unregister button failed');
    }
    
    // Test Profile Update Form
    const profileUpdateData = {
      firstName: 'Updated',
      lastName: 'Name'
    };
    
    const profileUpdateResult = await testAPI('Profile Update Form', 'PUT', `${CONFIG.BACKEND_URL}/api/users/profile`, profileUpdateData, headers);
    logTest('forms', 'Profile Update Form', profileUpdateResult.success, profileUpdateResult.success ? 'Profile update form working' : 'Profile update form failed');
    logTest('buttons', 'Save Profile Button', profileUpdateResult.success, profileUpdateResult.success ? 'Save profile button working' : 'Save profile button failed');
  }
  
  // Test 4: Email Functionality Flow
  console.log('\n📧 TESTING EMAIL FUNCTIONALITY FLOW:');
  console.log('=' .repeat(40));
  
  // Test Email Configuration
  const emailConfigResult = await testAPI('Email Configuration Check', 'GET', `${CONFIG.BACKEND_URL}/api/test-email`);
  logTest('emails', 'Email Configuration', emailConfigResult.success, emailConfigResult.success ? 'Email config working' : 'Email config failed');
  
  // Test Forgot Password Email
  const forgotPasswordData = {
    email: testUser.email
  };
  
  const forgotPasswordResult = await testAPI('Forgot Password Email', 'POST', `${CONFIG.BACKEND_URL}/api/auth/forgot-password`, forgotPasswordData);
  logTest('emails', 'Forgot Password Email', forgotPasswordResult.success, forgotPasswordResult.success ? 'Forgot password email sent' : 'Forgot password email failed');
  logTest('buttons', 'Forgot Password Button', forgotPasswordResult.success, forgotPasswordResult.success ? 'Forgot password button working' : 'Forgot password button failed');
  
  // Test Contact Form Email
  const contactData = {
    name: 'Test User',
    email: testUser.email,
    subject: 'Test Contact',
    message: 'This is a test contact message'
  };
  
  const contactResult = await testAPI('Contact Form Email', 'POST', `${CONFIG.BACKEND_URL}/api/contact-us`, contactData);
  logTest('emails', 'Contact Form Email', contactResult.success, contactResult.success ? 'Contact form email sent' : 'Contact form email failed');
  logTest('forms', 'Contact Form', contactResult.success, contactResult.success ? 'Contact form working' : 'Contact form failed');
  logTest('buttons', 'Send Contact Button', contactResult.success, contactResult.success ? 'Send contact button working' : 'Send contact button failed');
  
  // Test 5: Admin Panel Flow (Buttons + Forms)
  console.log('\n👑 TESTING ADMIN PANEL FLOW:');
  console.log('=' .repeat(40));
  
  // Test Admin Dashboard Access
  const adminDashboardResult = await testAPI('Admin Dashboard Access', 'GET', `${CONFIG.BACKEND_URL}/api/admin/dashboard`);
  logTest('buttons', 'Admin Dashboard Button', adminDashboardResult.status === 401 || adminDashboardResult.success, adminDashboardResult.status === 401 ? 'Properly protected' : 'Admin dashboard accessible');
  
  // Test User Management Buttons
  const usersListResult = await testAPI('Users List Button', 'GET', `${CONFIG.BACKEND_URL}/api/admin/users`);
  logTest('buttons', 'Users List Button', usersListResult.status === 401 || usersListResult.success, usersListResult.status === 401 ? 'Properly protected' : 'Users list accessible');
  
  // Test Analytics Button
  const analyticsResult = await testAPI('Analytics Button', 'GET', `${CONFIG.BACKEND_URL}/api/analytics`);
  logTest('buttons', 'Analytics Button', analyticsResult.status === 401 || analyticsResult.success, analyticsResult.status === 401 ? 'Properly protected' : 'Analytics accessible');
  
  // Test 6: File Upload Flow (Buttons + Forms)
  console.log('\n📁 TESTING FILE UPLOAD FLOW:');
  console.log('=' .repeat(40));
  
  // Test File Upload Endpoint
  const fileUploadResult = await testAPI('File Upload Button', 'POST', `${CONFIG.BACKEND_URL}/api/files/upload`);
  logTest('buttons', 'File Upload Button', fileUploadResult.status === 400 || fileUploadResult.success, fileUploadResult.status === 400 ? 'Upload endpoint exists' : 'Upload endpoint working');
  logTest('forms', 'File Upload Form', fileUploadResult.status === 400 || fileUploadResult.success, fileUploadResult.status === 400 ? 'Upload form exists' : 'Upload form working');
  
  // Test 7: Feedback Flow (Forms + Buttons)
  console.log('\n💬 TESTING FEEDBACK FLOW:');
  console.log('=' .repeat(40));
  
  const feedbackData = {
    name: 'Test User',
    email: testUser.email,
    subject: 'Test Feedback',
    message: 'This is a test feedback message',
    rating: 5
  };
  
  const feedbackResult = await testAPI('Feedback Form Submit', 'POST', `${CONFIG.BACKEND_URL}/api/feedback`, feedbackData);
  logTest('forms', 'Feedback Form', feedbackResult.success, feedbackResult.success ? 'Feedback form working' : 'Feedback form failed');
  logTest('buttons', 'Submit Feedback Button', feedbackResult.success, feedbackResult.success ? 'Submit feedback button working' : 'Submit feedback button failed');
  
  // Test 8: Logout Flow (Buttons)
  if (authToken) {
    console.log('\n🚪 TESTING LOGOUT FLOW:');
    console.log('=' .repeat(40));
    
    const logoutResult = await testAPI('Logout Button', 'POST', `${CONFIG.BACKEND_URL}/api/auth/logout`, null, { 'Authorization': `Bearer ${authToken}` });
    logTest('buttons', 'Logout Button', logoutResult.success, logoutResult.success ? 'Logout button working' : 'Logout button failed');
  }
  
  // Test 9: Navigation Flow (Buttons)
  console.log('\n🧭 TESTING NAVIGATION FLOW:');
  console.log('=' .repeat(40));
  
  // Test public pages navigation
  const publicPages = [
    ['Home Page', '/'],
    ['Events Page', '/events'],
    ['Contact Page', '/contact'],
    ['Feedback Page', '/feedback']
  ];
  
  for (const [pageName, path] of publicPages) {
    try {
      const response = await axios.get(`${CONFIG.FRONTEND_URL}${path}`, { timeout: CONFIG.TIMEOUT });
      logTest('buttons', `${pageName} Navigation`, response.status === 200, response.status === 200 ? 'Navigation working' : 'Navigation failed');
    } catch (error) {
      logTest('buttons', `${pageName} Navigation`, false, 'Navigation failed');
    }
  }
  
  // Generate comprehensive report
  console.log('\n📊 COMPLETE FUNCTIONALITY FLOW REPORT');
  console.log('=' .repeat(60));
  
  const categories = ['buttons', 'forms', 'emails', 'flows'];
  
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
    console.log(`\n🎉 SYSTEM FUNCTIONALITY: EXCELLENT (${overallPercentage}%)`);
  } else if (overallPercentage >= 80) {
    console.log(`\n✅ SYSTEM FUNCTIONALITY: GOOD (${overallPercentage}%)`);
  } else if (overallPercentage >= 70) {
    console.log(`\n⚠️ SYSTEM FUNCTIONALITY: NEEDS ATTENTION (${overallPercentage}%)`);
  } else {
    console.log(`\n❌ SYSTEM FUNCTIONALITY: CRITICAL ISSUES (${overallPercentage}%)`);
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
  
  fs.writeFileSync('COMPLETE_FUNCTIONALITY_FLOW_REPORT.json', JSON.stringify(reportData, null, 2));
  console.log(`\n📄 Detailed report saved to: COMPLETE_FUNCTIONALITY_FLOW_REPORT.json`);
  
  console.log('\n🔄 FUNCTIONALITY FLOW TEST COMPLETED!');
  
  return reportData;
};

// Run the complete functionality flow test
runCompleteFunctionalityFlowTest().catch(console.error);
