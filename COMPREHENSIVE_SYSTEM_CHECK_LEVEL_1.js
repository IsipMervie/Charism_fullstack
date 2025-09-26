console.log('🔍 COMPREHENSIVE SYSTEM CHECK - LEVEL 1');
console.log('==========================================');
console.log('');

console.log('📁 CHECKING FILE STRUCTURE...');
const fs = require('fs');
const path = require('path');

const criticalFiles = [
  'backend/server.js',
  'backend/package.json',
  'frontend/package.json',
  'frontend/src/App.js',
  'frontend/src/api/api.js',
  'backend/controllers/authController.js',
  'backend/controllers/userController.js',
  'backend/controllers/eventController.js',
  'backend/controllers/fileController.js',
  'backend/utils/sendEmail.js',
  'backend/utils/emailTemplates.js',
  'render.yaml'
];

let fileStatus = { existing: 0, missing: 0, errors: [] };

criticalFiles.forEach(file => {
  try {
    if (fs.existsSync(file)) {
      fileStatus.existing++;
      console.log(`✅ ${file} - EXISTS`);
    } else {
      fileStatus.missing++;
      fileStatus.errors.push(file);
      console.log(`❌ ${file} - MISSING`);
    }
  } catch (error) {
    fileStatus.errors.push(`${file}: ${error.message}`);
    console.log(`⚠️ ${file} - ERROR: ${error.message}`);
  }
});

console.log('');
console.log(`📊 FILE STATUS: ${fileStatus.existing}/${criticalFiles.length} files exist`);

if (fileStatus.missing > 0) {
  console.log(`❌ MISSING FILES: ${fileStatus.missing}`);
  fileStatus.errors.forEach(error => console.log(`   - ${error}`));
} else {
  console.log('✅ ALL CRITICAL FILES EXIST');
}

console.log('');
console.log('🔍 CHECKING PACKAGE.JSON DEPENDENCIES...');

// Check backend dependencies
try {
  const backendPackage = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
  console.log('✅ Backend package.json - VALID');
  console.log(`   - Dependencies: ${Object.keys(backendPackage.dependencies || {}).length}`);
  console.log(`   - Scripts: ${Object.keys(backendPackage.scripts || {}).length}`);
} catch (error) {
  console.log(`❌ Backend package.json - ERROR: ${error.message}`);
}

// Check frontend dependencies
try {
  const frontendPackage = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
  console.log('✅ Frontend package.json - VALID');
  console.log(`   - Dependencies: ${Object.keys(frontendPackage.dependencies || {}).length}`);
  console.log(`   - Scripts: ${Object.keys(frontendPackage.scripts || {}).length}`);
} catch (error) {
  console.log(`❌ Frontend package.json - ERROR: ${error.message}`);
}

console.log('');
console.log('🔍 CHECKING RENDER CONFIGURATION...');

try {
  const renderConfig = fs.readFileSync('render.yaml', 'utf8');
  console.log('✅ render.yaml - EXISTS');
  
  if (renderConfig.includes('type: static')) {
    console.log('✅ Frontend configured as static site');
  } else {
    console.log('⚠️ Frontend configuration needs review');
  }
  
  if (renderConfig.includes('type: web')) {
    console.log('✅ Backend configured as web service');
  } else {
    console.log('⚠️ Backend configuration needs review');
  }
} catch (error) {
  console.log(`❌ render.yaml - ERROR: ${error.message}`);
}

console.log('');
console.log('🔍 CHECKING CONTROLLER FUNCTIONS...');

const controllers = [
  'backend/controllers/authController.js',
  'backend/controllers/userController.js',
  'backend/controllers/eventController.js',
  'backend/controllers/fileController.js'
];

controllers.forEach(controller => {
  try {
    if (fs.existsSync(controller)) {
      const content = fs.readFileSync(controller, 'utf8');
      const functions = content.match(/exports\.\w+|module\.exports\.\w+/g) || [];
      console.log(`✅ ${controller} - ${functions.length} functions exported`);
    } else {
      console.log(`❌ ${controller} - MISSING`);
    }
  } catch (error) {
    console.log(`❌ ${controller} - ERROR: ${error.message}`);
  }
});

console.log('');
console.log('🔍 CHECKING EMAIL SYSTEM...');

try {
  const emailTemplates = fs.readFileSync('backend/utils/emailTemplates.js', 'utf8');
  const templateFunctions = emailTemplates.match(/const get\w+Template/g) || [];
  console.log(`✅ Email Templates - ${templateFunctions.length} templates available`);
  
  const sendEmail = fs.readFileSync('backend/utils/sendEmail.js', 'utf8');
  if (sendEmail.includes('sendEmail')) {
    console.log('✅ Send Email function - EXISTS');
  } else {
    console.log('❌ Send Email function - MISSING');
  }
} catch (error) {
  console.log(`❌ Email System - ERROR: ${error.message}`);
}

console.log('');
console.log('🔍 CHECKING FRONTEND COMPONENTS...');

const frontendComponents = [
  'frontend/src/components/LoginPage.jsx',
  'frontend/src/components/RegisterPage.jsx',
  'frontend/src/components/ProfilePage.jsx',
  'frontend/src/components/EventListPage.jsx',
  'frontend/src/components/EventDetailsPage.jsx',
  'frontend/src/components/ContactUsPage.jsx',
  'frontend/src/components/FeedbackPage.jsx',
  'frontend/src/components/MessagesPage.jsx'
];

let componentCount = 0;
frontendComponents.forEach(component => {
  try {
    if (fs.existsSync(component)) {
      componentCount++;
      console.log(`✅ ${component} - EXISTS`);
    } else {
      console.log(`❌ ${component} - MISSING`);
    }
  } catch (error) {
    console.log(`❌ ${component} - ERROR: ${error.message}`);
  }
});

console.log(`📊 Frontend Components: ${componentCount}/${frontendComponents.length} exist`);

console.log('');
console.log('🔍 CHECKING API INTEGRATION...');

try {
  const apiFile = fs.readFileSync('frontend/src/api/api.js', 'utf8');
  const apiFunctions = apiFile.match(/export const \w+/g) || [];
  console.log(`✅ API Functions - ${apiFunctions.length} functions available`);
  
  if (apiFunctions.length >= 20) {
    console.log('✅ API Integration - COMPREHENSIVE');
  } else {
    console.log('⚠️ API Integration - NEEDS MORE FUNCTIONS');
  }
} catch (error) {
  console.log(`❌ API Integration - ERROR: ${error.message}`);
}

console.log('');
console.log('🎯 LEVEL 1 CHECK COMPLETE');
console.log('==========================');
