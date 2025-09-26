#!/usr/bin/env node

/**
 * FAST SYSTEM CHECK
 * Quick verification of critical system components
 */

const axios = require('axios');

const CONFIG = {
  BACKEND_URL: 'https://charism-api-xtw9.onrender.com',
  FRONTEND_URL: 'https://charism-ucb4.onrender.com',
  TIMEOUT: 10000 // 10 seconds timeout
};

const quickCheck = async (name, url) => {
  try {
    const response = await axios.get(url, { timeout: CONFIG.TIMEOUT });
    console.log(`✅ ${name}: OK (${response.status})`);
    return true;
  } catch (error) {
    console.log(`❌ ${name}: FAIL (${error.message})`);
    return false;
  }
};

const runFastCheck = async () => {
  console.log('🚀 FAST SYSTEM CHECK');
  console.log('==================');
  
  let passed = 0;
  let total = 0;
  
  // Critical endpoints
  const checks = [
    ['Backend Health', `${CONFIG.BACKEND_URL}/api/health`],
    ['Backend Test', `${CONFIG.BACKEND_URL}/api/test`],
    ['Frontend Home', `${CONFIG.FRONTEND_URL}/`],
    ['Database Status', `${CONFIG.BACKEND_URL}/api/db-status`],
    ['CORS Test', `${CONFIG.BACKEND_URL}/api/cors-test`]
  ];
  
  for (const [name, url] of checks) {
    total++;
    if (await quickCheck(name, url)) {
      passed++;
    }
  }
  
  console.log('\n📊 RESULTS:');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`📊 Success Rate: ${((passed/total)*100).toFixed(1)}%`);
  
  if (passed === total) {
    console.log('🎉 ALL SYSTEMS OK!');
  } else if (passed >= total * 0.8) {
    console.log('⚠️ MOSTLY OK - Minor issues');
  } else {
    console.log('❌ ISSUES DETECTED');
  }
};

runFastCheck().catch(console.error);
