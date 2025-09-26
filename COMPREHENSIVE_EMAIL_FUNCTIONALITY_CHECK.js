console.log('📧 COMPREHENSIVE EMAIL FUNCTIONALITY CHECK');
console.log('==========================================');
console.log('');

const fs = require('fs');

console.log('📧 CHECKING EMAIL TEMPLATES...');
try {
  const emailTemplates = fs.readFileSync('backend/utils/emailTemplates.js', 'utf8');
  
  // Check for all email template functions
  const templateFunctions = [
    'getEmailVerificationTemplate',
    'getPasswordResetTemplate',
    'getEventRegistrationConfirmationTemplate',
    'getEventUpdateTemplate',
    'getEventNotificationTemplate',
    'getContactUsTemplate',
    'getFeedbackTemplate',
    'getSystemAlertTemplate',
    'getAdminNotificationTemplate',
    'getRegistrationTemplate',
    'getLoginTemplate',
    'getForgotPasswordTemplate',
    'getResetPasswordTemplate',
    'getUserApprovalTemplate',
    'getUserRejectionTemplate',
    'getEventCancellationTemplate',
    'getEventReminderTemplate',
    'getAttendanceConfirmationTemplate',
    'getProfileUpdateTemplate',
    'getPasswordChangeTemplate',
    'getWelcomeTemplate',
    'getGoodbyeTemplate',
    'getNewsletterTemplate',
    'getAnnouncementTemplate',
    'getMaintenanceTemplate',
    'getSecurityAlertTemplate',
    'getBackupTemplate',
    'getReportTemplate',
    'getNoReplyFooter'
  ];
  
  let templateCount = 0;
  templateFunctions.forEach(template => {
    const hasTemplate = emailTemplates.includes(template);
    console.log(`   ${hasTemplate ? '✅' : '❌'} ${template}`);
    if (hasTemplate) templateCount++;
  });
  
  console.log(`📊 Email Templates: ${templateCount}/${templateFunctions.length} available`);
  
} catch (error) {
  console.log(`❌ Email Templates check failed: ${error.message}`);
}

console.log('');
console.log('📧 CHECKING EMAIL SENDING FUNCTION...');
try {
  const sendEmail = fs.readFileSync('backend/utils/sendEmail.js', 'utf8');
  
  const hasSendEmailFunction = sendEmail.includes('sendEmail');
  console.log(`✅ Send Email Function: ${hasSendEmailFunction ? 'EXISTS' : 'MISSING'}`);
  
  const hasNodemailer = sendEmail.includes('nodemailer');
  console.log(`✅ Nodemailer Integration: ${hasNodemailer ? 'EXISTS' : 'MISSING'}`);
  
  const hasGmailConfig = sendEmail.includes('gmail') && sendEmail.includes('EMAIL_USER');
  console.log(`✅ Gmail Configuration: ${hasGmailConfig ? 'EXISTS' : 'MISSING'}`);
  
  const hasSMTPConfig = sendEmail.includes('SMTP') || sendEmail.includes('smtp');
  console.log(`✅ SMTP Configuration: ${hasSMTPConfig ? 'EXISTS' : 'MISSING'}`);
  
  const hasErrorHandling = sendEmail.includes('try') && sendEmail.includes('catch');
  console.log(`✅ Error Handling: ${hasErrorHandling ? 'EXISTS' : 'MISSING'}`);
  
} catch (error) {
  console.log(`❌ Send Email Function check failed: ${error.message}`);
}

console.log('');
console.log('📧 CHECKING EMAIL TRIGGERS IN CONTROLLERS...');

const controllers = [
  'backend/controllers/authController.js',
  'backend/controllers/userController.js',
  'backend/controllers/eventController.js',
  'backend/controllers/adminController.js',
  'backend/controllers/contactController.js',
  'backend/controllers/feedbackController.js'
];

controllers.forEach(controller => {
  try {
    if (fs.existsSync(controller)) {
      const content = fs.readFileSync(controller, 'utf8');
      const hasSendEmail = content.includes('sendEmail');
      const hasEmailTemplates = content.includes('emailTemplates');
      const hasEmailTriggers = content.includes('sendEmail') && content.includes('emailTemplates');
      
      console.log(`✅ ${controller}:`);
      console.log(`   📧 Send Email: ${hasSendEmail ? 'EXISTS' : 'MISSING'}`);
      console.log(`   📧 Email Templates: ${hasEmailTemplates ? 'EXISTS' : 'MISSING'}`);
      console.log(`   📧 Email Triggers: ${hasEmailTriggers ? 'EXISTS' : 'MISSING'}`);
      
      // Check for specific email triggers
      if (controller.includes('authController')) {
        const hasRegistrationEmail = content.includes('getRegistrationTemplate') || content.includes('getEmailVerificationTemplate');
        const hasLoginEmail = content.includes('getLoginTemplate');
        const hasForgotPasswordEmail = content.includes('getPasswordResetTemplate');
        
        console.log(`   📧 Registration Email: ${hasRegistrationEmail ? 'EXISTS' : 'MISSING'}`);
        console.log(`   📧 Login Email: ${hasLoginEmail ? 'EXISTS' : 'MISSING'}`);
        console.log(`   📧 Forgot Password Email: ${hasForgotPasswordEmail ? 'EXISTS' : 'MISSING'}`);
      }
      
      if (controller.includes('eventController')) {
        const hasEventRegistrationEmail = content.includes('getEventRegistrationConfirmationTemplate');
        const hasEventNotificationEmail = content.includes('getEventNotificationTemplate');
        const hasEventUpdateEmail = content.includes('getEventUpdateTemplate');
        
        console.log(`   📧 Event Registration Email: ${hasEventRegistrationEmail ? 'EXISTS' : 'MISSING'}`);
        console.log(`   📧 Event Notification Email: ${hasEventNotificationEmail ? 'EXISTS' : 'MISSING'}`);
        console.log(`   📧 Event Update Email: ${hasEventUpdateEmail ? 'EXISTS' : 'MISSING'}`);
      }
      
      if (controller.includes('contactController')) {
        const hasContactEmail = content.includes('getContactUsTemplate');
        console.log(`   📧 Contact Email: ${hasContactEmail ? 'EXISTS' : 'MISSING'}`);
      }
      
      if (controller.includes('feedbackController')) {
        const hasFeedbackEmail = content.includes('getFeedbackTemplate');
        console.log(`   📧 Feedback Email: ${hasFeedbackEmail ? 'EXISTS' : 'MISSING'}`);
      }
      
    } else {
      console.log(`❌ ${controller} - MISSING`);
    }
  } catch (error) {
    console.log(`❌ ${controller} check failed: ${error.message}`);
  }
});

console.log('');
console.log('📧 CHECKING EMAIL CONFIGURATION...');
try {
  const sendEmail = fs.readFileSync('backend/utils/sendEmail.js', 'utf8');
  
  // Check for environment variables
  const hasEmailUser = sendEmail.includes('EMAIL_USER');
  const hasEmailPass = sendEmail.includes('EMAIL_PASS');
  const hasEmailService = sendEmail.includes('EMAIL_SERVICE');
  const hasNoReplyEmail = sendEmail.includes('NO_REPLY_EMAIL');
  
  console.log(`✅ EMAIL_USER: ${hasEmailUser ? 'CONFIGURED' : 'MISSING'}`);
  console.log(`✅ EMAIL_PASS: ${hasEmailPass ? 'CONFIGURED' : 'MISSING'}`);
  console.log(`✅ EMAIL_SERVICE: ${hasEmailService ? 'CONFIGURED' : 'MISSING'}`);
  console.log(`✅ NO_REPLY_EMAIL: ${hasNoReplyEmail ? 'CONFIGURED' : 'MISSING'}`);
  
  // Check for Gmail specific configuration
  const hasGmailService = sendEmail.includes('gmail');
  const hasGmailHost = sendEmail.includes('smtp.gmail.com');
  const hasGmailPort = sendEmail.includes('587') || sendEmail.includes('465');
  
  console.log(`✅ Gmail Service: ${hasGmailService ? 'CONFIGURED' : 'MISSING'}`);
  console.log(`✅ Gmail Host: ${hasGmailHost ? 'CONFIGURED' : 'MISSING'}`);
  console.log(`✅ Gmail Port: ${hasGmailPort ? 'CONFIGURED' : 'MISSING'}`);
  
} catch (error) {
  console.log(`❌ Email Configuration check failed: ${error.message}`);
}

console.log('');
console.log('📧 CHECKING EMAIL ROUTES...');
try {
  const serverFile = fs.readFileSync('backend/server.js', 'utf8');
  
  const hasContactRoutes = serverFile.includes('/api/contact') || serverFile.includes('contactRoutes');
  const hasFeedbackRoutes = serverFile.includes('/api/feedback') || serverFile.includes('feedbackRoutes');
  const hasEmailRoutes = serverFile.includes('/api/email') || serverFile.includes('emailRoutes');
  
  console.log(`✅ Contact Routes: ${hasContactRoutes ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Feedback Routes: ${hasFeedbackRoutes ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Email Routes: ${hasEmailRoutes ? 'EXISTS' : 'MISSING'}`);
  
} catch (error) {
  console.log(`❌ Email Routes check failed: ${error.message}`);
}

console.log('');
console.log('🎯 EMAIL FUNCTIONALITY CHECK COMPLETE');
console.log('=====================================');
