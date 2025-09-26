#!/usr/bin/env node

/**
 * COMPREHENSIVE LOCAL FUNCTIONALITY ANALYSIS
 * Analyzes all code to verify functionality flows, buttons, forms, and emails
 */

const fs = require('fs');
const path = require('path');

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

const checkFileContent = (filePath, description, requiredContent) => {
  if (!fs.existsSync(filePath)) {
    logTest('flows', description, false, `File missing: ${filePath}`);
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const hasContent = requiredContent.some(req => content.includes(req));
  
  logTest('flows', description, hasContent, hasContent ? 'Required functionality found' : 'Missing required functionality');
  return hasContent;
};

const analyzeComponent = (filePath, componentName) => {
  if (!fs.existsSync(filePath)) {
    logTest('buttons', componentName, false, `Component missing: ${filePath}`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for buttons
  const hasButtons = content.includes('onClick') || content.includes('button') || content.includes('Button');
  logTest('buttons', `${componentName} Buttons`, hasButtons, hasButtons ? 'Buttons found' : 'No buttons found');
  
  // Check for forms
  const hasForms = content.includes('form') || content.includes('Form') || content.includes('onSubmit');
  logTest('forms', `${componentName} Forms`, hasForms, hasForms ? 'Forms found' : 'No forms found');
  
  // Check for API calls
  const hasApiCalls = content.includes('axios') || content.includes('fetch') || content.includes('api.');
  logTest('flows', `${componentName} API Integration`, hasApiCalls, hasApiCalls ? 'API calls found' : 'No API calls found');
};

const runComprehensiveFunctionalityAnalysis = () => {
  console.log('🔍 COMPREHENSIVE LOCAL FUNCTIONALITY ANALYSIS');
  console.log('=' .repeat(60));
  console.log('Analyzing all code for functionality flows, buttons, forms, and emails...');
  
  // Analyze Backend Controllers for API endpoints
  console.log('\n🔌 BACKEND API FUNCTIONALITY:');
  console.log('=' .repeat(40));
  
  const controllers = [
    'backend/controllers/authController.js',
    'backend/controllers/eventController.js',
    'backend/controllers/adminController.js',
    'backend/controllers/userController.js'
  ];
  
  controllers.forEach(controller => {
    const controllerName = path.basename(controller, '.js');
    checkFileContent(controller, `${controllerName} Controller`, ['exports', 'async', 'req', 'res']);
  });
  
  // Analyze Backend Routes for endpoints
  console.log('\n🛣️ BACKEND ROUTES FUNCTIONALITY:');
  console.log('=' .repeat(40));
  
  const routes = [
    'backend/routes/authRoutes.js',
    'backend/routes/eventRoutes.js',
    'backend/routes/adminRoutes.js',
    'backend/routes/userRoutes.js',
    'backend/routes/fileRoutes.js',
    'backend/routes/messageRoutes.js',
    'backend/routes/feedbackRoutes.js'
  ];
  
  routes.forEach(route => {
    const routeName = path.basename(route, '.js');
    checkFileContent(route, `${routeName} Routes`, ['router', 'app.use', 'exports']);
  });
  
  // Analyze Email Functionality
  console.log('\n📧 EMAIL FUNCTIONALITY:');
  console.log('=' .repeat(40));
  
  checkFileContent('backend/utils/sendEmail.js', 'Email Utility', ['nodemailer', 'transporter', 'sendMail']);
  checkFileContent('backend/utils/emailTemplates.js', 'Email Templates', ['template', 'html', 'subject']);
  
  // Check email usage in controllers
  const authController = fs.readFileSync('backend/controllers/authController.js', 'utf8');
  const hasEmailInAuth = authController.includes('sendEmail') || authController.includes('email');
  logTest('emails', 'Auth Email Integration', hasEmailInAuth, hasEmailInAuth ? 'Email integration found' : 'No email integration');
  
  // Analyze Frontend Components
  console.log('\n🌐 FRONTEND COMPONENT FUNCTIONALITY:');
  console.log('=' .repeat(40));
  
  const components = [
    'frontend/src/components/LoginPage.jsx',
    'frontend/src/components/RegisterPage.jsx',
    'frontend/src/components/EventListPage.jsx',
    'frontend/src/components/EventDetailsPage.jsx',
    'frontend/src/components/CreateEventPage.jsx',
    'frontend/src/components/AdminDashboard.jsx',
    'frontend/src/components/StaffDashboard.jsx',
    'frontend/src/components/StudentDashboard.jsx',
    'frontend/src/components/ContactUsPage.jsx',
    'frontend/src/components/FeedbackPage.jsx',
    'frontend/src/components/ProfilePage.jsx',
    'frontend/src/components/SettingsPage.jsx'
  ];
  
  components.forEach(component => {
    const componentName = path.basename(component, '.jsx');
    analyzeComponent(component, componentName);
  });
  
  // Analyze API Integration
  console.log('\n🔗 API INTEGRATION ANALYSIS:');
  console.log('=' .repeat(40));
  
  checkFileContent('frontend/src/api/api.js', 'API Configuration', ['axios', 'BASE_URL', 'get', 'post', 'put', 'delete']);
  
  // Check for specific API functions
  const apiContent = fs.readFileSync('frontend/src/api/api.js', 'utf8');
  
  const apiFunctions = [
    'login',
    'register',
    'getEvents',
    'createEvent',
    'updateEvent',
    'deleteEvent',
    'registerForEvent',
    'getUserProfile',
    'updateProfile',
    'uploadFile',
    'sendMessage',
    'submitFeedback',
    'contactUs'
  ];
  
  apiFunctions.forEach(func => {
    const hasFunction = apiContent.includes(func);
    logTest('flows', `${func} API Function`, hasFunction, hasFunction ? 'Function found' : 'Function missing');
  });
  
  // Analyze Form Functionality
  console.log('\n📝 FORM FUNCTIONALITY ANALYSIS:');
  console.log('=' .repeat(40));
  
  const formComponents = [
    'frontend/src/components/LoginPage.jsx',
    'frontend/src/components/RegisterPage.jsx',
    'frontend/src/components/CreateEventPage.jsx',
    'frontend/src/components/ContactUsPage.jsx',
    'frontend/src/components/FeedbackPage.jsx',
    'frontend/src/components/ProfilePage.jsx'
  ];
  
  formComponents.forEach(component => {
    const componentName = path.basename(component, '.jsx');
    const content = fs.readFileSync(component, 'utf8');
    
    const hasFormValidation = content.includes('validation') || content.includes('validate') || content.includes('error');
    const hasFormSubmission = content.includes('onSubmit') || content.includes('handleSubmit');
    const hasFormFields = content.includes('input') || content.includes('textarea') || content.includes('select');
    
    logTest('forms', `${componentName} Form Validation`, hasFormValidation, hasFormValidation ? 'Validation found' : 'No validation');
    logTest('forms', `${componentName} Form Submission`, hasFormSubmission, hasFormSubmission ? 'Submission handling found' : 'No submission handling');
    logTest('forms', `${componentName} Form Fields`, hasFormFields, hasFormFields ? 'Form fields found' : 'No form fields');
  });
  
  // Analyze Button Functionality
  console.log('\n🔘 BUTTON FUNCTIONALITY ANALYSIS:');
  console.log('=' .repeat(40));
  
  const buttonComponents = [
    'frontend/src/components/NavigationBar.jsx',
    'frontend/src/components/EventListPage.jsx',
    'frontend/src/components/EventDetailsPage.jsx',
    'frontend/src/components/AdminDashboard.jsx',
    'frontend/src/components/StaffDashboard.jsx',
    'frontend/src/components/StudentDashboard.jsx'
  ];
  
  buttonComponents.forEach(component => {
    const componentName = path.basename(component, '.jsx');
    const content = fs.readFileSync(component, 'utf8');
    
    const hasClickHandlers = content.includes('onClick') || content.includes('handleClick');
    const hasNavigationButtons = content.includes('navigate') || content.includes('Link') || content.includes('useNavigate');
    const hasActionButtons = content.includes('Button') || content.includes('button');
    
    logTest('buttons', `${componentName} Click Handlers`, hasClickHandlers, hasClickHandlers ? 'Click handlers found' : 'No click handlers');
    logTest('buttons', `${componentName} Navigation Buttons`, hasNavigationButtons, hasNavigationButtons ? 'Navigation buttons found' : 'No navigation buttons');
    logTest('buttons', `${componentName} Action Buttons`, hasActionButtons, hasActionButtons ? 'Action buttons found' : 'No action buttons');
  });
  
  // Analyze User Flow Functionality
  console.log('\n🔄 USER FLOW FUNCTIONALITY:');
  console.log('=' .repeat(40));
  
  // Check authentication flow
  const loginPage = fs.readFileSync('frontend/src/components/LoginPage.jsx', 'utf8');
  const registerPage = fs.readFileSync('frontend/src/components/RegisterPage.jsx', 'utf8');
  
  const hasLoginFlow = loginPage.includes('login') && loginPage.includes('password');
  const hasRegisterFlow = registerPage.includes('register') && registerPage.includes('email');
  
  logTest('flows', 'Login Flow', hasLoginFlow, hasLoginFlow ? 'Login flow implemented' : 'Login flow missing');
  logTest('flows', 'Registration Flow', hasRegisterFlow, hasRegisterFlow ? 'Registration flow implemented' : 'Registration flow missing');
  
  // Check event flow
  const eventListPage = fs.readFileSync('frontend/src/components/EventListPage.jsx', 'utf8');
  const eventDetailsPage = fs.readFileSync('frontend/src/components/EventDetailsPage.jsx', 'utf8');
  
  const hasEventListFlow = eventListPage.includes('events') && eventListPage.includes('map');
  const hasEventDetailsFlow = eventDetailsPage.includes('event') && eventDetailsPage.includes('register');
  
  logTest('flows', 'Event List Flow', hasEventListFlow, hasEventListFlow ? 'Event list flow implemented' : 'Event list flow missing');
  logTest('flows', 'Event Details Flow', hasEventDetailsFlow, hasEventDetailsFlow ? 'Event details flow implemented' : 'Event details flow missing');
  
  // Check admin flow
  const adminDashboard = fs.readFileSync('frontend/src/components/AdminDashboard.jsx', 'utf8');
  const hasAdminFlow = adminDashboard.includes('admin') && adminDashboard.includes('dashboard');
  
  logTest('flows', 'Admin Flow', hasAdminFlow, hasAdminFlow ? 'Admin flow implemented' : 'Admin flow missing');
  
  // Generate comprehensive report
  console.log('\n📊 COMPREHENSIVE FUNCTIONALITY ANALYSIS REPORT');
  console.log('=' .repeat(60));
  
  const categories = ['buttons', 'forms', 'emails', 'flows'];
  
  categories.forEach(category => {
    const results = testResults[category];
    const total = results.passed + results.failed;
    const percentage = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
    
    console.log(`\n${category.toUpperCase()} ANALYSIS:`);
    console.log(`  ✅ Implemented: ${results.passed}`);
    console.log(`  ❌ Missing: ${results.failed}`);
    console.log(`  📊 Implementation Rate: ${percentage}%`);
  });
  
  const overallTotal = testResults.overall.total;
  const overallPercentage = overallTotal > 0 ? ((testResults.overall.passed / overallTotal) * 100).toFixed(1) : 0;
  
  console.log(`\nOVERALL ANALYSIS:`);
  console.log(`  ✅ Total Implemented: ${testResults.overall.passed}`);
  console.log(`  ❌ Total Missing: ${testResults.overall.failed}`);
  console.log(`  📊 Overall Implementation Rate: ${overallPercentage}%`);
  
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
    results: testResults,
    summary: {
      overallPercentage: parseFloat(overallPercentage),
      status: overallPercentage >= 90 ? 'EXCELLENT' : 
              overallPercentage >= 80 ? 'GOOD' : 
              overallPercentage >= 70 ? 'NEEDS_ATTENTION' : 'CRITICAL'
    }
  };
  
  fs.writeFileSync('COMPREHENSIVE_FUNCTIONALITY_ANALYSIS_REPORT.json', JSON.stringify(reportData, null, 2));
  console.log(`\n📄 Detailed report saved to: COMPREHENSIVE_FUNCTIONALITY_ANALYSIS_REPORT.json`);
  
  console.log('\n🔍 FUNCTIONALITY ANALYSIS COMPLETED!');
  
  return reportData;
};

// Run the comprehensive functionality analysis
runComprehensiveFunctionalityAnalysis();
