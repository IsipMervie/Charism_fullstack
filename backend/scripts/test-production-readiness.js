// Test production readiness
require('dotenv').config();

const { 
  generateVerificationLink, 
  generatePasswordResetLink, 
  generateEventRegistrationLink,
  debugEmailConfig 
} = require('../utils/emailLinkGenerator');

const testProductionReadiness = async () => {
  try {
    console.log('🧪 Testing Production Readiness...\n');
    
    // Test 1: Environment Variables
    console.log('📋 Test 1: Environment Variables');
    console.log('   NODE_ENV:', process.env.NODE_ENV);
    console.log('   MONGO_URI:', process.env.MONGO_URI ? '✅ Set' : '❌ Not set');
    console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Not set');
    console.log('   EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Not set');
    console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set' : '❌ Not set');
    
    // Test 2: Email Link Generation
    console.log('\n📋 Test 2: Email Link Generation');
    const config = debugEmailConfig();
    console.log('   Frontend URL:', config.selectedUrl);
    
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
    const verificationLink = generateVerificationLink(testToken);
    const resetLink = generatePasswordResetLink(testToken);
    const eventRegLink = generateEventRegistrationLink(testToken);
    
    console.log('   ✅ Verification link format:', verificationLink.includes('/#/verify-email/'));
    console.log('   ✅ Reset link format:', resetLink.includes('/#/reset-password/'));
    console.log('   ✅ Event link format:', eventRegLink.includes('/#/events/register/'));
    
    // Test 3: URL Structure Validation
    console.log('\n📋 Test 3: URL Structure Validation');
    const urls = [verificationLink, resetLink, eventRegLink];
    const allValid = urls.every(url => {
      const isValid = url.includes('#') && url.includes('charism.vercel.app');
      console.log(`   ${url.includes('#') ? '✅' : '❌'} HashRouter: ${url.includes('#')}`);
      console.log(`   ${url.includes('charism.vercel.app') ? '✅' : '❌'} Domain: ${url.includes('charism.vercel.app')}`);
      return isValid;
    });
    
    // Test 4: Expected vs Actual URLs
    console.log('\n📋 Test 4: Expected vs Actual URLs');
    const expectedPatterns = [
      'https://charism.vercel.app/#/verify-email/',
      'https://charism.vercel.app/#/reset-password/',
      'https://charism.vercel.app/#/events/register/'
    ];
    
    const actualUrls = [verificationLink, resetLink, eventRegLink];
    const allPatternsMatch = expectedPatterns.every((pattern, index) => {
      const matches = actualUrls[index].startsWith(pattern);
      console.log(`   ${matches ? '✅' : '❌'} ${pattern}: ${matches}`);
      return matches;
    });
    
    // Test 5: HashRouter Compatibility
    console.log('\n📋 Test 5: HashRouter Compatibility');
    const hashRouterCompatible = urls.every(url => {
      const urlObj = new URL(url);
      return urlObj.hash && urlObj.hash.startsWith('#/');
    });
    
    console.log('   HashRouter compatible:', hashRouterCompatible ? '✅ Yes' : '❌ No');
    
    // Summary
    console.log('\n📊 PRODUCTION READINESS SUMMARY:');
    console.log('   Environment Variables:', process.env.NODE_ENV === 'production' ? '✅ Production' : '⚠️  Development');
    console.log('   Email Links:', allValid ? '✅ All Valid' : '❌ Some Invalid');
    console.log('   URL Patterns:', allPatternsMatch ? '✅ All Match' : '❌ Some Mismatch');
    console.log('   HashRouter:', hashRouterCompatible ? '✅ Compatible' : '❌ Incompatible');
    
    const overallStatus = allValid && allPatternsMatch && hashRouterCompatible;
    console.log(`\n🎯 OVERALL STATUS: ${overallStatus ? '✅ PRODUCTION READY' : '❌ NEEDS FIXES'}`);
    
    if (!overallStatus) {
      console.log('\n🔧 RECOMMENDED FIXES:');
      if (!allValid) console.log('   - Check email link generation');
      if (!allPatternsMatch) console.log('   - Verify URL patterns');
      if (!hashRouterCompatible) console.log('   - Fix HashRouter compatibility');
    }
    
  } catch (error) {
    console.error('❌ Error in production readiness test:', error);
  } finally {
    process.exit(0);
  }
};

testProductionReadiness();
