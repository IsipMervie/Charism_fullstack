// backend/test_email_system.js
// Test script to verify email functionality

require('dotenv').config();
const { sendEmail } = require('./utils/sendEmail');

const testEmailSystem = async () => {
  console.log('🧪 Testing Email System...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables Check:');
  console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Not Set');
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set' : '❌ Not Set');
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('\n❌ Email configuration incomplete!');
    console.log('Please set EMAIL_USER and EMAIL_PASS in your .env file');
    console.log('\nExample .env file:');
    console.log('EMAIL_USER=your_email@gmail.com');
    console.log('EMAIL_PASS=your_app_password');
    return;
  }
  
  console.log('\n📧 Testing email configuration...');
  
  try {
    // Test email
    const testEmail = {
      to: process.env.EMAIL_USER, // Send to yourself for testing
      subject: '🧪 CommunityLink Email Test',
      text: `
        This is a test email from CommunityLink!
        
        Time: ${new Date().toLocaleString()}
        System: Email functionality test
        
        If you receive this email, the email system is working correctly!
        
        Best regards,
        CommunityLink Team
      `
    };
    
    console.log('📤 Sending test email...');
    await sendEmail(testEmail.to, testEmail.subject, testEmail.text);
    
    console.log('✅ Test email sent successfully!');
    console.log('📬 Check your inbox (and spam folder) for the test email');
    console.log(`📧 Sent to: ${testEmail.to}`);
    
  } catch (error) {
    console.log('❌ Email test failed!');
    console.log('Error details:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔐 Authentication Error:');
      console.log('- Check if EMAIL_USER and EMAIL_PASS are correct');
      console.log('- For Gmail, make sure you\'re using an App Password, not your regular password');
      console.log('- Enable 2-factor authentication and generate an App Password');
    }
    
    if (error.code === 'ECONNECTION') {
      console.log('\n🌐 Connection Error:');
      console.log('- Check your internet connection');
      console.log('- Verify Gmail SMTP settings');
    }
    
    console.log('\n📚 Troubleshooting Guide:');
    console.log('1. For Gmail:');
    console.log('   - Enable 2-factor authentication');
    console.log('   - Generate an App Password');
    console.log('   - Use the App Password in EMAIL_PASS');
    console.log('2. Check your .env file is in the backend folder');
    console.log('3. Restart your server after changing .env');
  }
};

// Run the test
testEmailSystem().catch(console.error);
