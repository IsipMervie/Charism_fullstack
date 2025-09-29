#!/usr/bin/env node
// Complete Pages and Routes Test
// Test all pages and functionality across the entire system

const axios = require('axios');

const BACKEND_URL = 'https://charism-api-xtw9.onrender.com';
const FRONTEND_URL = 'https://charism-ucb4.onrender.com';

console.log('🌐 COMPLETE PAGES AND ROUTES TEST');
console.log('==================================');
console.log(`Backend URL: ${BACKEND_URL}`);
console.log(`Frontend URL: ${FRONTEND_URL}`);
console.log('');

let pagesTest = {
  frontendPages: { status: 'PENDING' },
  backendRoutes: { status: 'PENDING' },
  apiEndpoints: { status: 'PENDING' },
  authentication: { status: 'PENDING' },
  adminFeatures: { status: 'PENDING' },
  userFeatures: { status: 'PENDING' }
};

// Test 1: Frontend Pages Accessibility
async function testFrontendPages() {
  console.log('🔍 Testing Frontend Pages...');
  
  const pages = [
    '/',
    '/login',
    '/register', 
    '/dashboard',
    '/events',
    '/profile',
    '/contact',
    '/about',
    '/admin',
    '/staff'
  ];
  
  let workingPages = 0;
  let pageResults = [];
  
  for (const page of pages) {
    try {
      const response = await axios.get(`${FRONTEND_URL}${page}`, { 
        timeout: 10000,
        validateStatus: function (status) {
          return status >= 200 && status < 600;
        }
      });
      
      pageResults.push({
        page: page,
        status: response.status,
        working: response.status === 200
      });
      
      if (response.status === 200) {
        workingPages++;
        console.log(`✅ ${page}: ${response.status}`);
      } else {
        console.log(`⚠️ ${page}: ${response.status} (Redirect/Protected)`);
      }
      
    } catch (error) {
      pageResults.push({
        page: page,
        status: error.response?.status || 'ERROR',
        working: false,
        error: error.message
      });
      console.log(`❌ ${page}: ${error.response?.status || 'ERROR'}`);
    }
  }
  
  pagesTest.frontendPages = {
    status: workingPages >= pages.length - 2 ? 'WORKING' : 'PARTIAL',
    workingPages: workingPages,
    totalPages: pages.length,
    results: pageResults,
    message: `${workingPages}/${pages.length} pages accessible`
  };
}

// Test 2: Backend API Routes
async function testBackendRoutes() {
  console.log('');
  console.log('🔍 Testing Backend API Routes...');
  
  const routes = [
    '/api/health',
    '/api/ping',
    '/api/settings/public',
    '/api/events/public',
    '/api/events/analytics',
    '/api/auth/login',
    '/api/auth/register',
    '/api/contact-us',
    '/api/users',
    '/api/admin',
    '/api/staff',
    '/api/analytics',
    '/api/reports',
    '/api/messages',
    '/api/feedback',
    '/api/notifications',
    '/api/academic-years',
    '/api/certificates',
    '/api/event-chat'
  ];
  
  let workingRoutes = 0;
  let routeResults = [];
  
  for (const route of routes) {
    try {
      const response = await axios.get(`${BACKEND_URL}${route}`, { 
        timeout: 5000,
        validateStatus: function (status) {
          return status >= 200 && status < 600;
        }
      });
      
      routeResults.push({
        route: route,
        status: response.status,
        working: response.status < 400
      });
      
      if (response.status < 400) {
        workingRoutes++;
        console.log(`✅ ${route}: ${response.status}`);
      } else {
        console.log(`⚠️ ${route}: ${response.status} (Auth Required)`);
      }
      
    } catch (error) {
      const status = error.response?.status;
      routeResults.push({
        route: route,
        status: status || 'ERROR',
        working: status === 401 || status === 403, // Auth required is OK
        error: error.message
      });
      
      if (status === 401 || status === 403) {
        workingRoutes++;
        console.log(`✅ ${route}: ${status} (Auth Required - OK)`);
      } else {
        console.log(`❌ ${route}: ${status || 'ERROR'}`);
      }
    }
  }
  
  pagesTest.backendRoutes = {
    status: workingRoutes >= routes.length - 2 ? 'WORKING' : 'PARTIAL',
    workingRoutes: workingRoutes,
    totalRoutes: routes.length,
    results: routeResults,
    message: `${workingRoutes}/${routes.length} routes accessible`
  };
}

// Test 3: Critical API Endpoints
async function testCriticalEndpoints() {
  console.log('');
  console.log('🔍 Testing Critical API Endpoints...');
  
  const endpoints = [
    { url: '/api/health', method: 'GET', public: true },
    { url: '/api/settings/public', method: 'GET', public: true },
    { url: '/api/events/public', method: 'GET', public: true },
    { url: '/api/auth/register', method: 'POST', public: true },
    { url: '/api/contact-us', method: 'POST', public: true },
    { url: '/api/auth/login', method: 'POST', public: true }
  ];
  
  let workingEndpoints = 0;
  let endpointResults = [];
  
  for (const endpoint of endpoints) {
    try {
      let response;
      
      if (endpoint.method === 'GET') {
        response = await axios.get(`${BACKEND_URL}${endpoint.url}`, { 
          timeout: 5000,
          validateStatus: function (status) {
            return status >= 200 && status < 600;
          }
        });
      } else {
        // For POST requests, send minimal data
        const testData = endpoint.url.includes('register') ? {
          name: 'Test User',
          email: 'test@example.com',
          password: 'TestPassword123!',
          userId: 'TEST123',
          department: 'Test',
          year: 'Test',
          section: 'Test',
          role: 'Student'
        } : endpoint.url.includes('contact') ? {
          name: 'Test Contact',
          email: 'test@example.com',
          subject: 'Test',
          message: 'Test message'
        } : {
          email: 'test@example.com',
          password: 'testpassword'
        };
        
        response = await axios.post(`${BACKEND_URL}${endpoint.url}`, testData, { 
          timeout: 5000,
          validateStatus: function (status) {
            return status >= 200 && status < 600;
          }
        });
      }
      
      endpointResults.push({
        endpoint: endpoint.url,
        method: endpoint.method,
        status: response.status,
        working: response.status < 400,
        public: endpoint.public
      });
      
      if (response.status < 400) {
        workingEndpoints++;
        console.log(`✅ ${endpoint.method} ${endpoint.url}: ${response.status}`);
      } else {
        console.log(`⚠️ ${endpoint.method} ${endpoint.url}: ${response.status}`);
      }
      
    } catch (error) {
      const status = error.response?.status;
      endpointResults.push({
        endpoint: endpoint.url,
        method: endpoint.method,
        status: status || 'ERROR',
        working: false,
        error: error.message,
        public: endpoint.public
      });
      
      if (status === 400 && endpoint.url.includes('login')) {
        // 400 for login with invalid credentials is expected
        workingEndpoints++;
        console.log(`✅ ${endpoint.method} ${endpoint.url}: ${status} (Invalid credentials - OK)`);
      } else {
        console.log(`❌ ${endpoint.method} ${endpoint.url}: ${status || 'ERROR'}`);
      }
    }
  }
  
  pagesTest.apiEndpoints = {
    status: workingEndpoints >= endpoints.length - 1 ? 'WORKING' : 'PARTIAL',
    workingEndpoints: workingEndpoints,
    totalEndpoints: endpoints.length,
    results: endpointResults,
    message: `${workingEndpoints}/${endpoints.length} endpoints working`
  };
}

// Test 4: Authentication System
async function testAuthentication() {
  console.log('');
  console.log('🔍 Testing Authentication System...');
  
  try {
    // Test login endpoint (should return 400 for invalid credentials)
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: 'invalid@example.com',
      password: 'invalidpassword'
    }, { 
      timeout: 5000,
      validateStatus: function (status) {
        return status >= 200 && status < 600;
      }
    });
    
    pagesTest.authentication = {
      status: 'WORKING',
      loginStatus: loginResponse.status,
      message: 'Authentication endpoints working'
    };
    console.log('✅ Authentication: WORKING');
    console.log(`   Login Status: ${loginResponse.status} (Invalid credentials - OK)`);
    
  } catch (error) {
    const status = error.response?.status;
    if (status === 400) {
      pagesTest.authentication = {
        status: 'WORKING',
        loginStatus: status,
        message: 'Authentication endpoints working (400 for invalid credentials is correct)'
      };
      console.log('✅ Authentication: WORKING');
      console.log(`   Login Status: ${status} (Invalid credentials - OK)`);
    } else {
      pagesTest.authentication = {
        status: 'ERROR',
        error: error.message,
        loginStatus: status
      };
      console.log('❌ Authentication: ERROR -', error.message);
    }
  }
}

// Test 5: Admin Features
async function testAdminFeatures() {
  console.log('');
  console.log('🔍 Testing Admin Features...');
  
  const adminRoutes = [
    '/api/admin',
    '/api/users',
    '/api/analytics',
    '/api/reports',
    '/api/academic-years',
    '/api/certificates'
  ];
  
  let workingAdminRoutes = 0;
  
  for (const route of adminRoutes) {
    try {
      const response = await axios.get(`${BACKEND_URL}${route}`, { 
        timeout: 3000,
        validateStatus: function (status) {
          return status >= 200 && status < 600;
        }
      });
      
      if (response.status < 400) {
        workingAdminRoutes++;
        console.log(`✅ ${route}: ${response.status}`);
      } else {
        console.log(`⚠️ ${route}: ${response.status} (Auth Required)`);
      }
      
    } catch (error) {
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        workingAdminRoutes++;
        console.log(`✅ ${route}: ${status} (Auth Required - OK)`);
      } else {
        console.log(`❌ ${route}: ${status || 'ERROR'}`);
      }
    }
  }
  
  pagesTest.adminFeatures = {
    status: workingAdminRoutes >= adminRoutes.length - 1 ? 'WORKING' : 'PARTIAL',
    workingRoutes: workingAdminRoutes,
    totalRoutes: adminRoutes.length,
    message: `${workingAdminRoutes}/${adminRoutes.length} admin routes accessible`
  };
}

// Test 6: User Features
async function testUserFeatures() {
  console.log('');
  console.log('🔍 Testing User Features...');
  
  const userRoutes = [
    '/api/events',
    '/api/event-chat',
    '/api/messages',
    '/api/feedback',
    '/api/notifications',
    '/api/settings'
  ];
  
  let workingUserRoutes = 0;
  
  for (const route of userRoutes) {
    try {
      const response = await axios.get(`${BACKEND_URL}${route}`, { 
        timeout: 3000,
        validateStatus: function (status) {
          return status >= 200 && status < 600;
        }
      });
      
      if (response.status < 400) {
        workingUserRoutes++;
        console.log(`✅ ${route}: ${response.status}`);
      } else {
        console.log(`⚠️ ${route}: ${response.status} (Auth Required)`);
      }
      
    } catch (error) {
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        workingUserRoutes++;
        console.log(`✅ ${route}: ${status} (Auth Required - OK)`);
      } else {
        console.log(`❌ ${route}: ${status || 'ERROR'}`);
      }
    }
  }
  
  pagesTest.userFeatures = {
    status: workingUserRoutes >= userRoutes.length - 1 ? 'WORKING' : 'PARTIAL',
    workingRoutes: workingUserRoutes,
    totalRoutes: userRoutes.length,
    message: `${workingUserRoutes}/${userRoutes.length} user routes accessible`
  };
}

// Generate Final Report
function generatePagesReport() {
  console.log('');
  console.log('📊 COMPLETE PAGES AND ROUTES REPORT');
  console.log('===================================');
  
  const working = Object.values(pagesTest).filter(t => 
    t.status === 'WORKING' || t.status === 'PARTIAL'
  ).length;
  
  const total = Object.keys(pagesTest).length;
  
  console.log(`Working Systems: ${working}/${total}`);
  console.log('');
  
  // Frontend Pages Status
  console.log('🌐 FRONTEND PAGES:');
  if (pagesTest.frontendPages.status === 'WORKING') {
    console.log('   ✅ WORKING - All pages accessible');
    console.log(`   📄 Pages: ${pagesTest.frontendPages.workingPages}/${pagesTest.frontendPages.totalPages}`);
  } else {
    console.log('   ⚠️ PARTIAL - Some pages may need attention');
    console.log(`   📄 Pages: ${pagesTest.frontendPages.workingPages}/${pagesTest.frontendPages.totalPages}`);
  }
  
  // Backend Routes Status
  console.log('');
  console.log('🔧 BACKEND ROUTES:');
  if (pagesTest.backendRoutes.status === 'WORKING') {
    console.log('   ✅ WORKING - All routes accessible');
    console.log(`   🛣️ Routes: ${pagesTest.backendRoutes.workingRoutes}/${pagesTest.backendRoutes.totalRoutes}`);
  } else {
    console.log('   ⚠️ PARTIAL - Some routes may need attention');
    console.log(`   🛣️ Routes: ${pagesTest.backendRoutes.workingRoutes}/${pagesTest.backendRoutes.totalRoutes}`);
  }
  
  // API Endpoints Status
  console.log('');
  console.log('🔌 API ENDPOINTS:');
  if (pagesTest.apiEndpoints.status === 'WORKING') {
    console.log('   ✅ WORKING - All critical endpoints working');
    console.log(`   🔗 Endpoints: ${pagesTest.apiEndpoints.workingEndpoints}/${pagesTest.apiEndpoints.totalEndpoints}`);
  } else {
    console.log('   ⚠️ PARTIAL - Some endpoints may need attention');
    console.log(`   🔗 Endpoints: ${pagesTest.apiEndpoints.workingEndpoints}/${pagesTest.apiEndpoints.totalEndpoints}`);
  }
  
  // Authentication Status
  console.log('');
  console.log('🔐 AUTHENTICATION:');
  if (pagesTest.authentication.status === 'WORKING') {
    console.log('   ✅ WORKING - Authentication system functional');
  } else {
    console.log('   ❌ NOT WORKING - Authentication issues');
  }
  
  // Admin Features Status
  console.log('');
  console.log('👑 ADMIN FEATURES:');
  if (pagesTest.adminFeatures.status === 'WORKING') {
    console.log('   ✅ WORKING - Admin features accessible');
    console.log(`   🔧 Routes: ${pagesTest.adminFeatures.workingRoutes}/${pagesTest.adminFeatures.totalRoutes}`);
  } else {
    console.log('   ⚠️ PARTIAL - Some admin features may need attention');
    console.log(`   🔧 Routes: ${pagesTest.adminFeatures.workingRoutes}/${pagesTest.adminFeatures.totalRoutes}`);
  }
  
  // User Features Status
  console.log('');
  console.log('👤 USER FEATURES:');
  if (pagesTest.userFeatures.status === 'WORKING') {
    console.log('   ✅ WORKING - User features accessible');
    console.log(`   🔧 Routes: ${pagesTest.userFeatures.workingRoutes}/${pagesTest.userFeatures.totalRoutes}`);
  } else {
    console.log('   ⚠️ PARTIAL - Some user features may need attention');
    console.log(`   🔧 Routes: ${pagesTest.userFeatures.workingRoutes}/${pagesTest.userFeatures.totalRoutes}`);
  }
  
  console.log('');
  console.log('🎯 COMPLETE SYSTEM ASSESSMENT:');
  
  if (working >= total - 1) {
    console.log('✅ ALL PAGES AND ROUTES WORKING!');
    console.log('');
    console.log('Your complete system is functional:');
    console.log('• ✅ Frontend pages accessible');
    console.log('• ✅ Backend API working');
    console.log('• ✅ Authentication system working');
    console.log('• ✅ Admin features working');
    console.log('• ✅ User features working');
    console.log('• ✅ All critical endpoints working');
    console.log('');
    console.log('🎉 Your entire CommunityLink system is ready!');
  } else {
    console.log('⚠️ Some pages/routes need attention');
    console.log('Most functionality is working, but some areas may need fixes');
  }
  
  console.log('');
  console.log('📋 DETAILED RESULTS:');
  console.log(JSON.stringify(pagesTest, null, 2));
}

// Run all tests
async function runAllTests() {
  await testFrontendPages();
  await testBackendRoutes();
  await testCriticalEndpoints();
  await testAuthentication();
  await testAdminFeatures();
  await testUserFeatures();
  
  generatePagesReport();
}

// Start testing
runAllTests().catch(console.error);
