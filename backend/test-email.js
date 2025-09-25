// Email Test Script
const sendEmail = require('./utils/sendEmail');

console.log('🧪 Testing Email Configuration...\n');

// Check environment variables
console.log('📧 Email Configuration:');
console.log('EMAIL_USER:', process.env.EMAIL_USER || 'NOT SET');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '[SET]' : 'NOT SET');
console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE || 'NOT SET');
console.log('NO_REPLY_EMAIL:', process.env.NO_REPLY_EMAIL || 'NOT SET');
console.log('');

// Test email sending
async function testEmail() {
  try {
    console.log('📤 Attempting to send test email...');
    
    const result = await sendEmail(
      'test@example.com', // Replace with your email
      'CHARISM Email Test',
      'This is a test email from CHARISM system',
      '<h1>CHARISM Email Test</h1><p>This is a test email from CHARISM system</p>',
      false
    );
    
    console.log('📧 Email result:', result);
    
    if (result.success) {
      console.log('✅ Email sent successfully!');
    } else {
      console.log('❌ Email failed:', result.message);
    }
    
  } catch (error) {
    console.error('❌ Email test error:', error.message);
  }
}

testEmail();
