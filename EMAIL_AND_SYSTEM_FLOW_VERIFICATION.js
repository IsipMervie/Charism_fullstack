#!/usr/bin/env node

/**
 * COMPREHENSIVE EMAIL AND SYSTEM FLOW VERIFICATION
 * Checks email functionality and complete system flows
 */

const fs = require('fs');
const path = require('path');

const testResults = {
  emails: { passed: 0, failed: 0, tests: [] },
  flows: { passed: 0, failed: 0, tests: [] },
  functionality: { passed: 0, failed: 0, tests: [] },
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

const checkFileContent = (filePath, description, requiredContent) => {
  if (!fs.existsSync(filePath)) {
    logTest('emails', description, false, `File missing: ${filePath}`);
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const hasContent = requiredContent.some(req => content.includes(req));
  logTest('emails', description, hasContent, hasContent ? 'Required content found' : 'Missing required content');
  return hasContent;
};

const analyzeEmailFlow = (controllerFile, flowName, emailTriggers) => {
  if (!fs.existsSync(controllerFile)) {
    logTest('emails', `${flowName} Email Flow`, false, `Controller missing: ${controllerFile}`);
    return;
  }
  
  const content = fs.readFileSync(controllerFile, 'utf8');
  
  emailTriggers.forEach(trigger => {
    const hasTrigger = content.includes(trigger);
    logTest('emails', `${flowName} - ${trigger}`, hasTrigger, 
      hasTrigger ? 'Email trigger found' : 'Email trigger missing');
  });
};

const analyzeSystemFlow = (componentFile, flowName, requiredElements) => {
  if (!fs.existsSync(componentFile)) {
    logTest('flows', `${flowName} Flow`, false, `Component missing: ${componentFile}`);
    return;
  }
  
  const content = fs.readFileSync(componentFile, 'utf8');
  
  requiredElements.forEach(element => {
    const hasElement = content.includes(element);
    logTest('flows', `${flowName} - ${element}`, hasElement, 
      hasElement ? 'Element found' : 'Element missing');
  });
};

const runEmailAndFlowVerification = () => {
  console.log('📧 COMPREHENSIVE EMAIL AND SYSTEM FLOW VERIFICATION');
  console.log('=' .repeat(60));
  console.log('Checking email functionality and complete system flows...');
  
  // Check Email System Infrastructure
  console.log('\n📧 EMAIL SYSTEM INFRASTRUCTURE:');
  console.log('=' .repeat(40));
  
  checkFileContent('backend/utils/sendEmail.js', 'Email Utility', ['nodemailer', 'transporter', 'sendMail']);
  checkFileContent('backend/utils/emailTemplates.js', 'Email Templates', ['template', 'html', 'subject']);
  
  // Check Email Configuration
  const envContent = fs.readFileSync('backend/.env', 'utf8');
  const hasEmailConfig = envContent.includes('EMAIL_USER') && envContent.includes('EMAIL_PASS');
  logTest('emails', 'Email Configuration', hasEmailConfig, 
    hasEmailConfig ? 'Email config found' : 'Email config missing');
  
  // Check Email Triggers in Controllers
  console.log('\n📧 EMAIL TRIGGERS IN CONTROLLERS:');
  console.log('=' .repeat(40));
  
  // Auth Controller Email Flows
  analyzeEmailFlow('backend/controllers/authController.js', 'Authentication', [
    'sendEmail',
    'forgotPassword',
    'resetPassword',
    'verifyEmail',
    'registration'
  ]);
  
  // Event Controller Email Flows
  analyzeEmailFlow('backend/controllers/eventController.js', 'Event Management', [
    'sendEmail',
    'registration',
    'approval',
    'eventNotification',
    'eventUpdate'
  ]);
  
  // Admin Controller Email Flows
  analyzeEmailFlow('backend/controllers/adminController.js', 'Admin Functions', [
    'sendEmail',
    'userApproval',
    'adminNotification',
    'systemAlert'
  ]);
  
  // Check Email Templates Usage
  console.log('\n📧 EMAIL TEMPLATES USAGE:');
  console.log('=' .repeat(40));
  
  const emailTemplatesContent = fs.readFileSync('backend/utils/emailTemplates.js', 'utf8');
  
  const emailTemplates = [
    'getRegistrationTemplate',
    'getLoginTemplate',
    'getForgotPasswordTemplate',
    'getResetPasswordTemplate',
    'getEventRegistrationTemplate',
    'getEventApprovalTemplate',
    'getEventNotificationTemplate',
    'getContactUsTemplate',
    'getFeedbackTemplate'
  ];
  
  emailTemplates.forEach(template => {
    const hasTemplate = emailTemplatesContent.includes(template);
    logTest('emails', `Email Template - ${template}`, hasTemplate, 
      hasTemplate ? 'Template found' : 'Template missing');
  });
  
  // Check System Flows
  console.log('\n🔄 SYSTEM FLOW VERIFICATION:');
  console.log('=' .repeat(40));
  
  // Authentication Flow
  analyzeSystemFlow('frontend/src/components/LoginPage.jsx', 'Login Flow', [
    'loginUser',
    'handleSubmit',
    'onSubmit',
    'validation',
    'error',
    'success'
  ]);
  
  analyzeSystemFlow('frontend/src/components/RegisterPage.jsx', 'Registration Flow', [
    'registerUser',
    'handleSubmit',
    'onSubmit',
    'validation',
    'error',
    'success'
  ]);
  
  // Event Management Flow
  analyzeSystemFlow('frontend/src/components/CreateEventPage.jsx', 'Event Creation Flow', [
    'createEvent',
    'handleSubmit',
    'onSubmit',
    'validation',
    'formData'
  ]);
  
  analyzeSystemFlow('frontend/src/components/EventDetailsPage.jsx', 'Event Details Flow', [
    'registerForEvent',
    'unregisterFromEvent',
    'handleRegister',
    'handleUnregister',
    'onClick'
  ]);
  
  analyzeSystemFlow('frontend/src/components/EventListPage.jsx', 'Event List Flow', [
    'getEvents',
    'filterEvents',
    'searchEvents',
    'onClick',
    'navigation'
  ]);
  
  // Admin Flow
  analyzeSystemFlow('frontend/src/components/AdminDashboard.jsx', 'Admin Dashboard Flow', [
    'getAnalytics',
    'navigate',
    'onClick',
    'action-card',
    'dashboard'
  ]);
  
  analyzeSystemFlow('frontend/src/components/ManageUsersPage.jsx', 'User Management Flow', [
    'getUsers',
    'updateUser',
    'deleteUser',
    'approveUser',
    'handleAction'
  ]);
  
  // Profile Management Flow
  analyzeSystemFlow('frontend/src/components/ProfilePage.jsx', 'Profile Management Flow', [
    'updateProfile',
    'handleFormSubmit',
    'formData',
    'validation',
    'isEditing'
  ]);
  
  // Contact and Feedback Flow
  analyzeSystemFlow('frontend/src/components/ContactUsPage.jsx', 'Contact Flow', [
    'contactUs',
    'handleSubmit',
    'formData',
    'validation',
    'success'
  ]);
  
  analyzeSystemFlow('frontend/src/components/FeedbackPage.jsx', 'Feedback Flow', [
    'submitFeedback',
    'handleSubmit',
    'formData',
    'validation',
    'rating'
  ]);
  
  // Check API Integration
  console.log('\n🔗 API INTEGRATION VERIFICATION:');
  console.log('=' .repeat(40));
  
  const apiContent = fs.readFileSync('frontend/src/api/api.js', 'utf8');
  
  const apiFunctions = [
    'loginUser',
    'registerUser',
    'getEvents',
    'createEvent',
    'updateEvent',
    'deleteEvent',
    'registerForEvent',
    'unregisterFromEvent',
    'getUserProfile',
    'updateProfile',
    'uploadFile',
    'sendMessage',
    'submitFeedback',
    'contactUs',
    'getAnalytics',
    'getUsers',
    'updateUser',
    'deleteUser',
    'approveUser'
  ];
  
  apiFunctions.forEach(func => {
    const hasFunction = apiContent.includes(`export const ${func}`);
    logTest('functionality', `API Function - ${func}`, hasFunction, 
      hasFunction ? 'Function found' : 'Function missing');
  });
  
  // Check Email Flow Integration
  console.log('\n📧 EMAIL FLOW INTEGRATION:');
  console.log('=' .repeat(40));
  
  // Check if email functions are called in API
  const emailApiFunctions = [
    'forgotPassword',
    'resetPassword',
    'verifyEmail',
    'sendContactEmail',
    'sendFeedbackEmail',
    'sendEventNotification'
  ];
  
  emailApiFunctions.forEach(func => {
    const hasFunction = apiContent.includes(func);
    logTest('emails', `Email API Function - ${func}`, hasFunction, 
      hasFunction ? 'Function found' : 'Function missing');
  });
  
  // Check Backend Email Routes
  console.log('\n📧 BACKEND EMAIL ROUTES:');
  console.log('=' .repeat(40));
  
  const authRoutesContent = fs.readFileSync('backend/routes/authRoutes.js', 'utf8');
  const contactRoutesContent = fs.readFileSync('backend/routes/contactUsRoutes.js', 'utf8');
  const feedbackRoutesContent = fs.readFileSync('backend/routes/feedbackRoutes.js', 'utf8');
  
  const emailRoutes = [
    'forgot-password',
    'reset-password',
    'verify-email',
    'contact-us',
    'feedback'
  ];
  
  emailRoutes.forEach(route => {
    const hasRoute = authRoutesContent.includes(route) || 
                    contactRoutesContent.includes(route) || 
                    feedbackRoutesContent.includes(route);
    logTest('emails', `Email Route - ${route}`, hasRoute, 
      hasRoute ? 'Route found' : 'Route missing');
  });
  
  // Generate comprehensive report
  console.log('\n📊 EMAIL AND SYSTEM FLOW REPORT');
  console.log('=' .repeat(60));
  
  const categories = ['emails', 'flows', 'functionality'];
  
  categories.forEach(category => {
    const results = testResults[category];
    const total = results.passed + results.failed;
    const percentage = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
    
    console.log(`\n${category.toUpperCase()} VERIFICATION:`);
    console.log(`  ✅ Passed: ${results.passed}`);
    console.log(`  ❌ Failed: ${results.failed}`);
    console.log(`  📊 Success Rate: ${percentage}%`);
  });
  
  const overallTotal = testResults.overall.total;
  const overallPercentage = overallTotal > 0 ? ((testResults.overall.passed / overallTotal) * 100).toFixed(1) : 0;
  
  console.log(`\nOVERALL VERIFICATION:`);
  console.log(`  ✅ Total Passed: ${testResults.overall.passed}`);
  console.log(`  ❌ Total Failed: ${testResults.overall.failed}`);
  console.log(`  📊 Overall Success Rate: ${overallPercentage}%`);
  
  // System status
  if (overallPercentage >= 95) {
    console.log(`\n🎉 SYSTEM STATUS: EXCELLENT (${overallPercentage}%)`);
  } else if (overallPercentage >= 90) {
    console.log(`\n✅ SYSTEM STATUS: VERY GOOD (${overallPercentage}%)`);
  } else if (overallPercentage >= 80) {
    console.log(`\n⚠️ SYSTEM STATUS: GOOD (${overallPercentage}%)`);
  } else {
    console.log(`\n❌ SYSTEM STATUS: NEEDS ATTENTION (${overallPercentage}%)`);
  }
  
  // Save detailed report
  const reportData = {
    timestamp: new Date().toISOString(),
    results: testResults,
    summary: {
      overallPercentage: parseFloat(overallPercentage),
      status: overallPercentage >= 95 ? 'EXCELLENT' : 
              overallPercentage >= 90 ? 'VERY_GOOD' : 
              overallPercentage >= 80 ? 'GOOD' : 'NEEDS_ATTENTION'
    }
  };
  
  fs.writeFileSync('EMAIL_AND_SYSTEM_FLOW_REPORT.json', JSON.stringify(reportData, null, 2));
  console.log(`\n📄 Detailed report saved to: EMAIL_AND_SYSTEM_FLOW_REPORT.json`);
  
  console.log('\n📧 EMAIL AND SYSTEM FLOW VERIFICATION COMPLETED!');
  
  return reportData;
};

// Run the email and flow verification
runEmailAndFlowVerification();
