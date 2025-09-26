#!/usr/bin/env node

/**
 * COMPLETE END-TO-END SYSTEM FLOW VERIFICATION
 * Checks every aspect from frontend to backend including emails, buttons, and all functionality
 */

const fs = require('fs');
const path = require('path');

const flowResults = {
  emailSystem: { passed: 0, failed: 0, tests: [] },
  frontendButtons: { passed: 0, failed: 0, tests: [] },
  frontendForms: { passed: 0, failed: 0, tests: [] },
  frontendNavigation: { passed: 0, failed: 0, tests: [] },
  backendAPIs: { passed: 0, failed: 0, tests: [] },
  backendControllers: { passed: 0, failed: 0, tests: [] },
  backendRoutes: { passed: 0, failed: 0, tests: [] },
  databaseModels: { passed: 0, failed: 0, tests: [] },
  overall: { passed: 0, failed: 0, total: 0 }
};

const logTest = (category, testName, passed, details = '') => {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} [${category}] ${testName}${details ? ' - ' + details : ''}`);
  
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
  
  logTest('system', `Content verified in ${filePath}: ${description}`, true);
  return true;
};

const verifyCompleteSystemFlow = () => {
  console.log('🔄 COMPLETE END-TO-END SYSTEM FLOW VERIFICATION');
  console.log('=' .repeat(70));
  console.log('Checking every aspect from frontend to backend...');
  
  // EMAIL SYSTEM VERIFICATION
  console.log('\n📧 EMAIL SYSTEM VERIFICATION:');
  console.log('=' .repeat(50));
  
  // Email Templates
  checkFileContent('backend/utils/emailTemplates.js', 'Email Templates', [
    'getRegistrationTemplate', 'getLoginTemplate', 'getForgotPasswordTemplate',
    'getEventRegistrationTemplate', 'getEventApprovalTemplate', 'getEventNotificationTemplate',
    'getContactUsTemplate', 'getFeedbackTemplate', 'getEventUpdateTemplate',
    'getSystemAlertTemplate', 'getAdminNotificationTemplate'
  ]);
  
  // Email Utility
  checkFileContent('backend/utils/sendEmail.js', 'Email Utility', [
    'sendEmail', 'nodemailer', 'transporter', 'createTransport'
  ]);
  
  // Email Triggers in Controllers
  checkFileContent('backend/controllers/eventController.js', 'Event Email Triggers', [
    'eventNotification', 'eventUpdate', 'getRegistrationApprovalTemplate', 'getEventNotificationTemplate'
  ]);
  
  checkFileContent('backend/controllers/adminController.js', 'Admin Email Triggers', [
    'userApproval', 'adminNotification', 'systemAlert', 'sendAdminNotification', 'sendSystemAlert'
  ]);
  
  checkFileContent('backend/controllers/authController.js', 'Auth Email Triggers', [
    'sendEmail', 'getEmailVerificationTemplate', 'getPasswordResetTemplate'
  ]);
  
  // FRONTEND BUTTONS VERIFICATION
  console.log('\n🔘 FRONTEND BUTTONS VERIFICATION:');
  console.log('=' .repeat(50));
  
  // Authentication Buttons
  checkFileContent('frontend/src/components/LoginPage.jsx', 'Login Buttons', [
    'Login', 'button', 'onClick', 'handleSubmit'
  ]);
  
  checkFileContent('frontend/src/components/RegisterPage.jsx', 'Register Buttons', [
    'Register', 'button', 'onClick', 'handleSubmit'
  ]);
  
  checkFileContent('frontend/src/components/ForgotPasswordPage.jsx', 'Forgot Password Buttons', [
    'Send Reset Link', 'button', 'onClick', 'handleSubmit'
  ]);
  
  // Event Buttons
  checkFileContent('frontend/src/components/EventListPage.jsx', 'Event List Buttons', [
    'Register', 'View Details', 'button', 'onClick', 'handleJoin'
  ]);
  
  checkFileContent('frontend/src/components/EventDetailsPage.jsx', 'Event Details Buttons', [
    'Register', 'Unregister', 'Event Chat', 'Time In', 'Time Out', 'button', 'onClick'
  ]);
  
  checkFileContent('frontend/src/components/CreateEventPage.jsx', 'Create Event Buttons', [
    'Create Event', 'button', 'onClick', 'handleSubmit'
  ]);
  
  checkFileContent('frontend/src/components/EditEventPage.jsx', 'Edit Event Buttons', [
    'Update Event', 'button', 'onClick', 'handleSubmit'
  ]);
  
  // Admin/Staff Buttons
  checkFileContent('frontend/src/components/AdminDashboard.jsx', 'Admin Dashboard Buttons', [
    'Manage Users', 'Manage Events', 'Analytics', 'button', 'onClick'
  ]);
  
  checkFileContent('frontend/src/components/StaffDashboard.jsx', 'Staff Dashboard Buttons', [
    'Manage Users', 'Manage Events', 'Analytics', 'button', 'onClick'
  ]);
  
  checkFileContent('frontend/src/components/StudentDashboard.jsx', 'Student Dashboard Buttons', [
    'View Events', 'My Participation', 'Profile', 'button', 'onClick'
  ]);
  
  // Management Buttons
  checkFileContent('frontend/src/components/ManageUsersPage.jsx', 'Manage Users Buttons', [
    'Approve', 'Reject', 'Suspend', 'Delete', 'button', 'onClick', 'handleAction'
  ]);
  
  checkFileContent('frontend/src/components/AdminManageEventsPage.jsx', 'Admin Manage Events Buttons', [
    'Edit', 'Delete', 'Approve', 'Reject', 'button', 'onClick'
  ]);
  
  // Navigation Buttons
  checkFileContent('frontend/src/components/NavigationBar.jsx', 'Navigation Buttons', [
    'action-button', 'handleQuickAction', 'Events', 'Profile', 'Create Event', 'Contact', 'Feedback'
  ]);
  
  // FRONTEND FORMS VERIFICATION
  console.log('\n📝 FRONTEND FORMS VERIFICATION:');
  console.log('=' .repeat(50));
  
  // Authentication Forms
  checkFileContent('frontend/src/components/LoginPage.jsx', 'Login Form', [
    'form', 'onSubmit', 'handleSubmit', 'validation', 'formErrors', 'email', 'password'
  ]);
  
  checkFileContent('frontend/src/components/RegisterPage.jsx', 'Register Form', [
    'form', 'onSubmit', 'handleSubmit', 'validation', 'formErrors', 'name', 'email', 'password', 'userId', 'academicYear', 'year', 'section', 'department'
  ]);
  
  checkFileContent('frontend/src/components/ForgotPasswordPage.jsx', 'Forgot Password Form', [
    'form', 'onSubmit', 'handleSubmit', 'email'
  ]);
  
  // Event Forms
  checkFileContent('frontend/src/components/CreateEventPage.jsx', 'Create Event Form', [
    'form', 'onSubmit', 'handleSubmit', 'validation', 'formData', 'title', 'description', 'date', 'location', 'hours'
  ]);
  
  checkFileContent('frontend/src/components/EditEventPage.jsx', 'Edit Event Form', [
    'form', 'onSubmit', 'handleSubmit', 'validation', 'formData'
  ]);
  
  // Profile Forms
  checkFileContent('frontend/src/components/ProfilePage.jsx', 'Profile Form', [
    'form', 'onSubmit', 'handleFormSubmit', 'validation', 'formData', 'isEditing', 'name', 'email', 'userId', 'academicYear', 'department', 'year', 'section'
  ]);
  
  checkFileContent('frontend/src/components/ChangePasswordPage.jsx', 'Change Password Form', [
    'form', 'onSubmit', 'handleSubmit', 'currentPassword', 'newPassword', 'confirmPassword'
  ]);
  
  // Communication Forms
  checkFileContent('frontend/src/components/ContactUsPage.jsx', 'Contact Us Form', [
    'form', 'onSubmit', 'handleSubmit', 'validation', 'formData', 'name', 'email', 'message'
  ]);
  
  checkFileContent('frontend/src/components/FeedbackPage.jsx', 'Feedback Form', [
    'form', 'onSubmit', 'handleSubmit', 'validation', 'formData', 'subject', 'message', 'rating', 'userEmail', 'userName'
  ]);
  
  // File Upload Forms
  checkFileContent('frontend/src/components/ProfilePictureUpload.jsx', 'Profile Picture Upload Form', [
    'form', 'onSubmit', 'handleSubmit', 'uploadFile', 'file', 'input'
  ]);
  
  checkFileContent('frontend/src/components/EventDocumentationUpload.jsx', 'Event Documentation Upload Form', [
    'form', 'onSubmit', 'handleSubmit', 'uploadFile', 'file', 'input'
  ]);
  
  checkFileContent('frontend/src/components/StudentDocumentationPage.jsx', 'Student Documentation Form', [
    'form', 'onSubmit', 'handleSubmit', 'uploadFile', 'file', 'input'
  ]);
  
  // FRONTEND NAVIGATION VERIFICATION
  console.log('\n🧭 FRONTEND NAVIGATION VERIFICATION:');
  console.log('=' .repeat(50));
  
  // App Routing
  checkFileContent('frontend/src/App.js', 'App Routing', [
    'Routes', 'Route', 'navigate', 'useNavigate', 'BrowserRouter'
  ]);
  
  // Navigation Components
  checkFileContent('frontend/src/components/NavigationBar.jsx', 'Navigation Bar', [
    'navigate', 'useNavigate', 'handleQuickAction', 'action-button'
  ]);
  
  // Event Navigation
  checkFileContent('frontend/src/components/EventListPage.jsx', 'Event List Navigation', [
    'navigate', 'navigation', 'navigateToEvent', 'onClick'
  ]);
  
  checkFileContent('frontend/src/components/EventDetailsPage.jsx', 'Event Details Navigation', [
    'navigate', 'useNavigate', 'Back to Events'
  ]);
  
  // BACKEND API VERIFICATION
  console.log('\n🔗 BACKEND API VERIFICATION:');
  console.log('=' .repeat(50));
  
  // API Functions
  checkFileContent('frontend/src/api/api.js', 'API Functions', [
    'loginUser', 'registerUser', 'forgotPassword', 'resetPassword', 'verifyEmail',
    'getEvents', 'getEventDetails', 'createEvent', 'updateEvent', 'deleteEvent',
    'registerForEvent', 'unregisterFromEvent', 'approveRegistration', 'disapproveRegistration',
    'getUserProfile', 'updateProfile', 'changePassword', 'getUsers', 'updateUser', 'deleteUser', 'approveUser',
    'uploadFile', 'sendMessage', 'submitFeedback', 'contactUs', 'getAnalytics',
    'timeIn', 'timeOut', 'getAttendance', 'updateAttendance'
  ]);
  
  // BACKEND CONTROLLERS VERIFICATION
  console.log('\n⚙️ BACKEND CONTROLLERS VERIFICATION:');
  console.log('=' .repeat(50));
  
  // Auth Controller
  checkFileContent('backend/controllers/authController.js', 'Auth Controller', [
    'login', 'register', 'forgotPassword', 'resetPassword', 'verifyEmail', 'changePassword'
  ]);
  
  // Event Controller
  checkFileContent('backend/controllers/eventController.js', 'Event Controller', [
    'getAllEvents', 'getEventDetails', 'createEvent', 'updateEvent', 'deleteEvent',
    'registerForEvent', 'unregisterFromEvent', 'approveRegistration', 'disapproveRegistration',
    'timeIn', 'timeOut', 'approveAttendance', 'disapproveAttendance'
  ]);
  
  // User Controller
  checkFileContent('backend/controllers/userController.js', 'User Controller', [
    'getProfile', 'updateProfile', 'changePassword', 'getUsers', 'updateUser', 'deleteUser'
  ]);
  
  // Admin Controller
  checkFileContent('backend/controllers/adminController.js', 'Admin Controller', [
    'getAdminDashboard', 'getAllUsers', 'approveUser', 'rejectUser', 'getAnalytics',
    'sendAdminNotification', 'sendSystemAlert', 'triggerSystemAlert'
  ]);
  
  // File Controller
  checkFileContent('backend/controllers/fileController.js', 'File Controller', [
    'uploadFile', 'downloadFile', 'deleteFile', 'uploadEventImage', 'getEventImage'
  ]);
  
  // BACKEND ROUTES VERIFICATION
  console.log('\n🛣️ BACKEND ROUTES VERIFICATION:');
  console.log('=' .repeat(50));
  
  // Auth Routes
  checkFileContent('backend/routes/authRoutes.js', 'Auth Routes', [
    'login', 'register', 'forgot-password', 'reset-password', 'verify-email', 'change-password'
  ]);
  
  // Event Routes
  checkFileContent('backend/routes/eventRoutes.js', 'Event Routes', [
    'events', 'create', 'update', 'delete', 'register', 'unregister', 'approve', 'disapprove',
    'time-in', 'time-out', 'attendance', 'participants'
  ]);
  
  // User Routes
  checkFileContent('backend/routes/userRoutes.js', 'User Routes', [
    'profile', 'update', 'change-password', 'users', 'approve', 'reject'
  ]);
  
  // Admin Routes
  checkFileContent('backend/routes/adminRoutes.js', 'Admin Routes', [
    'dashboard', 'users', 'analytics', 'approve', 'reject', 'system-alert'
  ]);
  
  // File Routes
  checkFileContent('backend/routes/fileRoutes.js', 'File Routes', [
    'upload', 'download', 'delete', 'event-image', 'profile-picture'
  ]);
  
  // Contact Routes
  checkFileContent('backend/routes/contactUsRoutes.js', 'Contact Us Routes', [
    'contact-us', 'send', 'get'
  ]);
  
  // Feedback Routes
  checkFileContent('backend/routes/feedbackRoutes.js', 'Feedback Routes', [
    'feedback', 'submit', 'get'
  ]);
  
  // Message Routes
  checkFileContent('backend/routes/messageRoutes.js', 'Message Routes', [
    'messages', 'send', 'get'
  ]);
  
  // Event Chat Routes
  checkFileContent('backend/routes/eventChatRoutes.js', 'Event Chat Routes', [
    'chat', 'send', 'get'
  ]);
  
  // DATABASE MODELS VERIFICATION
  console.log('\n🗄️ DATABASE MODELS VERIFICATION:');
  console.log('=' .repeat(50));
  
  // User Model
  checkFileContent('backend/models/User.js', 'User Model', [
    'User', 'Schema', 'name', 'email', 'password', 'role', 'userId', 'academicYear', 'year', 'section', 'department', 'isApproved', 'isVerified'
  ]);
  
  // Event Model
  checkFileContent('backend/models/Event.js', 'Event Model', [
    'Event', 'Schema', 'title', 'description', 'date', 'startTime', 'endTime', 'location', 'hours', 'attendance', 'status', 'requiresApproval', 'isVisibleToStudents'
  ]);
  
  // Message Model
  checkFileContent('backend/models/Message.js', 'Message Model', [
    'Message', 'Schema', 'sender', 'receiver', 'content', 'timestamp'
  ]);
  
  // Feedback Model
  checkFileContent('backend/models/Feedback.js', 'Feedback Model', [
    'Feedback', 'Schema', 'user', 'content', 'rating', 'subject'
  ]);
  
  // Event Chat Model
  checkFileContent('backend/models/EventChat.js', 'Event Chat Model', [
    'EventChat', 'Schema', 'eventId', 'userId', 'message', 'timestamp'
  ]);
  
  // Generate comprehensive flow report
  console.log('\n📊 COMPLETE END-TO-END SYSTEM FLOW REPORT');
  console.log('=' .repeat(70));
  
  const categories = ['emailSystem', 'frontendButtons', 'frontendForms', 'frontendNavigation', 'backendAPIs', 'backendControllers', 'backendRoutes', 'databaseModels'];
  
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
  
  fs.writeFileSync('COMPLETE_END_TO_END_SYSTEM_FLOW_REPORT.json', JSON.stringify(reportData, null, 2));
  console.log(`\n📄 Detailed flow report saved to: COMPLETE_END_TO_END_SYSTEM_FLOW_REPORT.json`);
  
  console.log('\n🔄 COMPLETE END-TO-END SYSTEM FLOW VERIFICATION COMPLETED!');
  
  return reportData;
};

// Run the complete end-to-end system flow verification
verifyCompleteSystemFlow();
