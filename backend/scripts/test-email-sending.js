// Test email sending functionality
require('dotenv').config();

const sendEmail = require('../utils/sendEmail');
const { generateVerificationLink } = require('../utils/emailLinkGenerator');

const testEmailSending = async () => {
  try {
    console.log('🧪 Testing Email Sending...\n');
    
    // Check environment variables
    console.log('📋 Environment Variables:');
    console.log('   EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Not set');
    console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set' : '❌ Not set');
    console.log('   EMAIL_SERVICE:', process.env.EMAIL_SERVICE || 'gmail');
    console.log('   NODE_ENV:', process.env.NODE_ENV);
    
    // Generate test link
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
    const verificationUrl = generateVerificationLink(testToken);
    
    console.log('\n🔗 Generated Verification Link:');
    console.log('   URL:', verificationUrl);
    console.log('   HashRouter format:', verificationUrl.includes('#'));
    
    // Test email content
    const testEmailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>🧪 Test Email</h2>
        <p>This is a test email to verify the email system is working.</p>
        <p>Verification link: <a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>Link format check:</p>
        <ul>
          <li>Contains #: ${verificationUrl.includes('#') ? '✅ Yes' : '❌ No'}</li>
          <li>Contains verify-email: ${verificationUrl.includes('verify-email') ? '✅ Yes' : '❌ No'}</li>
          <li>Contains token: ${verificationUrl.includes(testToken) ? '✅ Yes' : '❌ No'}</li>
        </ul>
      </div>
    `;
    
    console.log('\n📧 Email Content Preview:');
    console.log('   Subject: Test Email - CHARISM System');
    console.log('   HTML Length:', testEmailContent.length, 'characters');
    console.log('   Contains verification link:', testEmailContent.includes(verificationUrl));
    
    // Test email sending (only if credentials are set)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_PASS !== 'your_email_password') {
      console.log('\n📤 Attempting to send test email...');
      
      try {
        const result = await sendEmail(
          process.env.EMAIL_USER, // Send to self for testing
          'Test Email - CHARISM System',
          'This is a test email to verify the system is working.',
          testEmailContent,
          true
        );
        
        if (result.success) {
          console.log('✅ Test email sent successfully!');
          console.log('   Message ID:', result.messageId);
        } else {
          console.log('❌ Test email failed:', result.message);
        }
      } catch (emailError) {
        console.log('❌ Email sending error:', emailError.message);
      }
    } else {
      console.log('\n⚠️  Email credentials not configured, skipping send test');
    }
    
    console.log('\n✅ Email sending test complete');
    
  } catch (error) {
    console.error('❌ Error in email sending test:', error);
  } finally {
    process.exit(0);
  }
};

testEmailSending();
