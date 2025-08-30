// Test email link generation
require('dotenv').config();

const { 
  generateVerificationLink, 
  generatePasswordResetLink, 
  generateEventRegistrationLink,
  debugEmailConfig 
} = require('../utils/emailLinkGenerator');

const testEmailLinks = async () => {
  try {
    console.log('🧪 Testing email link generation...\n');
    
    // Test configuration
    console.log('📋 Email Link Generator Configuration:');
    const config = debugEmailConfig();
    console.log('   Frontend URL:', config.selectedUrl);
    console.log('   Environment:', config.NODE_ENV);
    console.log('');
    
    // Test token
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
    
    // Generate test links
    console.log('🔗 Generated Links:');
    
    const verificationLink = generateVerificationLink(testToken);
    console.log('   Email Verification:', verificationLink);
    
    const resetLink = generatePasswordResetLink(testToken);
    console.log('   Password Reset:', resetLink);
    
    const eventRegLink = generateEventRegistrationLink(testToken);
    console.log('   Event Registration:', eventRegLink);
    
    console.log('\n✅ Email link generation test complete');
    
    // Test if links are valid
    console.log('\n🔍 Link Validation:');
    console.log('   Verification link valid:', verificationLink.includes('/#/verify-email/'));
    console.log('   Reset link valid:', resetLink.includes('/#/reset-password/'));
    console.log('   Event link valid:', eventRegLink.includes('/#/events/register/'));
    
  } catch (error) {
    console.error('❌ Error testing email links:', error);
  } finally {
    process.exit(0);
  }
};

testEmailLinks();
