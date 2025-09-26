console.log('🔍 COMPREHENSIVE SYSTEM CHECK - LEVEL 2');
console.log('==========================================');
console.log('');

console.log('🔍 CHECKING CODE QUALITY...');
const fs = require('fs');

console.log('');
console.log('📋 CHECKING AUTH CONTROLLER...');
try {
  const authController = fs.readFileSync('backend/controllers/authController.js', 'utf8');
  
  // Check for key functions
  const hasRegister = authController.includes('exports.register') || authController.includes('register');
  const hasLogin = authController.includes('exports.login') || authController.includes('login');
  const hasForgotPassword = authController.includes('exports.forgotPassword') || authController.includes('forgotPassword');
  const hasResetPassword = authController.includes('exports.resetPassword') || authController.includes('resetPassword');
  
  console.log(`✅ Register function: ${hasRegister ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Login function: ${hasLogin ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Forgot Password function: ${hasForgotPassword ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Reset Password function: ${hasResetPassword ? 'EXISTS' : 'MISSING'}`);
  
  // Check for email integration
  const hasEmailIntegration = authController.includes('sendEmail') || authController.includes('emailTemplates');
  console.log(`✅ Email integration: ${hasEmailIntegration ? 'EXISTS' : 'MISSING'}`);
  
  // Check for proper exports
  const hasModuleExports = authController.includes('module.exports');
  console.log(`✅ Module exports: ${hasModuleExports ? 'EXISTS' : 'MISSING'}`);
  
} catch (error) {
  console.log(`❌ Auth Controller check failed: ${error.message}`);
}

console.log('');
console.log('📋 CHECKING USER CONTROLLER...');
try {
  const userController = fs.readFileSync('backend/controllers/userController.js', 'utf8');
  
  const hasGetProfile = userController.includes('exports.getProfile') || userController.includes('getProfile');
  const hasUpdateProfile = userController.includes('exports.updateProfile') || userController.includes('updateProfile');
  const hasChangePassword = userController.includes('exports.changePassword') || userController.includes('changePassword');
  
  console.log(`✅ Get Profile function: ${hasGetProfile ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Update Profile function: ${hasUpdateProfile ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Change Password function: ${hasChangePassword ? 'EXISTS' : 'MISSING'}`);
  
  // Check for email triggers
  const hasEmailTriggers = userController.includes('sendEmail') && userController.includes('getRegistrationTemplate');
  console.log(`✅ Email triggers: ${hasEmailTriggers ? 'EXISTS' : 'MISSING'}`);
  
} catch (error) {
  console.log(`❌ User Controller check failed: ${error.message}`);
}

console.log('');
console.log('📋 CHECKING EVENT CONTROLLER...');
try {
  const eventController = fs.readFileSync('backend/controllers/eventController.js', 'utf8');
  
  const hasCreateEvent = eventController.includes('exports.createEvent') || eventController.includes('createEvent');
  const hasUpdateEvent = eventController.includes('exports.updateEvent') || eventController.includes('updateEvent');
  const hasDeleteEvent = eventController.includes('exports.deleteEvent') || eventController.includes('deleteEvent');
  const hasGetEvents = eventController.includes('exports.getEvents') || eventController.includes('getEvents');
  
  console.log(`✅ Create Event function: ${hasCreateEvent ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Update Event function: ${hasUpdateEvent ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Delete Event function: ${hasDeleteEvent ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Get Events function: ${hasGetEvents ? 'EXISTS' : 'MISSING'}`);
  
  // Check for email notifications
  const hasEventNotifications = eventController.includes('eventNotification') && eventController.includes('sendEmail');
  console.log(`✅ Event notifications: ${hasEventNotifications ? 'EXISTS' : 'MISSING'}`);
  
} catch (error) {
  console.log(`❌ Event Controller check failed: ${error.message}`);
}

console.log('');
console.log('📋 CHECKING FILE CONTROLLER...');
try {
  const fileController = fs.readFileSync('backend/controllers/fileController.js', 'utf8');
  
  const hasUploadFile = fileController.includes('exports.uploadFile') || fileController.includes('uploadFile');
  const hasDownloadFile = fileController.includes('exports.downloadFile') || fileController.includes('downloadFile');
  const hasDeleteFile = fileController.includes('exports.deleteFile') || fileController.includes('deleteFile');
  
  console.log(`✅ Upload File function: ${hasUploadFile ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Download File function: ${hasDownloadFile ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Delete File function: ${hasDeleteFile ? 'EXISTS' : 'MISSING'}`);
  
  // Check for GridFS integration
  const hasGridFS = fileController.includes('GridFSBucket') && fileController.includes('multer');
  console.log(`✅ GridFS integration: ${hasGridFS ? 'EXISTS' : 'MISSING'}`);
  
} catch (error) {
  console.log(`❌ File Controller check failed: ${error.message}`);
}

console.log('');
console.log('📋 CHECKING EMAIL SYSTEM...');
try {
  const emailTemplates = fs.readFileSync('backend/utils/emailTemplates.js', 'utf8');
  const sendEmail = fs.readFileSync('backend/utils/sendEmail.js', 'utf8');
  
  // Check for key templates
  const hasRegistrationTemplate = emailTemplates.includes('getRegistrationTemplate') || emailTemplates.includes('getEventRegistrationConfirmationTemplate');
  const hasLoginTemplate = emailTemplates.includes('getLoginTemplate');
  const hasEventNotificationTemplate = emailTemplates.includes('getEventNotificationTemplate');
  const hasContactUsTemplate = emailTemplates.includes('getContactUsTemplate');
  const hasFeedbackTemplate = emailTemplates.includes('getFeedbackTemplate');
  
  console.log(`✅ Registration template: ${hasRegistrationTemplate ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Login template: ${hasLoginTemplate ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Event notification template: ${hasEventNotificationTemplate ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Contact Us template: ${hasContactUsTemplate ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Feedback template: ${hasFeedbackTemplate ? 'EXISTS' : 'MISSING'}`);
  
  // Check sendEmail function
  const hasSendEmailFunction = sendEmail.includes('sendEmail') && sendEmail.includes('nodemailer');
  console.log(`✅ Send Email function: ${hasSendEmailFunction ? 'EXISTS' : 'MISSING'}`);
  
  // Check for Gmail configuration
  const hasGmailConfig = sendEmail.includes('gmail') && sendEmail.includes('EMAIL_USER');
  console.log(`✅ Gmail configuration: ${hasGmailConfig ? 'EXISTS' : 'MISSING'}`);
  
} catch (error) {
  console.log(`❌ Email System check failed: ${error.message}`);
}

console.log('');
console.log('📋 CHECKING FRONTEND COMPONENTS...');

const components = [
  { name: 'LoginPage', file: 'frontend/src/components/LoginPage.jsx', checks: ['validateForm', 'handleSubmit', 'formErrors'] },
  { name: 'RegisterPage', file: 'frontend/src/components/RegisterPage.jsx', checks: ['validateForm', 'handleSubmit', 'formErrors'] },
  { name: 'ProfilePage', file: 'frontend/src/components/ProfilePage.jsx', checks: ['updateProfile', 'handleFormSubmit', 'isEditing'] },
  { name: 'EventListPage', file: 'frontend/src/components/EventListPage.jsx', checks: ['filterEvents', 'searchEvents', 'navigateToEvent'] },
  { name: 'EventDetailsPage', file: 'frontend/src/components/EventDetailsPage.jsx', checks: ['handleRegister', 'handleUnregister', 'unregisterFromEvent'] },
  { name: 'ContactUsPage', file: 'frontend/src/components/ContactUsPage.jsx', checks: ['contactUs', 'validateForm', 'formData'] },
  { name: 'FeedbackPage', file: 'frontend/src/components/FeedbackPage.jsx', checks: ['sendFeedbackEmail', 'validateForm', 'rating'] },
  { name: 'MessagesPage', file: 'frontend/src/components/MessagesPage.jsx', checks: ['getAllContactMessages', 'handleReply', 'markAsRead'] }
];

components.forEach(component => {
  try {
    const content = fs.readFileSync(component.file, 'utf8');
    console.log(`\n📄 ${component.name}:`);
    
    component.checks.forEach(check => {
      const hasCheck = content.includes(check);
      console.log(`   ${hasCheck ? '✅' : '❌'} ${check}: ${hasCheck ? 'EXISTS' : 'MISSING'}`);
    });
    
  } catch (error) {
    console.log(`❌ ${component.name} check failed: ${error.message}`);
  }
});

console.log('');
console.log('📋 CHECKING API INTEGRATION...');
try {
  const apiFile = fs.readFileSync('frontend/src/api/api.js', 'utf8');
  
  // Check for key API functions
  const hasLoginUser = apiFile.includes('export const loginUser');
  const hasRegisterUser = apiFile.includes('export const registerUser');
  const hasUpdateProfile = apiFile.includes('export const updateProfile');
  const hasContactUs = apiFile.includes('export const contactUs');
  const hasUploadFile = apiFile.includes('export const uploadFile');
  const hasUnregisterFromEvent = apiFile.includes('export const unregisterFromEvent');
  
  console.log(`✅ Login User API: ${hasLoginUser ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Register User API: ${hasRegisterUser ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Update Profile API: ${hasUpdateProfile ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Contact Us API: ${hasContactUs ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Upload File API: ${hasUploadFile ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Unregister From Event API: ${hasUnregisterFromEvent ? 'EXISTS' : 'MISSING'}`);
  
  // Check for error handling
  const hasErrorHandling = apiFile.includes('catch') && apiFile.includes('error');
  console.log(`✅ Error handling: ${hasErrorHandling ? 'EXISTS' : 'MISSING'}`);
  
} catch (error) {
  console.log(`❌ API Integration check failed: ${error.message}`);
}

console.log('');
console.log('🎯 LEVEL 2 CHECK COMPLETE');
console.log('==========================');
