console.log('🔍 COMPREHENSIVE SYSTEM CHECK - LEVEL 3');
console.log('==========================================');
console.log('');

console.log('🔍 CHECKING SYSTEM FLOW AND USER JOURNEYS...');

const fs = require('fs');

console.log('');
console.log('👤 USER REGISTRATION FLOW...');
try {
  const registerPage = fs.readFileSync('frontend/src/components/RegisterPage.jsx', 'utf8');
  const authController = fs.readFileSync('backend/controllers/authController.js', 'utf8');
  const apiFile = fs.readFileSync('frontend/src/api/api.js', 'utf8');
  
  // Check registration flow components
  const hasRegistrationForm = registerPage.includes('form') && registerPage.includes('onSubmit');
  const hasRegistrationAPI = apiFile.includes('registerUser');
  const hasRegistrationBackend = authController.includes('register');
  const hasRegistrationEmail = authController.includes('sendEmail') && authController.includes('getRegistrationTemplate');
  
  console.log(`✅ Registration form: ${hasRegistrationForm ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Registration API: ${hasRegistrationAPI ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Registration backend: ${hasRegistrationBackend ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Registration email: ${hasRegistrationEmail ? 'EXISTS' : 'MISSING'}`);
  
  const registrationFlowComplete = hasRegistrationForm && hasRegistrationAPI && hasRegistrationBackend && hasRegistrationEmail;
  console.log(`🎯 Registration flow: ${registrationFlowComplete ? 'COMPLETE' : 'INCOMPLETE'}`);
  
} catch (error) {
  console.log(`❌ Registration flow check failed: ${error.message}`);
}

console.log('');
console.log('🔐 USER LOGIN FLOW...');
try {
  const loginPage = fs.readFileSync('frontend/src/components/LoginPage.jsx', 'utf8');
  const authController = fs.readFileSync('backend/controllers/authController.js', 'utf8');
  const apiFile = fs.readFileSync('frontend/src/api/api.js', 'utf8');
  
  const hasLoginForm = loginPage.includes('form') && loginPage.includes('onSubmit');
  const hasLoginAPI = apiFile.includes('loginUser');
  const hasLoginBackend = authController.includes('login');
  const hasLoginEmail = authController.includes('sendEmail') && authController.includes('getLoginTemplate');
  
  console.log(`✅ Login form: ${hasLoginForm ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Login API: ${hasLoginAPI ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Login backend: ${hasLoginBackend ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Login email: ${hasLoginEmail ? 'EXISTS' : 'MISSING'}`);
  
  const loginFlowComplete = hasLoginForm && hasLoginAPI && hasLoginBackend && hasLoginEmail;
  console.log(`🎯 Login flow: ${loginFlowComplete ? 'COMPLETE' : 'INCOMPLETE'}`);
  
} catch (error) {
  console.log(`❌ Login flow check failed: ${error.message}`);
}

console.log('');
console.log('📅 EVENT REGISTRATION FLOW...');
try {
  const eventDetailsPage = fs.readFileSync('frontend/src/components/EventDetailsPage.jsx', 'utf8');
  const eventController = fs.readFileSync('backend/controllers/eventController.js', 'utf8');
  const apiFile = fs.readFileSync('frontend/src/api/api.js', 'utf8');
  
  const hasEventRegistrationForm = eventDetailsPage.includes('handleRegister') && eventDetailsPage.includes('registerForEvent');
  const hasEventRegistrationAPI = apiFile.includes('registerForEvent');
  const hasEventRegistrationBackend = eventController.includes('registerForEvent');
  const hasEventRegistrationEmail = eventController.includes('sendEmail') && eventController.includes('getEventRegistrationConfirmationTemplate');
  
  console.log(`✅ Event registration form: ${hasEventRegistrationForm ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Event registration API: ${hasEventRegistrationAPI ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Event registration backend: ${hasEventRegistrationBackend ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Event registration email: ${hasEventRegistrationEmail ? 'EXISTS' : 'MISSING'}`);
  
  const eventRegistrationFlowComplete = hasEventRegistrationForm && hasEventRegistrationAPI && hasEventRegistrationBackend && hasEventRegistrationEmail;
  console.log(`🎯 Event registration flow: ${eventRegistrationFlowComplete ? 'COMPLETE' : 'INCOMPLETE'}`);
  
} catch (error) {
  console.log(`❌ Event registration flow check failed: ${error.message}`);
}

console.log('');
console.log('💬 EVENT CHAT FLOW...');
try {
  const eventChatPage = fs.readFileSync('frontend/src/components/EventChatPage.jsx', 'utf8');
  const eventController = fs.readFileSync('backend/controllers/eventController.js', 'utf8');
  
  const hasChatInterface = eventChatPage.includes('sendMessage') && eventChatPage.includes('handleSubmit');
  const hasChatBackend = eventController.includes('chat') || eventController.includes('message');
  
  console.log(`✅ Chat interface: ${hasChatInterface ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Chat backend: ${hasChatBackend ? 'EXISTS' : 'MISSING'}`);
  
  const chatFlowComplete = hasChatInterface && hasChatBackend;
  console.log(`🎯 Chat flow: ${chatFlowComplete ? 'COMPLETE' : 'INCOMPLETE'}`);
  
} catch (error) {
  console.log(`❌ Chat flow check failed: ${error.message}`);
}

console.log('');
console.log('⏰ ATTENDANCE TRACKING FLOW...');
try {
  const eventAttendancePage = fs.readFileSync('frontend/src/components/EventAttendancePage.jsx', 'utf8');
  const eventController = fs.readFileSync('backend/controllers/eventController.js', 'utf8');
  
  const hasAttendanceInterface = eventAttendancePage.includes('getAttendance') && eventAttendancePage.includes('updateAttendance');
  const hasAttendanceBackend = eventController.includes('attendance') || eventController.includes('timeIn') || eventController.includes('timeOut');
  
  console.log(`✅ Attendance interface: ${hasAttendanceInterface ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Attendance backend: ${hasAttendanceBackend ? 'EXISTS' : 'MISSING'}`);
  
  const attendanceFlowComplete = hasAttendanceInterface && hasAttendanceBackend;
  console.log(`🎯 Attendance flow: ${attendanceFlowComplete ? 'COMPLETE' : 'INCOMPLETE'}`);
  
} catch (error) {
  console.log(`❌ Attendance flow check failed: ${error.message}`);
}

console.log('');
console.log('📧 CONTACT US FLOW...');
try {
  const contactUsPage = fs.readFileSync('frontend/src/components/ContactUsPage.jsx', 'utf8');
  const apiFile = fs.readFileSync('frontend/src/api/api.js', 'utf8');
  const emailTemplates = fs.readFileSync('backend/utils/emailTemplates.js', 'utf8');
  
  const hasContactForm = contactUsPage.includes('contactUs') && contactUsPage.includes('validateForm');
  const hasContactAPI = apiFile.includes('contactUs');
  const hasContactEmailTemplate = emailTemplates.includes('getContactUsTemplate');
  
  console.log(`✅ Contact form: ${hasContactForm ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Contact API: ${hasContactAPI ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Contact email template: ${hasContactEmailTemplate ? 'EXISTS' : 'MISSING'}`);
  
  const contactFlowComplete = hasContactForm && hasContactAPI && hasContactEmailTemplate;
  console.log(`🎯 Contact flow: ${contactFlowComplete ? 'COMPLETE' : 'INCOMPLETE'}`);
  
} catch (error) {
  console.log(`❌ Contact flow check failed: ${error.message}`);
}

console.log('');
console.log('💭 FEEDBACK FLOW...');
try {
  const feedbackPage = fs.readFileSync('frontend/src/components/FeedbackPage.jsx', 'utf8');
  const apiFile = fs.readFileSync('frontend/src/api/api.js', 'utf8');
  const emailTemplates = fs.readFileSync('backend/utils/emailTemplates.js', 'utf8');
  
  const hasFeedbackForm = feedbackPage.includes('validateForm') && feedbackPage.includes('rating');
  const hasFeedbackAPI = apiFile.includes('sendFeedbackEmail');
  const hasFeedbackEmailTemplate = emailTemplates.includes('getFeedbackTemplate');
  
  console.log(`✅ Feedback form: ${hasFeedbackForm ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Feedback API: ${hasFeedbackAPI ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Feedback email template: ${hasFeedbackEmailTemplate ? 'EXISTS' : 'MISSING'}`);
  
  const feedbackFlowComplete = hasFeedbackForm && hasFeedbackAPI && hasFeedbackEmailTemplate;
  console.log(`🎯 Feedback flow: ${feedbackFlowComplete ? 'COMPLETE' : 'INCOMPLETE'}`);
  
} catch (error) {
  console.log(`❌ Feedback flow check failed: ${error.message}`);
}

console.log('');
console.log('👤 PROFILE MANAGEMENT FLOW...');
try {
  const profilePage = fs.readFileSync('frontend/src/components/ProfilePage.jsx', 'utf8');
  const userController = fs.readFileSync('backend/controllers/userController.js', 'utf8');
  const apiFile = fs.readFileSync('frontend/src/api/api.js', 'utf8');
  
  const hasProfileForm = profilePage.includes('updateProfile') && profilePage.includes('handleFormSubmit');
  const hasProfileAPI = apiFile.includes('updateProfile');
  const hasProfileBackend = userController.includes('updateProfile');
  const hasProfileEmail = userController.includes('sendEmail') && userController.includes('getRegistrationTemplate');
  
  console.log(`✅ Profile form: ${hasProfileForm ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Profile API: ${hasProfileAPI ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Profile backend: ${hasProfileBackend ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Profile email: ${hasProfileEmail ? 'EXISTS' : 'MISSING'}`);
  
  const profileFlowComplete = hasProfileForm && hasProfileAPI && hasProfileBackend && hasProfileEmail;
  console.log(`🎯 Profile flow: ${profileFlowComplete ? 'COMPLETE' : 'INCOMPLETE'}`);
  
} catch (error) {
  console.log(`❌ Profile flow check failed: ${error.message}`);
}

console.log('');
console.log('📁 FILE UPLOAD FLOW...');
try {
  const fileController = fs.readFileSync('backend/controllers/fileController.js', 'utf8');
  const apiFile = fs.readFileSync('frontend/src/api/api.js', 'utf8');
  
  const hasFileUploadBackend = fileController.includes('uploadFile');
  const hasFileUploadAPI = apiFile.includes('uploadFile');
  const hasFileDownloadBackend = fileController.includes('downloadFile');
  const hasFileDeleteBackend = fileController.includes('deleteFile');
  
  console.log(`✅ File upload backend: ${hasFileUploadBackend ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ File upload API: ${hasFileUploadAPI ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ File download backend: ${hasFileDownloadBackend ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ File delete backend: ${hasFileDeleteBackend ? 'EXISTS' : 'MISSING'}`);
  
  const fileFlowComplete = hasFileUploadBackend && hasFileUploadAPI && hasFileDownloadBackend && hasFileDeleteBackend;
  console.log(`🎯 File flow: ${fileFlowComplete ? 'COMPLETE' : 'INCOMPLETE'}`);
  
} catch (error) {
  console.log(`❌ File flow check failed: ${error.message}`);
}

console.log('');
console.log('🎯 LEVEL 3 CHECK COMPLETE');
console.log('==========================');
