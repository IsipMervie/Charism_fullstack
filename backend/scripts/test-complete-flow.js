// Test complete email verification and event registration flow
require('dotenv').config();

const { 
  generateVerificationLink, 
  generatePasswordResetLink, 
  generateEventRegistrationLink,
  debugEmailConfig 
} = require('../utils/emailLinkGenerator');

const testCompleteFlow = async () => {
  try {
    console.log('🧪 Testing Complete Email Flow...\n');
    
    // Test 1: Email Link Generation
    console.log('📋 Test 1: Email Link Generation');
    const config = debugEmailConfig();
    console.log('   Frontend URL:', config.selectedUrl);
    console.log('   Environment:', config.NODE_ENV);
    
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
    
    const verificationLink = generateVerificationLink(testToken);
    const resetLink = generatePasswordResetLink(testToken);
    const eventRegLink = generateEventRegistrationLink(testToken);
    
    console.log('\n   Generated Links:');
    console.log('   ✅ Verification:', verificationLink);
    console.log('   ✅ Reset:', resetLink);
    console.log('   ✅ Event Reg:', eventRegLink);
    
    // Test 2: Link Format Validation
    console.log('\n📋 Test 2: Link Format Validation');
    console.log('   Verification format correct:', verificationLink.includes('/#/verify-email/'));
    console.log('   Reset format correct:', resetLink.includes('/#/reset-password/'));
    console.log('   Event format correct:', eventRegLink.includes('/#/events/register/'));
    
    // Test 3: Frontend Route Compatibility
    console.log('\n📋 Test 3: Frontend Route Compatibility');
    console.log('   HashRouter format:', verificationLink.includes('#'));
    console.log('   Correct path structure:', verificationLink.includes('verify-email'));
    
    // Test 4: URL Structure Analysis
    console.log('\n📋 Test 4: URL Structure Analysis');
    const url = new URL(verificationLink);
    console.log('   Protocol:', url.protocol);
    console.log('   Host:', url.host);
    console.log('   Pathname:', url.pathname);
    console.log('   Hash:', url.hash);
    
    // Test 5: Expected vs Actual
    console.log('\n📋 Test 5: Expected vs Actual');
    const expectedVerification = 'https://charism.onrender.com/#/verify-email/';
    const expectedReset = 'https://charism.onrender.com/#/reset-password/';
    const expectedEvent = 'https://charism.onrender.com/#/events/register/';
    
    console.log('   Verification matches:', verificationLink.startsWith(expectedVerification));
    console.log('   Reset matches:', resetLink.startsWith(expectedReset));
    console.log('   Event matches:', eventRegLink.startsWith(expectedEvent));
    
    console.log('\n✅ Complete flow test finished');
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log('   Frontend URL:', config.selectedUrl);
    console.log('   HashRouter:', verificationLink.includes('#'));
    console.log('   All formats correct:', 
      verificationLink.includes('/#/verify-email/') &&
      resetLink.includes('/#/reset-password/') &&
      eventRegLink.includes('/#/events/register/')
    );
    
  } catch (error) {
    console.error('❌ Error in complete flow test:', error);
  } finally {
    process.exit(0);
  }
};

testCompleteFlow();
