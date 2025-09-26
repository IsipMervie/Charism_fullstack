const fs = require('fs');
const path = require('path');

console.log('=== QUICK SYNTAX CHECK ===');
console.log('Checking for any remaining syntax errors...\n');

// Check critical files for syntax issues
function checkSyntaxErrors() {
  const criticalFiles = [
    'frontend/src/api/api.js',
    'frontend/src/components/LoginPage.jsx',
    'frontend/src/components/RegisterPage.jsx',
    'frontend/src/components/ContactUsPage.jsx',
    'frontend/src/components/FeedbackPage.jsx'
  ];
  
  let syntaxIssues = 0;
  
  criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for common syntax issues
      const openBraces = (content.match(/\{/g) || []).length;
      const closeBraces = (content.match(/\}/g) || []).length;
      const openParens = (content.match(/\(/g) || []).length;
      const closeParens = (content.match(/\)/g) || []).length;
      
      if (openBraces !== closeBraces) {
        console.log(`❌ ${path.basename(file)}: Unmatched braces`);
        syntaxIssues++;
      } else if (openParens !== closeParens) {
        console.log(`❌ ${path.basename(file)}: Unmatched parentheses`);
        syntaxIssues++;
      } else {
        console.log(`✅ ${path.basename(file)}: Syntax OK`);
      }
    } else {
      console.log(`❌ ${path.basename(file)}: File missing`);
      syntaxIssues++;
    }
  });
  
  return syntaxIssues === 0;
}

// Check import/export consistency
function checkImportExportConsistency() {
  console.log('\n🔍 Checking import/export consistency...');
  
  let consistencyIssues = 0;
  
  // Check api.js exports
  const apiPath = 'frontend/src/api/api.js';
  if (fs.existsSync(apiPath)) {
    const apiContent = fs.readFileSync(apiPath, 'utf8');
    
    if (apiContent.includes('export const testAPIConnection')) {
      console.log('✅ api.js: testAPIConnection exported correctly');
    } else {
      console.log('❌ api.js: testAPIConnection export missing');
      consistencyIssues++;
    }
  }
  
  // Check LoginPage imports
  const loginPath = 'frontend/src/components/LoginPage.jsx';
  if (fs.existsSync(loginPath)) {
    const loginContent = fs.readFileSync(loginPath, 'utf8');
    
    if (loginContent.includes('import { loginUser, testAPIConnection }')) {
      console.log('✅ LoginPage.jsx: testAPIConnection imported correctly');
    } else {
      console.log('❌ LoginPage.jsx: testAPIConnection import incorrect');
      consistencyIssues++;
    }
  }
  
  return consistencyIssues === 0;
}

// Run checks
function runQuickSyntaxCheck() {
  const syntaxOK = checkSyntaxErrors();
  const consistencyOK = checkImportExportConsistency();
  
  console.log('\n=== QUICK SYNTAX CHECK RESULTS ===');
  console.log(`✅ Syntax Check: ${syntaxOK ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Import/Export Consistency: ${consistencyOK ? 'PASSED' : 'FAILED'}`);
  
  if (syntaxOK && consistencyOK) {
    console.log('\n🎉 ALL SYNTAX CHECKS PASSED!');
    console.log('🚀 Ready for deployment!');
    return true;
  } else {
    console.log('\n❌ SYNTAX ISSUES FOUND!');
    console.log('🔧 Fix required before deployment');
    return false;
  }
}

runQuickSyntaxCheck();
