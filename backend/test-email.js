// Test email functionality
const sendEmail = require('./utils/sendEmail');

async function testEmail() {
  console.log('🧪 Testing Email Functionality...\n');
  
  // Check email configuration
  console.log('📧 Email Configuration:');
  console.log('EMAIL_USER:', process.env.EMAIL_USER || 'Not set');
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not set');
  console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE || 'gmail');
  console.log('NO_REPLY_EMAIL:', process.env.NO_REPLY_EMAIL || 'noreply@charism.edu.ph');
  
  if (!process.env.EMAIL_USER || process.env.EMAIL_PASS === 'your_email_password') {
    console.log('\n❌ Email not configured properly!');
    console.log('Please set EMAIL_USER and EMAIL_PASS environment variables');
    return;
  }
  
  console.log('\n📧 Sending test email...');
  
  try {
    const result = await sendEmail(
      'test@example.com', // Replace with your email for testing
      'CHARISM - Test Email',
      'This is a test email to verify email functionality.',
      '<h1>Test Email</h1><p>This is a test email to verify email functionality.</p>',
      true
    );
    
    if (result.success) {
      console.log('✅ Test email sent successfully!');
    } else {
      console.log('❌ Test email failed:', result.message);
    }
  } catch (error) {
    console.error('❌ Email test error:', error.message);
  }
}

testEmail();
