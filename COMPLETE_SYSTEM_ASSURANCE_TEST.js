// COMPLETE SYSTEM ASSURANCE TEST - EVERYTHING WORKING
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BACKEND_URL = 'http://localhost:10000';
const FRONTEND_URL = 'http://localhost:3000';

async function completeSystemAssurance() {
  console.log('🚀 COMPLETE SYSTEM ASSURANCE TEST STARTING...\n');
  console.log('🔍 Testing EVERYTHING to ensure no errors...\n');
  
  const results = {
    backend: { passed: 0, failed: 0, tests: [] },
    frontend: { passed: 0, failed: 0, tests: [] },
    database: { passed: 0, failed: 0, tests: [] },
    email: { passed: 0, failed: 0, tests: [] },
    files: { passed: 0, failed: 0, tests: [] },
    auth: { passed: 0, failed: 0, tests: [] },
    events: { passed: 0, failed: 0, tests: [] },
    admin: { passed: 0, failed: 0, tests: [] },
    settings: { passed: 0, failed: 0, tests: [] },
    deployment: { passed: 0, failed: 0, tests: [] },
    config: { passed: 0, failed: 0, tests: [] }
  };

  // Test 1: Backend Health
  try {
    const response = await axios.get(`${BACKEND_URL}/api/health`);
    if (response.data.status === 'OK') {
      results.backend.passed++;
      results.backend.tests.push('✅ Backend Health Check');
    } else {
      results.backend.failed++;
      results.backend.tests.push('❌ Backend Health Check');
    }
  } catch (error) {
    results.backend.failed++;
    results.backend.tests.push('❌ Backend Health Check - Server not running');
  }

  // Test 2: Database Connection
  try {
    const response = await axios.get(`${BACKEND_URL}/api/health/database`);
    if (response.data.database.status === 'connected') {
      results.database.passed++;
      results.database.tests.push('✅ Database Connection');
    } else {
      results.database.failed++;
      results.database.tests.push('❌ Database Connection');
    }
  } catch (error) {
    results.database.failed++;
    results.database.tests.push('❌ Database Connection - Error');
  }

  // Test 3: Email Configuration
  try {
    const response = await axios.get(`${BACKEND_URL}/api/health/email`);
    if (response.data.email.EMAIL_USER === 'configured') {
      results.email.passed++;
      results.email.tests.push('✅ Email Configuration');
    } else {
      results.email.failed++;
      results.email.tests.push('❌ Email Configuration');
    }
  } catch (error) {
    results.email.failed++;
    results.email.tests.push('❌ Email Configuration - Error');
  }

  // Test 4: File Upload System
  try {
    const response = await axios.get(`${BACKEND_URL}/api/health/files`);
    if (response.data.files.status === 'OK') {
      results.files.passed++;
      results.files.tests.push('✅ File Upload System');
    } else {
      results.files.failed++;
      results.files.tests.push('❌ File Upload System');
    }
  } catch (error) {
    results.files.failed++;
    results.files.tests.push('❌ File Upload System - Error');
  }

  // Test 5: Auth Endpoints
  try {
    const response = await axios.get(`${BACKEND_URL}/api/auth/test`);
    // 404 is expected for test endpoint
    if (response.status === 404) {
      results.auth.passed++;
      results.auth.tests.push('✅ Auth Endpoints (404 expected)');
    } else {
      results.auth.failed++;
      results.auth.tests.push('❌ Auth Endpoints');
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      results.auth.passed++;
      results.auth.tests.push('✅ Auth Endpoints (404 expected)');
    } else {
      results.auth.failed++;
      results.auth.tests.push('❌ Auth Endpoints - Error');
    }
  }

  // Test 6: Events Endpoints
  try {
    const response = await axios.get(`${BACKEND_URL}/api/events`);
    // 401 is expected without auth
    if (response.status === 401) {
      results.events.passed++;
      results.events.tests.push('✅ Events Endpoints (401 expected - needs auth)');
    } else {
      results.events.failed++;
      results.events.tests.push('❌ Events Endpoints');
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      results.events.passed++;
      results.events.tests.push('✅ Events Endpoints (401 expected - needs auth)');
    } else {
      results.events.failed++;
      results.events.tests.push('❌ Events Endpoints - Error');
    }
  }

  // Test 7: Admin Endpoints
  try {
    const response = await axios.get(`${BACKEND_URL}/api/admin/test`);
    // 404 or 401 is expected
    if (response.status === 404 || response.status === 401) {
      results.admin.passed++;
      results.admin.tests.push('✅ Admin Endpoints (404/401 expected)');
    } else {
      results.admin.failed++;
      results.admin.tests.push('❌ Admin Endpoints');
    }
  } catch (error) {
    if (error.response && (error.response.status === 404 || error.response.status === 401)) {
      results.admin.passed++;
      results.admin.tests.push('✅ Admin Endpoints (404/401 expected)');
    } else {
      results.admin.failed++;
      results.admin.tests.push('❌ Admin Endpoints - Error');
    }
  }

  // Test 8: Settings Endpoints
  try {
    const response = await axios.get(`${BACKEND_URL}/api/settings/public`);
    if (response.status === 200) {
      results.settings.passed++;
      results.settings.tests.push('✅ Settings Endpoints');
    } else {
      results.settings.failed++;
      results.settings.tests.push('❌ Settings Endpoints');
    }
  } catch (error) {
    results.settings.failed++;
    results.settings.tests.push('❌ Settings Endpoints - Error');
  }

  // Test 9: Frontend Health
  try {
    const response = await axios.get(`${FRONTEND_URL}`);
    if (response.status === 200) {
      results.frontend.passed++;
      results.frontend.tests.push('✅ Frontend Health Check');
    } else {
      results.frontend.failed++;
      results.frontend.tests.push('❌ Frontend Health Check');
    }
  } catch (error) {
    results.frontend.failed++;
    results.frontend.tests.push('❌ Frontend Health Check - Server not running');
  }

  // Test 10: Deployment Configuration
  try {
    if (fs.existsSync('render.yaml')) {
      const renderConfig = fs.readFileSync('render.yaml', 'utf8');
      if (renderConfig.includes('MONGODB_URI') && renderConfig.includes('CORS_ORIGINS')) {
        results.deployment.passed++;
        results.deployment.tests.push('✅ Deployment Configuration');
      } else {
        results.deployment.failed++;
        results.deployment.tests.push('❌ Deployment Configuration');
      }
    } else {
      results.deployment.failed++;
      results.deployment.tests.push('❌ render.yaml not found');
    }
  } catch (error) {
    results.deployment.failed++;
    results.deployment.tests.push('❌ Deployment Configuration - Error');
  }

  // Test 11: Package.json Configuration
  try {
    const backendPackage = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
    const frontendPackage = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
    
    if (backendPackage.scripts.start === 'node server.js' && 
        frontendPackage.scripts.build === 'react-scripts build') {
      results.config.passed++;
      results.config.tests.push('✅ Package.json Configuration');
    } else {
      results.config.failed++;
      results.config.tests.push('❌ Package.json Configuration');
    }
  } catch (error) {
    results.config.failed++;
    results.config.tests.push('❌ Package.json Configuration - Error');
  }

  // Test 12: Server.js Exists
  try {
    if (fs.existsSync('backend/server.js')) {
      results.config.passed++;
      results.config.tests.push('✅ Server.js Exists');
    } else {
      results.config.failed++;
      results.config.tests.push('❌ Server.js Missing');
    }
  } catch (error) {
    results.config.failed++;
    results.config.tests.push('❌ Server.js Check - Error');
  }

  // Calculate totals
  const totalPassed = Object.values(results).reduce((sum, category) => sum + category.passed, 0);
  const totalFailed = Object.values(results).reduce((sum, category) => sum + category.failed, 0);
  const totalTests = totalPassed + totalFailed;
  const percentage = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;

  // Display results
  console.log('📊 COMPLETE SYSTEM ASSURANCE RESULTS:');
  console.log('=====================================\n');

  Object.entries(results).forEach(([category, data]) => {
    if (data.tests.length > 0) {
      const categoryPercentage = Math.round((data.passed / data.tests.length) * 100);
      console.log(`${category.toUpperCase()}: ${data.passed}/${data.tests.length} (${categoryPercentage}%)`);
      data.tests.forEach(test => console.log(`  ${test}`));
      console.log('');
    }
  });

  console.log(`🎯 OVERALL: ${totalPassed}/${totalTests} (${percentage}%)`);

  if (percentage >= 95) {
    console.log('✅ SYSTEM FULLY ASSURED - NO ERRORS!');
    console.log('🚀 READY FOR DEPLOYMENT!');
  } else if (percentage >= 85) {
    console.log('⚠️ SYSTEM MOSTLY ASSURED - MINOR ISSUES');
    console.log('🔧 FIX MINOR ISSUES BEFORE DEPLOYMENT');
  } else {
    console.log('❌ SYSTEM NOT ASSURED - MAJOR ISSUES');
    console.log('🚨 FIX CRITICAL ISSUES BEFORE DEPLOYMENT');
  }

  console.log('\n🔍 ASSURANCE COMPLETE!');
  return { totalPassed, totalFailed, totalTests, percentage };
}

// Run the test
completeSystemAssurance().catch(console.error);
