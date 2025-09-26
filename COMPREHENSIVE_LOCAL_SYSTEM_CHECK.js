console.log('🔍 COMPREHENSIVE LOCAL SYSTEM CHECK');
console.log('=====================================');
console.log('');

const fs = require('fs');
const path = require('path');

console.log('📁 CHECKING ALL FRONTEND PAGES...');
const frontendPages = [
  'frontend/src/components/LoginPage.jsx',
  'frontend/src/components/RegisterPage.jsx',
  'frontend/src/components/ProfilePage.jsx',
  'frontend/src/components/EventListPage.jsx',
  'frontend/src/components/EventDetailsPage.jsx',
  'frontend/src/components/EventAttendancePage.jsx',
  'frontend/src/components/EventChatPage.jsx',
  'frontend/src/components/EventChatListPage.jsx',
  'frontend/src/components/ContactUsPage.jsx',
  'frontend/src/components/FeedbackPage.jsx',
  'frontend/src/components/MessagesPage.jsx',
  'frontend/src/components/AdminDashboard.jsx',
  'frontend/src/components/StaffDashboard.jsx',
  'frontend/src/components/StudentDashboard.jsx',
  'frontend/src/components/CreateEventPage.jsx',
  'frontend/src/components/ManageUsersPage.jsx',
  'frontend/src/components/ManageEventsPage.jsx',
  'frontend/src/components/AdminManageFeedbackPage.jsx',
  'frontend/src/components/AdminManageMessagesPage.jsx',
  'frontend/src/components/ProfilePictureUpload.jsx',
  'frontend/src/components/EventDocumentationUpload.jsx',
  'frontend/src/components/StudentDocumentationPage.jsx'
];

let pageStatus = { existing: 0, missing: 0, errors: [] };

frontendPages.forEach(page => {
  try {
    if (fs.existsSync(page)) {
      pageStatus.existing++;
      console.log(`✅ ${page} - EXISTS`);
      
      // Check if page has essential functions
      const content = fs.readFileSync(page, 'utf8');
      const hasForm = content.includes('form') || content.includes('Form');
      const hasSubmit = content.includes('handleSubmit') || content.includes('onSubmit');
      const hasValidation = content.includes('validateForm') || content.includes('validation');
      const hasAPI = content.includes('api') || content.includes('fetch') || content.includes('axios');
      
      console.log(`   📋 Form: ${hasForm ? '✅' : '❌'} | Submit: ${hasSubmit ? '✅' : '❌'} | Validation: ${hasValidation ? '✅' : '❌'} | API: ${hasAPI ? '✅' : '❌'}`);
    } else {
      pageStatus.missing++;
      pageStatus.errors.push(page);
      console.log(`❌ ${page} - MISSING`);
    }
  } catch (error) {
    pageStatus.errors.push(`${page}: ${error.message}`);
    console.log(`⚠️ ${page} - ERROR: ${error.message}`);
  }
});

console.log('');
console.log(`📊 FRONTEND PAGES: ${pageStatus.existing}/${frontendPages.length} exist`);

console.log('');
console.log('📁 CHECKING ALL BACKEND CONTROLLERS...');
const backendControllers = [
  'backend/controllers/authController.js',
  'backend/controllers/userController.js',
  'backend/controllers/eventController.js',
  'backend/controllers/fileController.js',
  'backend/controllers/adminController.js',
  'backend/controllers/contactController.js',
  'backend/controllers/feedbackController.js'
];

let controllerStatus = { existing: 0, missing: 0, errors: [] };

backendControllers.forEach(controller => {
  try {
    if (fs.existsSync(controller)) {
      controllerStatus.existing++;
      console.log(`✅ ${controller} - EXISTS`);
      
      // Check if controller has essential functions
      const content = fs.readFileSync(controller, 'utf8');
      const hasExports = content.includes('exports.') || content.includes('module.exports');
      const hasErrorHandling = content.includes('try') && content.includes('catch');
      const hasEmailIntegration = content.includes('sendEmail') || content.includes('emailTemplates');
      
      console.log(`   🔧 Exports: ${hasExports ? '✅' : '❌'} | Error Handling: ${hasErrorHandling ? '✅' : '❌'} | Email: ${hasEmailIntegration ? '✅' : '❌'}`);
    } else {
      controllerStatus.missing++;
      controllerStatus.errors.push(controller);
      console.log(`❌ ${controller} - MISSING`);
    }
  } catch (error) {
    controllerStatus.errors.push(`${controller}: ${error.message}`);
    console.log(`⚠️ ${controller} - ERROR: ${error.message}`);
  }
});

console.log('');
console.log(`📊 BACKEND CONTROLLERS: ${controllerStatus.existing}/${backendControllers.length} exist`);

console.log('');
console.log('📁 CHECKING ALL API FUNCTIONS...');
try {
  const apiFile = fs.readFileSync('frontend/src/api/api.js', 'utf8');
  const apiFunctions = apiFile.match(/export const \w+/g) || [];
  console.log(`✅ API Functions: ${apiFunctions.length} functions available`);
  
  // Check for key API functions
  const keyFunctions = [
    'loginUser', 'registerUser', 'updateProfile', 'contactUs', 'uploadFile',
    'registerForEvent', 'unregisterFromEvent', 'sendFeedbackEmail', 'getAllContactMessages',
    'createEvent', 'updateEvent', 'deleteEvent', 'getEvents', 'getAllEvents'
  ];
  
  keyFunctions.forEach(func => {
    const hasFunction = apiFile.includes(`export const ${func}`);
    console.log(`   ${hasFunction ? '✅' : '❌'} ${func}`);
  });
  
} catch (error) {
  console.log(`❌ API Functions check failed: ${error.message}`);
}

console.log('');
console.log('📁 CHECKING EMAIL SYSTEM...');
try {
  const emailTemplates = fs.readFileSync('backend/utils/emailTemplates.js', 'utf8');
  const sendEmail = fs.readFileSync('backend/utils/sendEmail.js', 'utf8');
  
  const templateFunctions = emailTemplates.match(/const get\w+Template/g) || [];
  console.log(`✅ Email Templates: ${templateFunctions.length} templates available`);
  
  const hasSendEmail = sendEmail.includes('sendEmail') && sendEmail.includes('nodemailer');
  console.log(`✅ Send Email Function: ${hasSendEmail ? 'EXISTS' : 'MISSING'}`);
  
  const hasGmailConfig = sendEmail.includes('gmail') && sendEmail.includes('EMAIL_USER');
  console.log(`✅ Gmail Configuration: ${hasGmailConfig ? 'EXISTS' : 'MISSING'}`);
  
} catch (error) {
  console.log(`❌ Email System check failed: ${error.message}`);
}

console.log('');
console.log('📁 CHECKING FILE SYSTEM...');
try {
  const fileController = fs.readFileSync('backend/controllers/fileController.js', 'utf8');
  
  const hasGridFS = fileController.includes('GridFSBucket') && fileController.includes('mongodb');
  console.log(`✅ GridFS Integration: ${hasGridFS ? 'EXISTS' : 'MISSING'}`);
  
  const hasUploadFile = fileController.includes('exports.uploadFile');
  console.log(`✅ Upload File Function: ${hasUploadFile ? 'EXISTS' : 'MISSING'}`);
  
  const hasDownloadFile = fileController.includes('exports.downloadFile');
  console.log(`✅ Download File Function: ${hasDownloadFile ? 'EXISTS' : 'MISSING'}`);
  
  const hasDeleteFile = fileController.includes('exports.deleteFile');
  console.log(`✅ Delete File Function: ${hasDeleteFile ? 'EXISTS' : 'MISSING'}`);
  
} catch (error) {
  console.log(`❌ File System check failed: ${error.message}`);
}

console.log('');
console.log('📁 CHECKING DEPLOYMENT CONFIGURATION...');
try {
  const renderConfig = fs.readFileSync('render.yaml', 'utf8');
  
  const hasWebService = renderConfig.includes('type: web');
  console.log(`✅ Web Service (Backend): ${hasWebService ? 'EXISTS' : 'MISSING'}`);
  
  const hasStaticService = renderConfig.includes('type: static');
  console.log(`✅ Static Service (Frontend): ${hasStaticService ? 'EXISTS' : 'MISSING'}`);
  
  const hasBackendBuild = renderConfig.includes('buildCommand: cd backend');
  console.log(`✅ Backend Build Command: ${hasBackendBuild ? 'EXISTS' : 'MISSING'}`);
  
  const hasFrontendBuild = renderConfig.includes('buildCommand: cd frontend');
  console.log(`✅ Frontend Build Command: ${hasFrontendBuild ? 'EXISTS' : 'MISSING'}`);
  
} catch (error) {
  console.log(`❌ Deployment Configuration check failed: ${error.message}`);
}

console.log('');
console.log('🎯 LOCAL SYSTEM CHECK COMPLETE');
console.log('==============================');
