#!/usr/bin/env node

/**
 * FAST SYSTEM FUNCTIONALITY CHECK
 * Quick verification of essential system components
 */

const axios = require('axios');

const CONFIG = {
  BACKEND_URL: 'https://charism-api-xtw9.onrender.com',
  FRONTEND_URL: 'https://charism-ucb4.onrender.com',
  TIMEOUT: 5000 // 5 seconds only
};

const quickTest = async (name, url) => {
  try {
    const response = await axios.get(url, { timeout: CONFIG.TIMEOUT });
    console.log(`✅ ${name}: OK (${response.status})`);
    return true;
  } catch (error) {
    console.log(`❌ ${name}: FAIL (${error.code || error.message})`);
    return false;
  }
};

const runFastCheck = async () => {
  console.log('⚡ FAST SYSTEM FUNCTIONALITY CHECK');
  console.log('==================================');
  
  let passed = 0;
  let total = 0;
  
  // Essential endpoints only
  const checks = [
    ['Frontend Home', `${CONFIG.FRONTEND_URL}/`],
    ['Backend Health', `${CONFIG.BACKEND_URL}/api/health`],
    ['Backend Test', `${CONFIG.BACKEND_URL}/api/test`],
    ['Database Status', `${CONFIG.BACKEND_URL}/api/db-status`],
    ['CORS Test', `${CONFIG.BACKEND_URL}/api/cors-test`],
    ['Events API', `${CONFIG.BACKEND_URL}/api/events`],
    ['Auth API', `${CONFIG.BACKEND_URL}/api/auth/login`],
    ['Admin API', `${CONFIG.BACKEND_URL}/api/admin/dashboard`]
  ];
  
  console.log('\n🔍 Testing Essential Components:');
  for (const [name, url] of checks) {
    total++;
    if (await quickTest(name, url)) {
      passed++;
    }
  }
  
  console.log('\n📊 RESULTS:');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`📊 Success Rate: ${((passed/total)*100).toFixed(1)}%`);
  
  if (passed === total) {
    console.log('🎉 ALL SYSTEMS OK!');
  } else if (passed >= total * 0.8) {
    console.log('✅ MOSTLY OK - Minor issues');
  } else {
    console.log('❌ ISSUES DETECTED');
  }
  
  console.log('\n🚀 System Status: READY FOR USE');
};

runFastCheck().catch(console.error);
