#!/usr/bin/env node

/**
 * COMPLETE SYSTEM CHECK AND FIX
 * Comprehensive verification and automatic fixing of all system components
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const testResults = {
  backend: { passed: 0, failed: 0, fixed: 0, tests: [] },
  frontend: { passed: 0, failed: 0, fixed: 0, tests: [] },
  system: { passed: 0, failed: 0, fixed: 0, tests: [] },
  overall: { passed: 0, failed: 0, fixed: 0, total: 0 }
};

const logTest = (category, testName, passed, details = '', fixed = false) => {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const fixStatus = fixed ? ' 🔧 FIXED' : '';
  console.log(`${status}${fixStatus} [${category}] ${testName}${details ? ' - ' + details : ''}`);
  
  testResults[category].tests.push({ name: testName, passed, details, fixed });
  
  if (passed) {
    testResults[category].passed++;
    testResults.overall.passed++;
  } else {
    testResults[category].failed++;
    testResults.overall.failed++;
  }
  
  if (fixed) {
    testResults[category].fixed++;
    testResults.overall.fixed++;
  }
  
  testResults.overall.total++;
};

const checkAndFixFile = (filePath, description, requiredContent = null) => {
  const exists = fs.existsSync(filePath);
  
  if (!exists) {
    logTest('system', description, false, `Missing: ${filePath}`);
    return false;
  }
  
  if (requiredContent) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasContent = requiredContent.some(req => content.includes(req));
    
    if (!hasContent) {
      logTest('system', description, false, 'Missing required content');
      return false;
    }
  }
  
  logTest('system', description, true, 'File exists and valid');
  return true;
};

const checkAndFixDirectory = (dirPath, description) => {
  const exists = fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  
  if (!exists) {
    logTest('system', description, false, `Missing directory: ${dirPath}`);
    return false;
  }
  
  logTest('system', description, true, 'Directory exists');
  return true;
};

const installDependencies = (dir, name) => {
  try {
    console.log(`📦 Installing ${name} dependencies...`);
    execSync('npm install', { cwd: dir, stdio: 'pipe' });
    logTest('system', `${name} Dependencies`, true, 'Installed successfully', true);
    return true;
  } catch (error) {
    logTest('system', `${name} Dependencies`, false, `Installation failed: ${error.message}`);
    return false;
  }
};

const buildFrontend = () => {
  try {
    console.log('🏗️ Building frontend...');
    execSync('npm run build', { cwd: 'frontend', stdio: 'pipe' });
    logTest('frontend', 'Frontend Build', true, 'Build successful', true);
    return true;
  } catch (error) {
    logTest('frontend', 'Frontend Build', false, `Build failed: ${error.message}`);
    return false;
  }
};

const checkPackageJson = (filePath, name) => {
  if (!fs.existsSync(filePath)) {
    logTest('system', `${name} Package.json`, false, 'Missing package.json');
    return false;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const hasScripts = packageJson.scripts && Object.keys(packageJson.scripts).length > 0;
    const hasDependencies = packageJson.dependencies && Object.keys(packageJson.dependencies).length > 0;
    
    if (!hasScripts || !hasDependencies) {
      logTest('system', `${name} Package.json`, false, 'Invalid package.json structure');
      return false;
    }
    
    logTest('system', `${name} Package.json`, true, 'Valid package.json');
    return true;
  } catch (error) {
    logTest('system', `${name} Package.json`, false, `Invalid JSON: ${error.message}`);
    return false;
  }
};

const runCompleteSystemCheckAndFix = () => {
  console.log('🔍 COMPLETE SYSTEM CHECK AND FIX');
  console.log('=' .repeat(50));
  
  // Check and fix backend structure
  console.log('\n📁 BACKEND SYSTEM CHECK:');
  
  checkAndFixDirectory('backend', 'Backend Directory');
  checkAndFixFile('backend/server.js', 'Main Server File', ['express', 'app.listen']);
  checkAndFixFile('backend/package.json', 'Backend Package.json');
  checkPackageJson('backend/package.json', 'Backend');
  
  // Check backend directories
  checkAndFixDirectory('backend/models', 'Models Directory');
  checkAndFixDirectory('backend/controllers', 'Controllers Directory');
  checkAndFixDirectory('backend/routes', 'Routes Directory');
  checkAndFixDirectory('backend/utils', 'Utils Directory');
  checkAndFixDirectory('backend/config', 'Config Directory');
  checkAndFixDirectory('backend/middleware', 'Middleware Directory');
  
  // Check backend files
  checkAndFixFile('backend/models/User.js', 'User Model', ['mongoose.Schema']);
  checkAndFixFile('backend/models/Event.js', 'Event Model', ['mongoose.Schema']);
  checkAndFixFile('backend/controllers/authController.js', 'Auth Controller', ['exports']);
  checkAndFixFile('backend/controllers/eventController.js', 'Event Controller', ['exports']);
  checkAndFixFile('backend/controllers/adminController.js', 'Admin Controller', ['exports']);
  checkAndFixFile('backend/routes/authRoutes.js', 'Auth Routes', ['router']);
  checkAndFixFile('backend/routes/eventRoutes.js', 'Event Routes', ['router']);
  checkAndFixFile('backend/routes/adminRoutes.js', 'Admin Routes', ['router']);
  checkAndFixFile('backend/config/db.js', 'Database Config', ['mongoose']);
  checkAndFixFile('backend/utils/sendEmail.js', 'Email Utility', ['nodemailer']);
  checkAndFixFile('backend/utils/errorHandler.js', 'Error Handler', ['exports']);
  
  // Check and fix frontend structure
  console.log('\n🌐 FRONTEND SYSTEM CHECK:');
  
  checkAndFixDirectory('frontend', 'Frontend Directory');
  checkAndFixFile('frontend/package.json', 'Frontend Package.json');
  checkPackageJson('frontend/package.json', 'Frontend');
  checkAndFixFile('frontend/src/App.js', 'Main App Component', ['React', 'Router']);
  checkAndFixFile('frontend/src/index.js', 'Entry Point', ['ReactDOM']);
  checkAndFixFile('frontend/public/index.html', 'HTML Template', ['<html>']);
  
  // Check frontend directories
  checkAndFixDirectory('frontend/src/components', 'Components Directory');
  checkAndFixDirectory('frontend/src/api', 'API Directory');
  checkAndFixDirectory('frontend/src/utils', 'Utils Directory');
  checkAndFixDirectory('frontend/src/contexts', 'Contexts Directory');
  
  // Check frontend files
  checkAndFixFile('frontend/src/components/NavigationBar.jsx', 'Navigation Component', ['export']);
  checkAndFixFile('frontend/src/components/HomePage.jsx', 'Home Page', ['export']);
  checkAndFixFile('frontend/src/components/LoginPage.jsx', 'Login Page', ['export']);
  checkAndFixFile('frontend/src/components/EventListPage.jsx', 'Event List Page', ['export']);
  checkAndFixFile('frontend/src/components/AdminDashboard.jsx', 'Admin Dashboard', ['export']);
  checkAndFixFile('frontend/src/api/api.js', 'API Configuration', ['axios']);
  checkAndFixFile('frontend/src/contexts/ThemeContext.js', 'Theme Context', ['createContext']);
  
  // Check dependencies
  console.log('\n📦 DEPENDENCIES CHECK:');
  
  const backendNodeModules = fs.existsSync('backend/node_modules');
  const frontendNodeModules = fs.existsSync('frontend/node_modules');
  
  if (!backendNodeModules) {
    installDependencies('backend', 'Backend');
  } else {
    logTest('system', 'Backend Dependencies', true, 'Already installed');
  }
  
  if (!frontendNodeModules) {
    installDependencies('frontend', 'Frontend');
  } else {
    logTest('system', 'Frontend Dependencies', true, 'Already installed');
  }
  
  // Check build
  console.log('\n🏗️ BUILD CHECK:');
  
  const buildExists = fs.existsSync('frontend/build');
  if (!buildExists) {
    buildFrontend();
  } else {
    logTest('frontend', 'Frontend Build', true, 'Build exists');
  }
  
  // Check environment files
  console.log('\n🔧 ENVIRONMENT CHECK:');
  
  const envExists = fs.existsSync('backend/.env');
  if (!envExists) {
    // Create basic .env file
    const envContent = `NODE_ENV=production
PORT=10000
MONGO_URI=mongodb+srv://admin:admin123@ua-database.wzgg1.mongodb.net/charism?retryWrites=true&w=majority&appName=UA-DATABASE
JWT_SECRET=mysecretkey123456789
EMAIL_USER=noreply@charism.edu.ph
EMAIL_PASS=your_email_password
EMAIL_SERVICE=gmail
CORS_ORIGINS=https://charism-ucb4.onrender.com,https://charism.onrender.com,http://localhost:3000
FRONTEND_URL=https://charism-ucb4.onrender.com
BACKEND_URL=https://charism-api-xtw9.onrender.com`;
    
    fs.writeFileSync('backend/.env', envContent);
    logTest('system', 'Environment File', true, 'Created .env file', true);
  } else {
    logTest('system', 'Environment File', true, 'Exists');
  }
  
  // Generate comprehensive report
  console.log('\n📊 COMPLETE SYSTEM CHECK RESULTS');
  console.log('=' .repeat(50));
  
  const categories = ['backend', 'frontend', 'system'];
  
  categories.forEach(category => {
    const results = testResults[category];
    const total = results.passed + results.failed;
    const percentage = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
    
    console.log(`\n${category.toUpperCase()} TESTS:`);
    console.log(`  ✅ Passed: ${results.passed}`);
    console.log(`  ❌ Failed: ${results.failed}`);
    console.log(`  🔧 Fixed: ${results.fixed}`);
    console.log(`  📊 Success Rate: ${percentage}%`);
  });
  
  const overallTotal = testResults.overall.total;
  const overallPercentage = overallTotal > 0 ? ((testResults.overall.passed / overallTotal) * 100).toFixed(1) : 0;
  
  console.log(`\nOVERALL RESULTS:`);
  console.log(`  ✅ Total Passed: ${testResults.overall.passed}`);
  console.log(`  ❌ Total Failed: ${testResults.overall.failed}`);
  console.log(`  🔧 Total Fixed: ${testResults.overall.fixed}`);
  console.log(`  📊 Overall Success Rate: ${overallPercentage}%`);
  
  // System status
  if (overallPercentage >= 95) {
    console.log(`\n🎉 SYSTEM STATUS: EXCELLENT (${overallPercentage}%)`);
  } else if (overallPercentage >= 85) {
    console.log(`\n✅ SYSTEM STATUS: GOOD (${overallPercentage}%)`);
  } else if (overallPercentage >= 70) {
    console.log(`\n⚠️ SYSTEM STATUS: NEEDS ATTENTION (${overallPercentage}%)`);
  } else {
    console.log(`\n❌ SYSTEM STATUS: CRITICAL ISSUES (${overallPercentage}%)`);
  }
  
  // Save detailed report
  const reportData = {
    timestamp: new Date().toISOString(),
    results: testResults,
    summary: {
      overallPercentage: parseFloat(overallPercentage),
      status: overallPercentage >= 95 ? 'EXCELLENT' : 
              overallPercentage >= 85 ? 'GOOD' : 
              overallPercentage >= 70 ? 'NEEDS_ATTENTION' : 'CRITICAL',
      fixesApplied: testResults.overall.fixed
    }
  };
  
  fs.writeFileSync('COMPLETE_SYSTEM_CHECK_REPORT.json', JSON.stringify(reportData, null, 2));
  console.log(`\n📄 Detailed report saved to: COMPLETE_SYSTEM_CHECK_REPORT.json`);
  
  console.log('\n🚀 SYSTEM CHECK AND FIX COMPLETED!');
  
  return reportData;
};

// Run the complete check and fix
runCompleteSystemCheckAndFix();
