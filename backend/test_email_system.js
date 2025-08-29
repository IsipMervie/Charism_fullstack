// backend/test_email_system.js
// Test script to verify email system functionality

require('dotenv').config();
const sendEmail = require('./utils/sendEmail');

console.log('🧪 Testing Email System...\n');

// Check environment variables
console.log('📋 Environment Variables Check:');
console.log(`EMAIL_USER: ${process.env.EMAIL_USER ? '✅ Set' : '❌ Not Set'}`);
console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? '✅ Set' : '❌ Not Set'}`);
console.log(`EMAIL_SERVICE: ${process.env.EMAIL_SERVICE || 'gmail (default)'}`);
console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL || '❌ Not Set'}\n`);

// Test email configuration
async function testEmailSystem() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('❌ Email credentials not configured!');
    console.log('Please set EMAIL_USER and EMAIL_PASS in your .env file');
    console.log('Follow the EMAIL_SETUP_GUIDE.md for instructions\n');
    return;
  }

  if (!process.env.FRONTEND_URL) {
    console.log('⚠️  FRONTEND_URL not set - email links may not work properly\n');
  }

  try {
    console.log('📧 Testing email configuration...');
    
    // Test 1: Simple text email
    console.log('📤 Sending test email...');
    
    const testEmailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #1e40af; margin: 0;">🧪 Email System Test</h2>
          <p style="color: #6c757d; margin: 10px 0;">CHARISM Community Link</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #2d3748; margin-bottom: 20px;">Hello!</h3>
          <p style="color: #4a5568; line-height: 1.6; margin-bottom: 20px;">
            This is a test email to verify that your email system is working correctly.
          </p>
          
          <div style="background: #e6fffa; border: 1px solid #81e6d9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #2c7a7b; margin: 0 0 10px 0;">✅ Test Results</h4>
            <p style="color: #2c7a7b; margin: 0; line-height: 1.5;">
              If you received this email, your email system is working perfectly!
            </p>
          </div>
          
          <p style="color: #718096; font-size: 14px; margin-top: 20px;">
            <strong>Test Details:</strong><br>
            • Sent at: ${new Date().toLocaleString()}<br>
            • From: ${process.env.EMAIL_USER}<br>
            • Service: ${process.env.EMAIL_SERVICE || 'gmail'}
          </p>
        </div>
        
        <div style="text-align: center; color: #6c757d; font-size: 14px;">
          <p>This is an automated test email. Please ignore.</p>
        </div>
      </div>
    `;

    const result = await sendEmail(
      process.env.EMAIL_USER, // Send to yourself for testing
      '🧪 CHARISM - Email System Test',
      'This is a test email to verify your email system is working.',
      testEmailContent
    );

    if (result && result.success) {
      console.log('✅ Test email sent successfully!');
      console.log(`📬 Sent to: ${process.env.EMAIL_USER}`);
      console.log(`🆔 Message ID: ${result.messageId}`);
      console.log('\n🎉 Your email system is working perfectly!');
      console.log('Users will now receive verification and password reset emails.');
    } else {
      console.log('❌ Test email failed to send');
      console.log('Result:', result);
    }

  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔐 Authentication Error:');
      console.log('• Check your EMAIL_USER and EMAIL_PASS');
      console.log('• Ensure 2FA is enabled on your Gmail account');
      console.log('• Generate an App Password for this application');
      console.log('• Follow the EMAIL_SETUP_GUIDE.md for detailed instructions');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n🌐 Connection Error:');
      console.log('• Check your internet connection');
      console.log('• Verify firewall settings');
      console.log('• Check if Gmail SMTP is accessible');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\n🔍 Domain Error:');
      console.log('• Check your EMAIL_USER format');
      console.log('• Verify the email domain is correct');
    }
    
    console.log('\n📚 For help, see: EMAIL_SETUP_GUIDE.md');
  }
}

// Run the test
testEmailSystem().then(() => {
  console.log('\n🏁 Email system test completed.');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});
