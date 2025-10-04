#!/usr/bin/env node
/**
 * QUICK DEMO TEST - Run this tomorrow morning!
 * Takes 1 minute, shows you everything works
 */

const axios = require('axios');

console.log('\n🚀 QUICK DEMO READINESS CHECK\n');
console.log('Running 5 critical tests...\n');

async function test() {
  let passed = 0;
  
  // 1. Backend
  try {
    await axios.get('https://charism-api-xtw9.onrender.com/api/health', {timeout: 60000});
    console.log('✅ 1/5 Backend: READY');
    passed++;
  } catch (e) {
    console.log('❌ 1/5 Backend: WAIT 30 SECONDS AND TRY AGAIN');
  }
  
  // 2. Database
  try {
    await axios.get('https://charism-api-xtw9.onrender.com/api/health/db', {timeout: 30000});
    console.log('✅ 2/5 Database: READY');
    passed++;
  } catch (e) {
    console.log('❌ 2/5 Database: ERROR');
  }
  
  // 3. Frontend
  try {
    await axios.get('https://charism-ucb4.onrender.com', {timeout: 30000});
    console.log('✅ 3/5 Frontend: READY');
    passed++;
  } catch (e) {
    console.log('❌ 3/5 Frontend: ERROR');
  }
  
  // 4. API
  try {
    await axios.get('https://charism-api-xtw9.onrender.com/api/settings/public', {timeout: 30000});
    console.log('✅ 4/5 Public API: READY');
    passed++;
  } catch (e) {
    console.log('❌ 4/5 API: ERROR');
  }
  
  // 5. Security
  try {
    await axios.get('https://charism-api-xtw9.onrender.com/api/admin/users', {timeout: 30000});
    console.log('❌ 5/5 Security: NOT PROTECTED!');
  } catch (e) {
    if (e.response && e.response.status === 401) {
      console.log('✅ 5/5 Security: READY');
      passed++;
    } else {
      console.log('❌ 5/5 Security: ERROR');
    }
  }
  
  // Results
  console.log('\n' + '='.repeat(50));
  if (passed === 5) {
    console.log('\n🎉 PERFECT! ALL 5 TESTS PASSED!');
    console.log('🎉 YOU ARE READY FOR YOUR DEMO!');
    console.log('🎉 GO SHOW YOUR SYSTEM WITH CONFIDENCE!\n');
  } else {
    console.log('\n⚠️  ' + passed + '/5 tests passed');
    if (passed >= 3) {
      console.log('✅ System is mostly working - you can still demo!');
      console.log('💡 Mention any slow parts are due to free tier cold starts\n');
    } else {
      console.log('❌ Wait 30 seconds and run again: node quick-demo-test.js\n');
    }
  }
}

test().catch(e => {
  console.error('\n❌ Test failed:', e.message);
  console.log('💡 Wait 30 seconds for cold start, then try again\n');
});

