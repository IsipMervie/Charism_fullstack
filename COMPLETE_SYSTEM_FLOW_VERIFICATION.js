#!/usr/bin/env node

/**
 * COMPLETE SYSTEM FLOW VERIFICATION
 * Checks every aspect of the system flow from frontend to backend
 */

const fs = require('fs');
const path = require('path');

const flowResults = {
  authentication: { passed: 0, failed: 0, tests: [] },
  events: { passed: 0, failed: 0, tests: [] },
  userManagement: { passed: 0, failed: 0, tests: [] },
  adminFunctions: { passed: 0, failed: 0, tests: [] },
  communication: { passed: 0, failed: 0, tests: [] },
  fileManagement: { passed: 0, failed: 0, tests: [] },
  overall: { passed: 0, failed: 0, total: 0 }
};

const logTest = (category, testName, passed, details = '') => {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} [${category}] ${testName}${details ? ' - ' + details : ''}`);
  
  // Initialize category if it doesn't exist
  if (!flowResults[category]) {
    flowResults[category] = { passed: 0, failed: 0, tests: [] };
  }
  
  flowResults[category].tests.push({ name: testName, passed, details });
  
  if (passed) {
    flowResults[category].passed++;
    flowResults.overall.passed++;
  } else {
    flowResults[category].failed++;
    flowResults.overall.failed++;
  }
  
  flowResults.overall.total++;
};

const checkFileContent = (filePath, description, requiredContent) => {
  if (!fs.existsSync(filePath)) {
    logTest('system', `File missing: ${filePath}`, false, `Create the missing file: ${filePath}`);
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const hasContent = requiredContent.some(req => content.includes(req));
  
  if (!hasContent) {
    logTest('system', `Missing content in ${filePath}: ${description}`, false, 
      `Add the missing content: ${requiredContent.join(', ')}`);
    return false;
  }
  
  return true;
};

const verifyCompleteSystemFlow = () => {
  console.log('🔄 COMPLETE SYSTEM FLOW VERIFICATION');
  console.log('=' .repeat(60));
  console.log('Checking every aspect of the system flow...');
  
  // AUTHENTICATION FLOW VERIFICATION
  console.log('\n🔐 AUTHENTICATION FLOW VERIFICATION:');
  console.log('=' .repeat(40));
  
  // Frontend Authentication Components
  checkFileContent('frontend/src/components/LoginPage.jsx', 'Login Page', [
    'loginUser', 'handleSubmit', 'validation', 'formErrors', 'error', 'success'
  ]);
  
  checkFileContent('frontend/src/components/RegisterPage.jsx', 'Register Page', [
    'registerUser', 'handleSubmit', 'validation', 'formErrors', 'error', 'success'
  ]);
  
  checkFileContent('frontend/src/components/ForgotPasswordPage.jsx', 'Forgot Password Page', [
    'forgotPassword', 'handleSubmit', 'validation', 'error', 'success'
  ]);
  
  // Backend Authentication Routes
  checkFileContent('backend/routes/authRoutes.js', 'Auth Routes', [
    'login', 'register', 'forgot-password', 'reset-password', 'verify-email'
  ]);
  
  checkFileContent('backend/controllers/authController.js', 'Auth Controller', [
    'login', 'register', 'forgotPassword', 'resetPassword', 'verifyEmail'
  ]);
  
  // EVENTS FLOW VERIFICATION
  console.log('\n📅 EVENTS FLOW VERIFICATION:');
  console.log('=' .repeat(40));
  
  // Frontend Event Components
  checkFileContent('frontend/src/components/EventListPage.jsx', 'Event List Page', [
    'getEvents', 'filterEvents', 'searchEvents', 'navigation', 'onClick'
  ]);
  
  checkFileContent('frontend/src/components/EventDetailsPage.jsx', 'Event Details Page', [
    'getEventDetails', 'registerForEvent', 'unregisterFromEvent', 'handleRegister', 'handleUnregister'
  ]);
  
  checkFileContent('frontend/src/components/CreateEventPage.jsx', 'Create Event Page', [
    'createEvent', 'handleSubmit', 'validation', 'formData', 'onSubmit'
  ]);
  
  // Backend Event Routes
  checkFileContent('backend/routes/eventRoutes.js', 'Event Routes', [
    'events', 'create', 'update', 'delete', 'register', 'unregister'
  ]);
  
  checkFileContent('backend/controllers/eventController.js', 'Event Controller', [
    'createEvent', 'updateEvent', 'deleteEvent', 'registerForEvent', 'unregisterFromEvent'
  ]);
  
  // USER MANAGEMENT FLOW VERIFICATION
  console.log('\n👥 USER MANAGEMENT FLOW VERIFICATION:');
  console.log('=' .repeat(40));
  
  // Frontend User Components
  checkFileContent('frontend/src/components/ProfilePage.jsx', 'Profile Page', [
    'updateProfile', 'handleFormSubmit', 'formData', 'validation', 'isEditing'
  ]);
  
  checkFileContent('frontend/src/components/ManageUsersPage.jsx', 'Manage Users Page', [
    'getUsers', 'updateUser', 'deleteUser', 'approveUser', 'handleAction'
  ]);
  
  // Backend User Routes
  checkFileContent('backend/routes/userRoutes.js', 'User Routes', [
    'profile', 'update', 'delete', 'approve'
  ]);
  
  checkFileContent('backend/controllers/userController.js', 'User Controller', [
    'getProfile', 'updateProfile', 'deleteUser', 'approveUser'
  ]);
  
  // ADMIN FUNCTIONS FLOW VERIFICATION
  console.log('\n⚙️ ADMIN FUNCTIONS FLOW VERIFICATION:');
  console.log('=' .repeat(40));
  
  // Frontend Admin Components
  checkFileContent('frontend/src/components/AdminDashboard.jsx', 'Admin Dashboard', [
    'getAnalytics', 'navigate', 'onClick', 'action-card', 'dashboard'
  ]);
  
  checkFileContent('frontend/src/components/StaffDashboard.jsx', 'Staff Dashboard', [
    'getAnalytics', 'navigate', 'onClick', 'action-card', 'dashboard'
  ]);
  
  checkFileContent('frontend/src/components/StudentDashboard.jsx', 'Student Dashboard', [
    'getAnalytics', 'navigate', 'onClick', 'action-card', 'dashboard'
  ]);
  
  // Backend Admin Routes
  checkFileContent('backend/routes/adminRoutes.js', 'Admin Routes', [
    'dashboard', 'users', 'analytics', 'approve', 'reject'
  ]);
  
  checkFileContent('backend/controllers/adminController.js', 'Admin Controller', [
    'getAdminDashboard', 'getAllUsers', 'approveUser', 'rejectUser'
  ]);
  
  // COMMUNICATION FLOW VERIFICATION
  console.log('\n💬 COMMUNICATION FLOW VERIFICATION:');
  console.log('=' .repeat(40));
  
  // Frontend Communication Components
  checkFileContent('frontend/src/components/ContactUsPage.jsx', 'Contact Us Page', [
    'contactUs', 'handleSubmit', 'formData', 'validation', 'success'
  ]);
  
  checkFileContent('frontend/src/components/FeedbackPage.jsx', 'Feedback Page', [
    'submitFeedback', 'handleSubmit', 'formData', 'validation', 'rating'
  ]);
  
  checkFileContent('frontend/src/components/MessagesPage.jsx', 'Messages Page', [
    'sendMessage', 'handleSubmit', 'formData', 'validation'
  ]);
  
  // Backend Communication Routes
  checkFileContent('backend/routes/contactRoutes.js', 'Contact Routes', [
    'contact-us', 'send', 'get'
  ]);
  
  checkFileContent('backend/routes/feedbackRoutes.js', 'Feedback Routes', [
    'feedback', 'submit', 'get'
  ]);
  
  checkFileContent('backend/routes/messageRoutes.js', 'Message Routes', [
    'messages', 'send', 'get'
  ]);
  
  // FILE MANAGEMENT FLOW VERIFICATION
  console.log('\n📁 FILE MANAGEMENT FLOW VERIFICATION:');
  console.log('=' .repeat(40));
  
  // Frontend File Components
  checkFileContent('frontend/src/components/FileUploadPage.jsx', 'File Upload Page', [
    'uploadFile', 'handleSubmit', 'formData', 'validation'
  ]);
  
  // Backend File Routes
  checkFileContent('backend/routes/fileRoutes.js', 'File Routes', [
    'upload', 'download', 'delete'
  ]);
  
  checkFileContent('backend/controllers/fileController.js', 'File Controller', [
    'uploadFile', 'downloadFile', 'deleteFile'
  ]);
  
  // API INTEGRATION VERIFICATION
  console.log('\n🔗 API INTEGRATION VERIFICATION:');
  console.log('=' .repeat(40));
  
  checkFileContent('frontend/src/api/api.js', 'API Functions', [
    'loginUser', 'registerUser', 'getEvents', 'createEvent', 'updateEvent',
    'deleteEvent', 'registerForEvent', 'unregisterFromEvent', 'getUserProfile',
    'updateProfile', 'uploadFile', 'sendMessage', 'submitFeedback', 'contactUs',
    'getAnalytics', 'getUsers', 'updateUser', 'deleteUser', 'approveUser'
  ]);
  
  // EMAIL SYSTEM VERIFICATION
  console.log('\n📧 EMAIL SYSTEM VERIFICATION:');
  console.log('=' .repeat(40));
  
  checkFileContent('backend/utils/sendEmail.js', 'Email Utility', [
    'sendEmail', 'nodemailer', 'transporter'
  ]);
  
  checkFileContent('backend/utils/emailTemplates.js', 'Email Templates', [
    'getRegistrationTemplate', 'getLoginTemplate', 'getForgotPasswordTemplate',
    'getEventRegistrationTemplate', 'getEventApprovalTemplate', 'getEventNotificationTemplate',
    'getContactUsTemplate', 'getFeedbackTemplate'
  ]);
  
  // NAVIGATION VERIFICATION
  console.log('\n🧭 NAVIGATION VERIFICATION:');
  console.log('=' .repeat(40));
  
  checkFileContent('frontend/src/components/NavigationBar.jsx', 'Navigation Bar', [
    'action-button', 'handleQuickAction', 'navigate'
  ]);
  
  checkFileContent('frontend/src/App.js', 'App Routing', [
    'Routes', 'Route', 'navigate', 'useNavigate'
  ]);
  
  // DATABASE MODELS VERIFICATION
  console.log('\n🗄️ DATABASE MODELS VERIFICATION:');
  console.log('=' .repeat(40));
  
  checkFileContent('backend/models/User.js', 'User Model', [
    'User', 'Schema', 'name', 'email', 'password', 'role'
  ]);
  
  checkFileContent('backend/models/Event.js', 'Event Model', [
    'Event', 'Schema', 'title', 'description', 'date', 'location'
  ]);
  
  checkFileContent('backend/models/Attendance.js', 'Attendance Model', [
    'Attendance', 'Schema', 'userId', 'eventId', 'status'
  ]);
  
  // Generate comprehensive flow report
  console.log('\n📊 COMPLETE SYSTEM FLOW REPORT');
  console.log('=' .repeat(60));
  
  const categories = ['authentication', 'events', 'userManagement', 'adminFunctions', 'communication', 'fileManagement'];
  
  categories.forEach(category => {
    const results = flowResults[category];
    console.log(`\n${category.toUpperCase()} FLOW:`);
    console.log(`  ✅ Passed: ${results.passed}`);
    console.log(`  ❌ Failed: ${results.failed}`);
    console.log(`  📊 Success Rate: ${results.passed + results.failed > 0 ? ((results.passed / (results.passed + results.failed)) * 100).toFixed(1) : 0}%`);
  });
  
  console.log(`\nOVERALL SYSTEM FLOW:`);
  console.log(`  ✅ Total Passed: ${flowResults.overall.passed}`);
  console.log(`  ❌ Total Failed: ${flowResults.overall.failed}`);
  console.log(`  📊 Overall Success Rate: ${flowResults.overall.total > 0 ? ((flowResults.overall.passed / flowResults.overall.total) * 100).toFixed(1) : 0}%`);
  
  // Save detailed flow report
  const reportData = {
    timestamp: new Date().toISOString(),
    flowResults: flowResults,
    summary: {
      totalPassed: flowResults.overall.passed,
      totalFailed: flowResults.overall.failed,
      successRate: flowResults.overall.total > 0 ? ((flowResults.overall.passed / flowResults.overall.total) * 100).toFixed(1) : 0
    }
  };
  
  fs.writeFileSync('COMPLETE_SYSTEM_FLOW_REPORT.json', JSON.stringify(reportData, null, 2));
  console.log(`\n📄 Detailed flow report saved to: COMPLETE_SYSTEM_FLOW_REPORT.json`);
  
  console.log('\n🔄 COMPLETE SYSTEM FLOW VERIFICATION COMPLETED!');
  
  return reportData;
};

// Run the complete system flow verification
verifyCompleteSystemFlow();
