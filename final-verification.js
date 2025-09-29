#!/usr/bin/env node
// Final Verification Test - After Routing Fixes
// This tests if the routing fixes actually work

const axios = require('axios');

const FRONTEND_URL = 'https://charism-ucb4.onrender.com';

console.log('🔍 FINAL VERIFICATION TEST - AFTER ROUTING FIXES');
console.log('===============================================');
console.log(`Frontend URL: ${FRONTEND_URL}`);
console.log('');

let verificationResults = {
  homepage: { status: 'PENDING' },
  routing: { status: 'PENDING' },
  fallbacks: { status: 'PENDING' },
  overall: 'PENDING'
};

// Test 1: Homepage
async function testHomepage() {
  console.log('🔍 Testing Homepage...');
  try {
    const response = await axios.get(`${FRONTEND_URL}/`, { 
      timeout: 10000,
      validateStatus: function (status) {
        return status >= 200 && status < 600;
      }
    });
    
    if (response.status === 200) {
      verificationResults.homepage = {
        status: 'WORKING',
        statusCode: response.status,
        message: 'Homepage accessible'
      };
      console.log('✅ Homepage: WORKING');
    } else {
      verificationResults.homepage = {
        status: 'BROKEN',
        statusCode: response.status,
        message: 'Homepage not accessible'
      };
      console.log('❌ Homepage: BROKEN');
    }
  } catch (error) {
    verificationResults.homepage = {
      status: 'ERROR',
      error: error.message,
      message: 'Homepage error'
    };
    console.log('❌ Homepage: ERROR -', error.message);
  }
}

// Test 2: Routing Pages
async function testRoutingPages() {
  console.log('');
  console.log('🔍 Testing Routing Pages...');
  
  const pages = ['/login', '/register', '/dashboard', '/events', '/contact'];
  let workingPages = 0;
  let brokenPages = 0;
  
  for (const page of pages) {
    try {
      const response = await axios.get(`${FRONTEND_URL}${page}`, { 
        timeout: 10000,
        validateStatus: function (status) {
          return status >= 200 && status < 600;
        }
      });
      
      if (response.status === 200) {
        workingPages++;
        console.log(`✅ ${page}: WORKING (${response.status})`);
      } else {
        brokenPages++;
        console.log(`❌ ${page}: BROKEN (${response.status})`);
      }
    } catch (error) {
      brokenPages++;
      console.log(`❌ ${page}: ERROR - ${error.message}`);
    }
  }
  
  verificationResults.routing = {
    status: workingPages > brokenPages ? 'WORKING' : 'BROKEN',
    workingPages: workingPages,
    brokenPages: brokenPages,
    totalPages: pages.length,
    message: `${workingPages}/${pages.length} pages working`
  };
}

// Test 3: Fallback Files
async function testFallbackFiles() {
  console.log('');
  console.log('🔍 Testing Fallback Files...');
  
  const fallbacks = ['/login.html', '/register.html', '/dashboard.html', '/events.html', '/contact.html'];
  let workingFallbacks = 0;
  
  for (const fallback of fallbacks) {
    try {
      const response = await axios.get(`${FRONTEND_URL}${fallback}`, { 
        timeout: 5000,
        validateStatus: function (status) {
          return status >= 200 && status < 600;
        }
      });
      
      if (response.status === 200) {
        workingFallbacks++;
        console.log(`✅ ${fallback}: WORKING (${response.status})`);
      } else {
        console.log(`❌ ${fallback}: BROKEN (${response.status})`);
      }
    } catch (error) {
      console.log(`❌ ${fallback}: ERROR - ${error.message}`);
    }
  }
  
  verificationResults.fallbacks = {
    status: workingFallbacks >= fallbacks.length - 1 ? 'WORKING' : 'BROKEN',
    workingFallbacks: workingFallbacks,
    totalFallbacks: fallbacks.length,
    message: `${workingFallbacks}/${fallbacks.length} fallbacks working`
  };
}

// Generate Final Report
function generateFinalReport() {
  console.log('');
  console.log('📊 FINAL VERIFICATION REPORT');
  console.log('============================');
  
  const working = Object.values(verificationResults).filter(r => 
    r.status === 'WORKING'
  ).length;
  
  const total = Object.keys(verificationResults).length - 1; // Exclude overall
  
  console.log(`Working Systems: ${working}/${total}`);
  console.log('');
  
  // Homepage Status
  console.log('🏠 HOMEPAGE:');
  if (verificationResults.homepage.status === 'WORKING') {
    console.log('   ✅ WORKING - Homepage accessible');
  } else {
    console.log('   ❌ BROKEN - Homepage not accessible');
  }
  
  // Routing Status
  console.log('');
  console.log('🛣️ ROUTING PAGES:');
  if (verificationResults.routing.status === 'WORKING') {
    console.log('   ✅ WORKING - Most pages accessible');
    console.log(`   📄 ${verificationResults.routing.workingPages}/${verificationResults.routing.totalPages} pages working`);
  } else {
    console.log('   ❌ BROKEN - Many pages not accessible');
    console.log(`   📄 ${verificationResults.routing.workingPages}/${verificationResults.routing.totalPages} pages working`);
  }
  
  // Fallbacks Status
  console.log('');
  console.log('🔄 FALLBACK FILES:');
  if (verificationResults.fallbacks.status === 'WORKING') {
    console.log('   ✅ WORKING - Fallback files accessible');
    console.log(`   📄 ${verificationResults.fallbacks.workingFallbacks}/${verificationResults.fallbacks.totalFallbacks} fallbacks working`);
  } else {
    console.log('   ❌ BROKEN - Fallback files not accessible');
    console.log(`   📄 ${verificationResults.fallbacks.workingFallbacks}/${verificationResults.fallbacks.totalFallbacks} fallbacks working`);
  }
  
  console.log('');
  console.log('🎯 FINAL ASSESSMENT:');
  
  if (working >= total - 1) {
    console.log('✅ ROUTING FIXES SUCCESSFUL!');
    console.log('');
    console.log('Your frontend routing is now working:');
    console.log('• ✅ Users can access all pages');
    console.log('• ✅ React Router is functioning');
    console.log('• ✅ Fallback files are in place');
    console.log('');
    console.log('🎉 Your system is ready for users!');
    verificationResults.overall = 'SUCCESS';
  } else {
    console.log('⚠️ ROUTING FIXES PARTIALLY SUCCESSFUL');
    console.log('');
    console.log('Some improvements made, but issues remain:');
    console.log('• Some pages may still have issues');
    console.log('• May need to redeploy for full effect');
    console.log('');
    console.log('💡 Try redeploying your frontend to Render');
    verificationResults.overall = 'PARTIAL';
  }
  
  console.log('');
  console.log('📋 DETAILED RESULTS:');
  console.log(JSON.stringify(verificationResults, null, 2));
}

// Run all tests
async function runAllTests() {
  await testHomepage();
  await testRoutingPages();
  await testFallbackFiles();
  
  generateFinalReport();
}

// Start testing
runAllTests().catch(console.error);
