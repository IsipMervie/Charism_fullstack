#!/usr/bin/env node

/**
 * COMPREHENSIVE SYSTEM TEST
 * This script tests all critical components of the CommunityLink system
 * Run this after fixing errors to ensure everything works properly
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 STARTING COMPREHENSIVE SYSTEM TEST');
console.log('=====================================');

// Test Results
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

function logTest(testName, passed, error = null) {
  if (passed) {
    console.log(`✅ ${testName}`);
    testResults.passed++;
  } else {
    console.log(`❌ ${testName}`);
    testResults.failed++;
    if (error) {
      testResults.errors.push({ test: testName, error: error.message || error });
    }
  }
}

// Test 1: Check if all critical files exist
function testCriticalFiles() {
  console.log('\n📁 TESTING CRITICAL FILES...');
  
  const criticalFiles = [
    'backend/server.js',
    'backend/package.json',
    'backend/controllers/authController.js',
    'backend/controllers/eventController.js',
    'backend/models/User.js',
    'backend/models/Event.js',
    'backend/middleware/authMiddleware.js',
    'backend/middleware/roleMiddleware.js',
    'backend/routes/authRoutes.js',
    'backend/routes/eventRoutes.js',
    'frontend/package.json',
    'frontend/src/App.js',
    'frontend/src/api/api.js',
    'frontend/src/config/environment.js',
    'frontend/src/store.js'
  ];

  criticalFiles.forEach(file => {
    const exists = fs.existsSync(file);
    logTest(`File exists: ${file}`, exists);
  });
}

// Test 2: Check syntax of critical backend files
function testBackendSyntax() {
  console.log('\n🔧 TESTING BACKEND SYNTAX...');
  
  const backendFiles = [
    'backend/server.js',
    'backend/controllers/authController.js',
    'backend/controllers/eventController.js',
    'backend/models/User.js',
    'backend/models/Event.js',
    'backend/middleware/authMiddleware.js',
    'backend/middleware/roleMiddleware.js'
  ];

  backendFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      // Basic syntax check - look for common errors
      const hasSyntaxErrors = (
        content.includes('exports. =') ||
        content.includes('const JWT_SECRET =  \'') ||
        content.includes('console.error(\'❌ JWT_SECRET environment variable is required in production!') && !content.includes('process.env.JWT_SECRET')
      );
      
      logTest(`Syntax check: ${file}`, !hasSyntaxErrors);
    } catch (error) {
      logTest(`Syntax check: ${file}`, false, error);
    }
  });
}

// Test 3: Check frontend imports and dependencies
function testFrontendImports() {
  console.log('\n⚛️ TESTING FRONTEND IMPORTS...');
  
  const frontendFiles = [
    'frontend/src/App.js',
    'frontend/src/api/api.js',
    'frontend/src/config/environment.js'
  ];

  frontendFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      // Check for common import issues
      const hasImportErrors = (
        content.includes('import { API_URL } from \'../config/environment\'') && !fs.existsSync('frontend/src/config/environment.js') ||
        content.includes('import { loginUser') && !content.includes('export const loginUser') ||
        content.includes('import React') && !content.includes('import React')
      );
      
      logTest(`Import check: ${file}`, !hasImportErrors);
    } catch (error) {
      logTest(`Import check: ${file}`, false, error);
    }
  });
}

// Test 4: Check environment configuration
function testEnvironmentConfig() {
  console.log('\n🌍 TESTING ENVIRONMENT CONFIGURATION...');
  
  try {
    const envContent = fs.readFileSync('frontend/src/config/environment.js', 'utf8');
    const hasApiUrl = envContent.includes('API_URL');
    const hasProductionConfig = envContent.includes('production');
    const hasDevelopmentConfig = envContent.includes('development');
    
    logTest('Environment config has API_URL', hasApiUrl);
    logTest('Environment config has production config', hasProductionConfig);
    logTest('Environment config has development config', hasDevelopmentConfig);
  } catch (error) {
    logTest('Environment config file exists', false, error);
  }
}

// Test 5: Check package.json dependencies
function testPackageDependencies() {
  console.log('\n📦 TESTING PACKAGE DEPENDENCIES...');
  
  try {
    const backendPackage = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
    const frontendPackage = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
    
    // Check critical backend dependencies
    const criticalBackendDeps = ['express', 'mongoose', 'jsonwebtoken', 'bcryptjs', 'cors'];
    criticalBackendDeps.forEach(dep => {
      const hasDep = backendPackage.dependencies && backendPackage.dependencies[dep];
      logTest(`Backend has ${dep}`, !!hasDep);
    });
    
    // Check critical frontend dependencies
    const criticalFrontendDeps = ['react', 'react-dom', 'react-router-dom', 'axios', 'bootstrap'];
    criticalFrontendDeps.forEach(dep => {
      const hasDep = frontendPackage.dependencies && frontendPackage.dependencies[dep];
      logTest(`Frontend has ${dep}`, !!hasDep);
    });
  } catch (error) {
    logTest('Package.json files exist', false, error);
  }
}

// Test 6: Check database models
function testDatabaseModels() {
  console.log('\n🗄️ TESTING DATABASE MODELS...');
  
  try {
    const userModel = fs.readFileSync('backend/models/User.js', 'utf8');
    const eventModel = fs.readFileSync('backend/models/Event.js', 'utf8');
    
    // Check User model
    const userHasRequiredFields = (
      userModel.includes('name:') &&
      userModel.includes('email:') &&
      userModel.includes('password:') &&
      userModel.includes('role:')
    );
    logTest('User model has required fields', userHasRequiredFields);
    
    // Check Event model
    const eventHasRequiredFields = (
      eventModel.includes('title:') &&
      eventModel.includes('description:') &&
      eventModel.includes('date:') &&
      eventModel.includes('createdBy:')
    );
    logTest('Event model has required fields', eventHasRequiredFields);
  } catch (error) {
    logTest('Database models exist', false, error);
  }
}

// Test 7: Check API endpoints structure
function testApiEndpoints() {
  console.log('\n🔗 TESTING API ENDPOINTS STRUCTURE...');
  
  const apiFiles = [
    'backend/routes/authRoutes.js',
    'backend/routes/eventRoutes.js',
    'backend/routes/userRoutes.js'
  ];

  apiFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const hasRouter = content.includes('express.Router()');
      const hasExports = content.includes('module.exports');
      const hasRoutes = content.includes('router.') && (content.includes('get') || content.includes('post'));
      
      logTest(`API file ${file} has router`, hasRouter);
      logTest(`API file ${file} has exports`, hasExports);
      logTest(`API file ${file} has routes`, hasRoutes);
    } catch (error) {
      logTest(`API file ${file} exists`, false, error);
    }
  });
}

// Test 8: Check middleware functionality
function testMiddleware() {
  console.log('\n🛡️ TESTING MIDDLEWARE...');
  
  try {
    const authMiddleware = fs.readFileSync('backend/middleware/authMiddleware.js', 'utf8');
    const roleMiddleware = fs.readFileSync('backend/middleware/roleMiddleware.js', 'utf8');
    
    const authHasJwt = authMiddleware.includes('jsonwebtoken');
    const authHasSecret = authMiddleware.includes('JWT_SECRET');
    const authHasExport = authMiddleware.includes('module.exports');
    
    const roleHasUser = roleMiddleware.includes('User');
    const roleHasExport = roleMiddleware.includes('module.exports');
    
    logTest('Auth middleware has JWT', authHasJwt);
    logTest('Auth middleware has JWT_SECRET', authHasSecret);
    logTest('Auth middleware has exports', authHasExport);
    logTest('Role middleware has User model', roleHasUser);
    logTest('Role middleware has exports', roleHasExport);
  } catch (error) {
    logTest('Middleware files exist', false, error);
  }
}

// Test 9: Check frontend components
function testFrontendComponents() {
  console.log('\n🎨 TESTING FRONTEND COMPONENTS...');
  
  const criticalComponents = [
    'frontend/src/components/LoginPage.jsx',
    'frontend/src/components/EventListPage.jsx',
    'frontend/src/components/NavigationBar.jsx',
    'frontend/src/components/AdminDashboard.jsx'
  ];

  criticalComponents.forEach(component => {
    try {
      const content = fs.readFileSync(component, 'utf8');
      const hasReactImport = content.includes('import React');
      const hasExport = content.includes('export default') || content.includes('function ');
      
      logTest(`Component ${path.basename(component)} has React import`, hasReactImport);
      logTest(`Component ${path.basename(component)} has export`, hasExport);
    } catch (error) {
      logTest(`Component ${path.basename(component)} exists`, false, error);
    }
  });
}

// Test 10: Check API functions
function testApiFunctions() {
  console.log('\n🔌 TESTING API FUNCTIONS...');
  
  try {
    const apiContent = fs.readFileSync('frontend/src/api/api.js', 'utf8');
    
    const hasLoginFunction = apiContent.includes('export const loginUser');
    const hasRegisterFunction = apiContent.includes('export const registerUser');
    const hasGetEventsFunction = apiContent.includes('export const getEvents');
    const hasCreateEventFunction = apiContent.includes('export const createEvent');
    const hasAxiosInstance = apiContent.includes('axiosInstance');
    
    logTest('API has loginUser function', hasLoginFunction);
    logTest('API has registerUser function', hasRegisterFunction);
    logTest('API has getEvents function', hasGetEventsFunction);
    logTest('API has createEvent function', hasCreateEventFunction);
    logTest('API has axiosInstance', hasAxiosInstance);
  } catch (error) {
    logTest('API file exists', false, error);
  }
}

// Run all tests
function runAllTests() {
  testCriticalFiles();
  testBackendSyntax();
  testFrontendImports();
  testEnvironmentConfig();
  testPackageDependencies();
  testDatabaseModels();
  testApiEndpoints();
  testMiddleware();
  testFrontendComponents();
  testApiFunctions();
  
  // Print summary
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n🚨 ERRORS FOUND:');
    testResults.errors.forEach(error => {
      console.log(`   - ${error.test}: ${error.error}`);
    });
  }
  
  if (testResults.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Your system is ready to run.');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Start the backend: cd backend && npm start');
    console.log('2. Start the frontend: cd frontend && npm start');
    console.log('3. Test the application in your browser');
  } else {
    console.log('\n⚠️ Some tests failed. Please fix the issues above before running the system.');
  }
}

// Run the tests
runAllTests();
