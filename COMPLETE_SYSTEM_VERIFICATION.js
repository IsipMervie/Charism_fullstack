#!/usr/bin/env node

/**
 * COMPLETE SYSTEM VERIFICATION CHECK
 * Comprehensive verification of all system components
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const testResults = {
  backend: { passed: 0, failed: 0, tests: [] },
  frontend: { passed: 0, failed: 0, tests: [] },
  system: { passed: 0, failed: 0, tests: [] },
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
  logTest('system', description, exists, exists ? 'File exists' : `Missing: ${filePath}`);
  return exists;
};

const checkDirectoryExists = (dirPath, description) => {
  const exists = fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  logTest('system', description, exists, exists ? 'Directory exists' : `Missing: ${dirPath}`);
  return exists;
};

const checkFileContent = (filePath, description, requiredContent) => {
  if (!fs.existsSync(filePath)) {
    logTest('system', description, false, `File missing: ${filePath}`);
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const hasContent = requiredContent.some(req => content.includes(req));
  logTest('system', description, hasContent, hasContent ? 'Required content found' : 'Missing required content');
  return hasContent;
};

const checkDependencies = (dir, name) => {
  const nodeModulesExists = fs.existsSync(path.join(dir, 'node_modules'));
  logTest('system', `${name} Dependencies`, nodeModulesExists, nodeModulesExists ? 'Installed' : 'Missing');
  return nodeModulesExists;
};

const checkBuild = (dir, name) => {
  const buildExists = fs.existsSync(path.join(dir, 'build'));
  logTest('frontend', `${name} Build`, buildExists, buildExists ? 'Build exists' : 'Build missing');
  return buildExists;
};

const runCompleteSystemCheck = () => {
  console.log('🔍 COMPLETE SYSTEM VERIFICATION CHECK');
  console.log('=' .repeat(60));
  console.log('Checking all system components...');
  
  // Check Backend Structure
  console.log('\n📁 BACKEND SYSTEM CHECK:');
  console.log('=' .repeat(40));
  
  checkDirectoryExists('backend', 'Backend Directory');
  checkFileExists('backend/server.js', 'Main Server File');
  checkFileExists('backend/package.json', 'Backend Package.json');
  checkFileExists('backend/.env', 'Environment File');
  
  // Check Backend Directories
  checkDirectoryExists('backend/models', 'Models Directory');
  checkDirectoryExists('backend/controllers', 'Controllers Directory');
  checkDirectoryExists('backend/routes', 'Routes Directory');
  checkDirectoryExists('backend/utils', 'Utils Directory');
  checkDirectoryExists('backend/config', 'Config Directory');
  checkDirectoryExists('backend/middleware', 'Middleware Directory');
  
  // Check Backend Files
  checkFileExists('backend/models/User.js', 'User Model');
  checkFileExists('backend/models/Event.js', 'Event Model');
  checkFileExists('backend/models/Section.js', 'Section Model');
  checkFileExists('backend/models/YearLevel.js', 'YearLevel Model');
  checkFileExists('backend/models/Department.js', 'Department Model');
  checkFileExists('backend/models/AcademicYear.js', 'AcademicYear Model');
  checkFileExists('backend/models/Message.js', 'Message Model');
  checkFileExists('backend/models/Feedback.js', 'Feedback Model');
  
  checkFileExists('backend/controllers/authController.js', 'Auth Controller');
  checkFileExists('backend/controllers/eventController.js', 'Event Controller');
  checkFileExists('backend/controllers/adminController.js', 'Admin Controller');
  checkFileExists('backend/controllers/userController.js', 'User Controller');
  
  checkFileExists('backend/routes/authRoutes.js', 'Auth Routes');
  checkFileExists('backend/routes/eventRoutes.js', 'Event Routes');
  checkFileExists('backend/routes/adminRoutes.js', 'Admin Routes');
  checkFileExists('backend/routes/userRoutes.js', 'User Routes');
  checkFileExists('backend/routes/fileRoutes.js', 'File Routes');
  checkFileExists('backend/routes/messageRoutes.js', 'Message Routes');
  checkFileExists('backend/routes/feedbackRoutes.js', 'Feedback Routes');
  
  checkFileExists('backend/config/db.js', 'Database Config');
  checkFileExists('backend/utils/sendEmail.js', 'Email Utility');
  checkFileExists('backend/utils/errorHandler.js', 'Error Handler');
  
  // Check Backend Content
  checkFileContent('backend/server.js', 'Server CORS Setup', ['cors()', 'Access-Control-Allow-Origin']);
  checkFileContent('backend/server.js', 'Database Connection', ['mongoose', 'getLazyConnection']);
  checkFileContent('backend/server.js', 'Route Mounting', ['app.use', '/api/auth', '/api/events']);
  checkFileContent('backend/server.js', 'Error Handling', ['globalErrorHandler']);
  
  // Check Frontend Structure
  console.log('\n🌐 FRONTEND SYSTEM CHECK:');
  console.log('=' .repeat(40));
  
  checkDirectoryExists('frontend', 'Frontend Directory');
  checkFileExists('frontend/package.json', 'Frontend Package.json');
  checkFileExists('frontend/src/App.js', 'Main App Component');
  checkFileExists('frontend/src/index.js', 'Entry Point');
  checkFileExists('frontend/public/index.html', 'HTML Template');
  
  // Check Frontend Directories
  checkDirectoryExists('frontend/src/components', 'Components Directory');
  checkDirectoryExists('frontend/src/api', 'API Directory');
  checkDirectoryExists('frontend/src/utils', 'Utils Directory');
  checkDirectoryExists('frontend/src/contexts', 'Contexts Directory');
  
  // Check Frontend Files
  checkFileExists('frontend/src/components/NavigationBar.jsx', 'Navigation Component');
  checkFileExists('frontend/src/components/HomePage.jsx', 'Home Page');
  checkFileExists('frontend/src/components/LoginPage.jsx', 'Login Page');
  checkFileExists('frontend/src/components/RegisterPage.jsx', 'Register Page');
  checkFileExists('frontend/src/components/EventListPage.jsx', 'Event List Page');
  checkFileExists('frontend/src/components/EventDetailsPage.jsx', 'Event Details Page');
  checkFileExists('frontend/src/components/CreateEventPage.jsx', 'Create Event Page');
  checkFileExists('frontend/src/components/AdminDashboard.jsx', 'Admin Dashboard');
  checkFileExists('frontend/src/components/StaffDashboard.jsx', 'Staff Dashboard');
  checkFileExists('frontend/src/components/StudentDashboard.jsx', 'Student Dashboard');
  checkFileExists('frontend/src/components/ProfilePage.jsx', 'Profile Page');
  checkFileExists('frontend/src/components/SettingsPage.jsx', 'Settings Page');
  checkFileExists('frontend/src/components/ContactUsPage.jsx', 'Contact Us Page');
  checkFileExists('frontend/src/components/FeedbackPage.jsx', 'Feedback Page');
  
  checkFileExists('frontend/src/api/api.js', 'API Configuration');
  checkFileExists('frontend/src/utils/apiErrorHandler.js', 'API Error Handler');
  checkFileExists('frontend/src/contexts/ThemeContext.js', 'Theme Context');
  
  // Check Frontend Content
  checkFileContent('frontend/src/App.js', 'React Router Setup', ['<Routes>', '<Route']);
  checkFileContent('frontend/src/api/api.js', 'API Configuration', ['axios', 'BASE_URL']);
  checkFileContent('frontend/src/api/api.js', 'Missing API Functions Fixed', ['updateProfile', 'uploadFile', 'contactUs']);
  checkFileContent('frontend/src/components/ProfilePage.jsx', 'Profile Form Fixed', ['handleFormSubmit', 'formData', 'isEditing']);
  
  // Check Dependencies
  console.log('\n📦 DEPENDENCIES CHECK:');
  console.log('=' .repeat(40));
  
  checkDependencies('backend', 'Backend');
  checkDependencies('frontend', 'Frontend');
  
  // Check Build
  console.log('\n🏗️ BUILD CHECK:');
  console.log('=' .repeat(40));
  
  checkBuild('frontend', 'Frontend');
  
  // Check Recent Fixes
  console.log('\n🔧 RECENT FIXES VERIFICATION:');
  console.log('=' .repeat(40));
  
  // Check if ProfilePage has form functionality
  const profilePageContent = fs.readFileSync('frontend/src/components/ProfilePage.jsx', 'utf8');
  const hasFormFunctionality = profilePageContent.includes('handleFormSubmit') && 
                              profilePageContent.includes('formData') && 
                              profilePageContent.includes('isEditing');
  logTest('frontend', 'ProfilePage Form Functionality', hasFormFunctionality, 
    hasFormFunctionality ? 'Form functionality implemented' : 'Form functionality missing');
  
  // Check if API functions are added
  const apiContent = fs.readFileSync('frontend/src/api/api.js', 'utf8');
  const hasUpdateProfile = apiContent.includes('export const updateProfile');
  const hasUploadFile = apiContent.includes('export const uploadFile');
  const hasContactUs = apiContent.includes('export const contactUs');
  
  logTest('frontend', 'UpdateProfile API Function', hasUpdateProfile, 
    hasUpdateProfile ? 'Function added' : 'Function missing');
  logTest('frontend', 'UploadFile API Function', hasUploadFile, 
    hasUploadFile ? 'Function added' : 'Function missing');
  logTest('frontend', 'ContactUs API Function', hasContactUs, 
    hasContactUs ? 'Function added' : 'Function missing');
  
  // Check Dashboard Action Buttons
  const adminDashboardContent = fs.readFileSync('frontend/src/components/AdminDashboard.jsx', 'status');
  const staffDashboardContent = fs.readFileSync('frontend/src/components/StaffDashboard.jsx', 'utf8');
  const studentDashboardContent = fs.readFileSync('frontend/src/components/StudentDashboard.jsx', 'utf8');
  
  const adminHasActions = adminDashboardContent.includes('action-card') && adminDashboardContent.includes('onClick');
  const staffHasActions = staffDashboardContent.includes('action-card') && staffDashboardContent.includes('onClick');
  const studentHasActions = studentDashboardContent.includes('action-card') && studentDashboardContent.includes('onClick');
  
  logTest('frontend', 'AdminDashboard Action Buttons', adminHasActions, 
    adminHasActions ? 'Action buttons present' : 'Action buttons missing');
  logTest('frontend', 'StaffDashboard Action Buttons', staffHasActions, 
    staffHasActions ? 'Action buttons present' : 'Action buttons missing');
  logTest('frontend', 'StudentDashboard Action Buttons', studentHasActions, 
    studentHasActions ? 'Action buttons present' : 'Action buttons missing');
  
  // Generate comprehensive report
  console.log('\n📊 COMPLETE SYSTEM VERIFICATION REPORT');
  console.log('=' .repeat(60));
  
  const categories = ['backend', 'frontend', 'system'];
  
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
  
  fs.writeFileSync('COMPLETE_SYSTEM_VERIFICATION_REPORT.json', JSON.stringify(reportData, null, 2));
  console.log(`\n📄 Detailed report saved to: COMPLETE_SYSTEM_VERIFICATION_REPORT.json`);
  
  console.log('\n🔍 COMPLETE SYSTEM VERIFICATION COMPLETED!');
  
  return reportData;
};

// Run the complete system check
runCompleteSystemCheck();
