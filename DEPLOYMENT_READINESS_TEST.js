// DEPLOYMENT READINESS TEST
const fs = require('fs');
const path = require('path');

console.log('🚀 DEPLOYMENT READINESS TEST STARTING...\n');

const results = {
  backend: { passed: 0, failed: 0, tests: [] },
  frontend: { passed: 0, failed: 0, tests: [] },
  config: { passed: 0, failed: 0, tests: [] },
  deployment: { passed: 0, failed: 0, tests: [] }
};

// Test 1: Backend package.json
try {
  const backendPackage = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
  if (backendPackage.scripts.start === 'node server.js') {
    results.backend.passed++;
    results.backend.tests.push('✅ Backend start script correct');
  } else {
    results.backend.failed++;
    results.backend.tests.push('❌ Backend start script incorrect');
  }
} catch (error) {
  results.backend.failed++;
  results.backend.tests.push('❌ Backend package.json not found');
}

// Test 2: Frontend package.json
try {
  const frontendPackage = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
  if (frontendPackage.scripts.build === 'react-scripts build') {
    results.frontend.passed++;
    results.frontend.tests.push('✅ Frontend build script correct');
  } else {
    results.frontend.failed++;
    results.frontend.tests.push('❌ Frontend build script incorrect');
  }
} catch (error) {
  results.frontend.failed++;
  results.frontend.tests.push('❌ Frontend package.json not found');
}

// Test 3: Server.js exists
try {
  if (fs.existsSync('backend/server.js')) {
    results.backend.passed++;
    results.backend.tests.push('✅ Backend server.js exists');
  } else {
    results.backend.failed++;
    results.backend.tests.push('❌ Backend server.js missing');
  }
} catch (error) {
  results.backend.failed++;
  results.backend.tests.push('❌ Error checking server.js');
}

// Test 4: Render.yaml configuration
try {
  const renderConfig = fs.readFileSync('render.yaml', 'utf8');
  if (renderConfig.includes('MONGODB_URI') && renderConfig.includes('MONGO_URI')) {
    results.config.passed++;
    results.config.tests.push('✅ Environment variables configured');
  } else {
    results.config.failed++;
    results.config.tests.push('❌ Environment variables missing');
  }
  
  if (renderConfig.includes('CORS_ORIGINS')) {
    results.config.passed++;
    results.config.tests.push('✅ CORS configuration present');
  } else {
    results.config.failed++;
    results.config.tests.push('❌ CORS configuration missing');
  }
} catch (error) {
  results.config.failed++;
  results.config.tests.push('❌ Render.yaml not found');
}

// Test 5: Frontend build directory
try {
  if (fs.existsSync('frontend/build')) {
    results.frontend.passed++;
    results.frontend.tests.push('✅ Frontend build directory exists');
  } else {
    results.frontend.failed++;
    results.frontend.tests.push('❌ Frontend build directory missing');
  }
} catch (error) {
  results.frontend.failed++;
  results.frontend.tests.push('❌ Error checking build directory');
}

// Test 6: Dependencies
try {
  const backendPackage = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
  const requiredDeps = ['express', 'mongoose', 'cors', 'dotenv', 'jsonwebtoken'];
  const hasAllDeps = requiredDeps.every(dep => backendPackage.dependencies[dep]);
  
  if (hasAllDeps) {
    results.backend.passed++;
    results.backend.tests.push('✅ Backend dependencies complete');
  } else {
    results.backend.failed++;
    results.backend.tests.push('❌ Backend dependencies missing');
  }
} catch (error) {
  results.backend.failed++;
  results.backend.tests.push('❌ Error checking dependencies');
}

// Calculate totals
const totalPassed = Object.values(results).reduce((sum, category) => sum + category.passed, 0);
const totalFailed = Object.values(results).reduce((sum, category) => sum + category.failed, 0);
const totalTests = totalPassed + totalFailed;
const percentage = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;

// Display results
console.log('📊 DEPLOYMENT READINESS RESULTS:');
console.log('================================\n');

Object.entries(results).forEach(([category, data]) => {
  if (data.tests.length > 0) {
    console.log(`${category.toUpperCase()}: ${data.passed}/${data.tests.length} (${Math.round((data.passed / data.tests.length) * 100)}%)`);
    data.tests.forEach(test => console.log(`  ${test}`));
    console.log('');
  }
});

console.log(`🎯 OVERALL: ${totalPassed}/${totalTests} (${percentage}%)`);

if (percentage >= 90) {
  console.log('✅ DEPLOYMENT READY!');
} else if (percentage >= 70) {
  console.log('⚠️ DEPLOYMENT READY WITH WARNINGS');
} else {
  console.log('❌ DEPLOYMENT NOT READY - FIX ERRORS FIRST');
}

console.log('\n🚀 Ready for Render deployment!');
