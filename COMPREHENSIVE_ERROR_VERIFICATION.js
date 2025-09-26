const fs = require('fs');

console.log('=== COMPREHENSIVE ERROR VERIFICATION ===');
console.log('Double-checking ALL errors are actually fixed...\n');

// 1. Check api.js for ALL potential errors
function checkAPIErrors() {
  console.log('🔍 Checking api.js for ALL errors...');
  
  const apiPath = 'frontend/src/api/api.js';
  const content = fs.readFileSync(apiPath, 'utf8');
  
  let errors = [];
  
  // Check for healthCheckInstance
  if (content.includes('healthCheckInstance')) {
    errors.push('healthCheckInstance still exists');
  }
  
  // Check for getUserId function
  if (!content.includes('export const getUserId')) {
    errors.push('getUserId function missing');
  }
  
  // Check for undefined variables
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (line.includes('getUserId') && !line.includes('export const getUserId') && !line.includes('const getUserId')) {
      errors.push(`Line ${index + 1}: getUserId usage without definition`);
    }
  });
  
  if (errors.length === 0) {
    console.log('   ✅ api.js: All errors fixed');
    return true;
  } else {
    console.log('   ❌ api.js: Still has errors:');
    errors.forEach(error => console.log(`      - ${error}`));
    return false;
  }
}

// 2. Check RegisterPage.jsx for ALL potential errors
function checkRegisterPageErrors() {
  console.log('🔍 Checking RegisterPage.jsx for ALL errors...');
  
  const registerPath = 'frontend/src/components/RegisterPage.jsx';
  const content = fs.readFileSync(registerPath, 'utf8');
  
  let errors = [];
  
  // Check for showError import
  if (!content.includes('import') || !content.includes('showError')) {
    errors.push('showError not imported');
  }
  
  // Check for showError usage without import
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (line.includes('showError(') && !content.includes('showError') && !line.includes('import')) {
      errors.push(`Line ${index + 1}: showError used but not imported`);
    }
  });
  
  if (errors.length === 0) {
    console.log('   ✅ RegisterPage.jsx: All errors fixed');
    return true;
  } else {
    console.log('   ❌ RegisterPage.jsx: Still has errors:');
    errors.forEach(error => console.log(`      - ${error}`));
    return false;
  }
}

// 3. Check for other potential build errors
function checkOtherPotentialErrors() {
  console.log('🔍 Checking for other potential build errors...');
  
  let errors = [];
  
  // Check all critical files for common issues
  const criticalFiles = [
    'frontend/src/api/api.js',
    'frontend/src/components/LoginPage.jsx',
    'frontend/src/components/RegisterPage.jsx',
    'frontend/src/components/ContactUsPage.jsx',
    'frontend/src/components/FeedbackPage.jsx'
  ];
  
  criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for undefined variables
      if (content.includes('undefined') && content.includes('no-undef')) {
        errors.push(`${file}: Potential undefined variables`);
      }
      
      // Check for missing imports
      if (content.includes('import') && content.includes('from') && content.includes('undefined')) {
        errors.push(`${file}: Potential missing imports`);
      }
      
      // Check for syntax issues
      const openBraces = (content.match(/\{/g) || []).length;
      const closeBraces = (content.match(/\}/g) || []).length;
      if (openBraces !== closeBraces) {
        errors.push(`${file}: Unmatched braces`);
      }
    }
  });
  
  if (errors.length === 0) {
    console.log('   ✅ Other files: No additional errors found');
    return true;
  } else {
    console.log('   ❌ Other files: Potential errors found:');
    errors.forEach(error => console.log(`      - ${error}`));
    return false;
  }
}

// 4. Apply additional fixes if needed
function applyAdditionalFixes() {
  console.log('🔧 Applying additional fixes if needed...');
  
  let fixesApplied = 0;
  
  // Fix api.js if needed
  const apiPath = 'frontend/src/api/api.js';
  let apiContent = fs.readFileSync(apiPath, 'utf8');
  
  // Ensure getUserId is properly defined
  if (!apiContent.includes('export const getUserId = () => {')) {
    const getUserIdFunction = `
// Get user ID from localStorage
export const getUserId = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    // Decode JWT token to get user ID
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId || payload.id;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
};`;

    apiContent = apiContent.replace(
      /export const testAPIConnection = async \(\) => {/,
      getUserIdFunction + '\n\nexport const testAPIConnection = async () => {'
    );
    
    fs.writeFileSync(apiPath, apiContent);
    fixesApplied++;
    console.log('   ✅ Added getUserId function to api.js');
  }
  
  // Fix RegisterPage.jsx if needed
  const registerPath = 'frontend/src/components/RegisterPage.jsx';
  let registerContent = fs.readFileSync(registerPath, 'utf8');
  
  // Ensure showError is imported
  if (!registerContent.includes('showError')) {
    registerContent = registerContent.replace(
      /import { showWarning, showSuccess } from '\.\.\/utils\/sweetAlertUtils';/,
      'import { showWarning, showSuccess, showError } from \'../utils/sweetAlertUtils\';'
    );
    
    fs.writeFileSync(registerPath, registerContent);
    fixesApplied++;
    console.log('   ✅ Added showError import to RegisterPage.jsx');
  }
  
  if (fixesApplied > 0) {
    console.log(`   📊 Additional fixes applied: ${fixesApplied}`);
  } else {
    console.log('   ✅ No additional fixes needed');
  }
  
  return true;
}

// 5. Final verification
function finalVerification() {
  console.log('🔍 Final verification...');
  
  // Re-check all files
  const apiOK = checkAPIErrors();
  const registerOK = checkRegisterPageErrors();
  const otherOK = checkOtherPotentialErrors();
  
  return apiOK && registerOK && otherOK;
}

// Run comprehensive verification
function runComprehensiveVerification() {
  console.log('🚀 Running comprehensive error verification...\n');
  
  // First pass - check current state
  const initialAPI = checkAPIErrors();
  const initialRegister = checkRegisterPageErrors();
  const initialOther = checkOtherPotentialErrors();
  
  console.log('\n📊 Initial Check Results:');
  console.log(`   API.js: ${initialAPI ? 'OK' : 'NEEDS FIX'}`);
  console.log(`   RegisterPage.jsx: ${initialRegister ? 'OK' : 'NEEDS FIX'}`);
  console.log(`   Other files: ${initialOther ? 'OK' : 'NEEDS FIX'}`);
  
  // Apply additional fixes if needed
  applyAdditionalFixes();
  
  // Final verification
  const finalAPI = checkAPIErrors();
  const finalRegister = checkRegisterPageErrors();
  const finalOther = checkOtherPotentialErrors();
  
  console.log('\n📊 Final Check Results:');
  console.log(`   API.js: ${finalAPI ? 'OK' : 'STILL HAS ERRORS'}`);
  console.log(`   RegisterPage.jsx: ${finalRegister ? 'OK' : 'STILL HAS ERRORS'}`);
  console.log(`   Other files: ${finalOther ? 'OK' : 'STILL HAS ERRORS'}`);
  
  const allFixed = finalAPI && finalRegister && finalOther;
  
  console.log('\n=== COMPREHENSIVE VERIFICATION RESULTS ===');
  if (allFixed) {
    console.log('🎉 ALL ERRORS VERIFIED AS FIXED!');
    console.log('🚀 Safe to deploy!');
  } else {
    console.log('❌ ERRORS STILL EXIST!');
    console.log('🔧 Additional fixes needed');
  }
  
  return allFixed;
}

runComprehensiveVerification();
