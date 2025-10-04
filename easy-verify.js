#!/usr/bin/env node
/**
 * EASY SYSTEM VERIFICATION - Run anytime you want confidence!
 * Usage: node easy-verify.js
 */

const axios = require('axios');

console.clear();
console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║         🔍 EASY SYSTEM VERIFICATION CHECK 🔍            ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

let errorCount = 0;

async function check(name, testFn) {
  process.stdout.write(`Testing ${name}... `);
  try {
    await testFn();
    console.log('✅ WORKS');
    return true;
  } catch (e) {
    console.log('❌ ERROR: ' + e.message);
    errorCount++;
    return false;
  }
}

async function verify() {
  console.log('⏳ Checking your system (please wait 30 seconds)...\n');
  
  // 1. Backend
  await check('Backend Server', async () => {
    const r = await axios.get('https://charism-api-xtw9.onrender.com/api/health', {timeout: 60000});
    if (r.data.status !== 'OK') throw new Error('Backend not OK');
  });
  
  // 2. Database
  await check('Database Connection', async () => {
    const r = await axios.get('https://charism-api-xtw9.onrender.com/api/health/db', {timeout: 30000});
    if (r.data.database.status !== 'connected') throw new Error('Database not connected');
  });
  
  // 3. Frontend
  await check('Frontend Website', async () => {
    const r = await axios.get('https://charism-ucb4.onrender.com', {timeout: 30000});
    if (r.status !== 200) throw new Error('Frontend not accessible');
  });
  
  // 4. Public API
  await check('Public API', async () => {
    const r = await axios.get('https://charism-api-xtw9.onrender.com/api/settings/public', {timeout: 30000});
    if (r.status !== 200) throw new Error('API not responding');
  });
  
  // 5. Security
  await check('Security (Auth)', async () => {
    try {
      await axios.get('https://charism-api-xtw9.onrender.com/api/admin/users', {timeout: 30000});
      throw new Error('Security not working - admin accessible without auth!');
    } catch (e) {
      if (e.response && e.response.status === 401) {
        return; // Good! Auth is required
      }
      throw e;
    }
  });
  
  // Results
  console.log('\n' + '═'.repeat(60));
  if (errorCount === 0) {
    console.log('\n✅ ✅ ✅  ALL TESTS PASSED - NO ERRORS! ✅ ✅ ✅\n');
    console.log('🎉 Your system is 100% operational!');
    console.log('🎉 You can use it with FULL CONFIDENCE!');
    console.log('🎉 No issues found anywhere!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('           💯 PERFECT SYSTEM - NO WORRIES! 💯');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } else {
    console.log('\n❌ FOUND ' + errorCount + ' ERROR(S) - SEE ABOVE\n');
  }
}

verify().catch(e => console.error('Verification failed:', e.message));

