#!/usr/bin/env node

/**
 * LOCAL SYSTEM STRUCTURE VERIFICATION
 * Checks all files, routes, and components exist and are properly structured
 */

const fs = require('fs');
const path = require('path');

const testResults = {
  backend: { passed: 0, failed: 0, tests: [] },
  frontend: { passed: 0, failed: 0, tests: [] },
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

const checkFileExists = (filePath, description) => {
  const exists = fs.existsSync(filePath);
  logTest('backend', description, exists, exists ? 'File exists' : `Missing: ${filePath}`);
  return exists;
};

const checkDirectoryExists = (dirPath, description) => {
  const exists = fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  logTest('backend', description, exists, exists ? 'Directory exists' : `Missing: ${dirPath}`);
  return exists;
};

const checkFileContent = (filePath, description, requiredContent) => {
  if (!fs.existsSync(filePath)) {
    logTest('backend', description, false, `File missing: ${filePath}`);
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const hasContent = requiredContent.some(req => content.includes(req));
  logTest('backend', description, hasContent, hasContent ? 'Required content found' : 'Missing required content');
  return hasContent;
};

const checkFrontendFile = (filePath, description) => {
  const exists = fs.existsSync(filePath);
  logTest('frontend', description, exists, exists ? 'File exists' : `Missing: ${filePath}`);
  return exists;
};

const runLocalVerification = () => {
  console.log('🔍 LOCAL SYSTEM STRUCTURE VERIFICATION');
  console.log('=' .repeat(50));
  
  // Backend Structure Checks
  console.log('\n📁 BACKEND STRUCTURE:');
  
  // Core files
  checkFileExists('backend/server.js', 'Main Server File');
  checkFileExists('backend/package.json', 'Package Configuration');
  checkFileExists('backend/.env', 'Environment File');
  
  // Configuration
  checkDirectoryExists('backend/config', 'Config Directory');
  checkFileExists('backend/config/db.js', 'Database Configuration');
  
  // Models
  checkDirectoryExists('backend/models', 'Models Directory');
  checkFileExists('backend/models/User.js', 'User Model');
  checkFileExists('backend/models/Event.js', 'Event Model');
  checkFileExists('backend/models/Section.js', 'Section Model');
  checkFileExists('backend/models/YearLevel.js', 'YearLevel Model');
  checkFileExists('backend/models/Department.js', 'Department Model');
  checkFileExists('backend/models/AcademicYear.js', 'AcademicYear Model');
  checkFileExists('backend/models/Message.js', 'Message Model');
  checkFileExists('backend/models/Feedback.js', 'Feedback Model');
  
  // Controllers
  checkDirectoryExists('backend/controllers', 'Controllers Directory');
  checkFileExists('backend/controllers/authController.js', 'Auth Controller');
  checkFileExists('backend/controllers/eventController.js', 'Event Controller');
  checkFileExists('backend/controllers/adminController.js', 'Admin Controller');
  checkFileExists('backend/controllers/userController.js', 'User Controller');
  
  // Routes
  checkDirectoryExists('backend/routes', 'Routes Directory');
  checkFileExists('backend/routes/authRoutes.js', 'Auth Routes');
  checkFileExists('backend/routes/eventRoutes.js', 'Event Routes');
  checkFileExists('backend/routes/adminRoutes.js', 'Admin Routes');
  checkFileExists('backend/routes/userRoutes.js', 'User Routes');
  checkFileExists('backend/routes/fileRoutes.js', 'File Routes');
  checkFileExists('backend/routes/messageRoutes.js', 'Message Routes');
  checkFileExists('backend/routes/feedbackRoutes.js', 'Feedback Routes');
  
  // Utilities
  checkDirectoryExists('backend/utils', 'Utils Directory');
  checkFileExists('backend/utils/sendEmail.js', 'Email Utility');
  checkFileExists('backend/utils/errorHandler.js', 'Error Handler');
  
  // Middleware
  checkDirectoryExists('backend/middleware', 'Middleware Directory');
  
  // Server.js content checks
  checkFileContent('backend/server.js', 'Server CORS Setup', ['cors()', 'Access-Control-Allow-Origin']);
  checkFileContent('backend/server.js', 'Database Connection', ['mongoose', 'getLazyConnection']);
  checkFileContent('backend/server.js', 'Route Mounting', ['app.use', '/api/auth', '/api/events']);
  checkFileContent('backend/server.js', 'Error Handling', ['globalErrorHandler']);
  
  // Frontend Structure Checks
  console.log('\n🌐 FRONTEND STRUCTURE:');
  
  // Core files
  checkFrontendFile('frontend/package.json', 'Package Configuration');
  checkFrontendFile('frontend/src/App.js', 'Main App Component');
  checkFrontendFile('frontend/src/index.js', 'Entry Point');
  checkFrontendFile('frontend/public/index.html', 'HTML Template');
  
  // Components
  checkFrontendFile('frontend/src/components/NavigationBar.jsx', 'Navigation Component');
  checkFrontendFile('frontend/src/components/HomePage.jsx', 'Home Page');
  checkFrontendFile('frontend/src/components/LoginPage.jsx', 'Login Page');
  checkFrontendFile('frontend/src/components/RegisterPage.jsx', 'Register Page');
  checkFrontendFile('frontend/src/components/EventListPage.jsx', 'Event List Page');
  checkFrontendFile('frontend/src/components/EventDetailsPage.jsx', 'Event Details Page');
  checkFrontendFile('frontend/src/components/CreateEventPage.jsx', 'Create Event Page');
  checkFrontendFile('frontend/src/components/AdminDashboard.jsx', 'Admin Dashboard');
  checkFrontendFile('frontend/src/components/StaffDashboard.jsx', 'Staff Dashboard');
  checkFrontendFile('frontend/src/components/StudentDashboard.jsx', 'Student Dashboard');
  
  // API and Utils
  checkFrontendFile('frontend/src/api/api.js', 'API Configuration');
  checkFrontendFile('frontend/src/utils/apiErrorHandler.js', 'API Error Handler');
  
  // Contexts
  checkFrontendFile('frontend/src/contexts/ThemeContext.js', 'Theme Context');
  
  // Routes in App.js
  const appContent = fs.readFileSync('frontend/src/App.js', 'utf8');
  const hasRoutes = appContent.includes('<Routes>') && appContent.includes('<Route');
  logTest('frontend', 'React Router Setup', hasRoutes, hasRoutes ? 'Routes configured' : 'Missing route configuration');
  
  // API Configuration
  const apiContent = fs.readFileSync('frontend/src/api/api.js', 'utf8');
  const hasApiConfig = apiContent.includes('BASE_URL') || apiContent.includes('axios');
  logTest('frontend', 'API Configuration', hasApiConfig, hasApiConfig ? 'API configured' : 'Missing API configuration');
  
  // Generate Report
  console.log('\n📊 VERIFICATION RESULTS:');
  console.log('=' .repeat(50));
  
  const backendTotal = testResults.backend.passed + testResults.backend.failed;
  const frontendTotal = testResults.frontend.passed + testResults.frontend.failed;
  
  console.log(`BACKEND: ${testResults.backend.passed}/${backendTotal} (${((testResults.backend.passed/backendTotal)*100).toFixed(1)}%)`);
  console.log(`FRONTEND: ${testResults.frontend.passed}/${frontendTotal} (${((testResults.frontend.passed/frontendTotal)*100).toFixed(1)}%)`);
  console.log(`OVERALL: ${testResults.overall.passed}/${testResults.overall.total} (${((testResults.overall.passed/testResults.overall.total)*100).toFixed(1)}%)`);
  
  // System Status
  const overallPercentage = (testResults.overall.passed / testResults.overall.total) * 100;
  
  if (overallPercentage >= 95) {
    console.log('\n🎉 SYSTEM STATUS: EXCELLENT - All components present!');
  } else if (overallPercentage >= 85) {
    console.log('\n✅ SYSTEM STATUS: GOOD - Minor issues detected');
  } else if (overallPercentage >= 70) {
    console.log('\n⚠️ SYSTEM STATUS: NEEDS ATTENTION - Several issues found');
  } else {
    console.log('\n❌ SYSTEM STATUS: CRITICAL - Major issues detected');
  }
  
  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    results: testResults,
    summary: {
      backendPercentage: ((testResults.backend.passed/backendTotal)*100).toFixed(1),
      frontendPercentage: ((testResults.frontend.passed/frontendTotal)*100).toFixed(1),
      overallPercentage: overallPercentage.toFixed(1),
      status: overallPercentage >= 95 ? 'EXCELLENT' : 
              overallPercentage >= 85 ? 'GOOD' : 
              overallPercentage >= 70 ? 'NEEDS_ATTENTION' : 'CRITICAL'
    }
  };
  
  fs.writeFileSync('LOCAL_SYSTEM_VERIFICATION_REPORT.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Report saved to: LOCAL_SYSTEM_VERIFICATION_REPORT.json');
  
  return report;
};

// Run verification
runLocalVerification();
