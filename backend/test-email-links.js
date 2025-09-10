// Test script for email link generation
// Run with: node test-email-links.js

require('dotenv').config();
const { debugEmailConfig, generateVerificationLink, generatePasswordResetLink, generateEventRegistrationLink } = require('./utils/emailLinkGenerator');

console.log('🧪 Testing Email Link Generation\n');

// Debug current configuration
console.log('=== Current Configuration ===');
const config = debugEmailConfig();
console.log('');

// Test link generation
console.log('=== Generated Links ===');
const testToken = 'test_token_12345';

try {
  const verificationLink = generateVerificationLink(testToken);
  console.log('✅ Verification Link:', verificationLink);
  
  const resetLink = generatePasswordResetLink(testToken);
  console.log('✅ Password Reset Link:', resetLink);
  
  const eventLink = generateEventRegistrationLink(testToken);
  console.log('✅ Event Registration Link:', eventLink);
  
  console.log('\n✅ All links generated successfully!');
  
  // Test if links are accessible
  console.log('\n=== Link Validation ===');
  console.log('Verification link accessible:', verificationLink.includes('http'));
  console.log('Reset link accessible:', resetLink.includes('http'));
  console.log('Event link accessible:', eventLink.includes('http'));
  
} catch (error) {
  console.error('❌ Error generating links:', error.message);
}

console.log('\n=== Environment Check ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('FRONTEND_URL_PRODUCTION:', process.env.FRONTEND_URL_PRODUCTION || 'NOT SET');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'NOT SET');

console.log('\n🔧 If links are not working, check your environment variables!');
console.log('📖 See DEPLOYMENT.md for setup instructions.');
