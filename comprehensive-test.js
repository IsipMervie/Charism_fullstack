#!/usr/bin/env node
const axios = require('axios');

const BACKEND_URL = 'https://charism-api-xtw9.onrender.com';
const FRONTEND_URL = 'https://charism-ucb4.onrender.com';

console.log('🔍 COMPREHENSIVE ERROR FIX TEST');
console.log('===============================');

async function testEverything() {
  console.log('Testing CORS...');
  try {
    const response = await axios.get(`${BACKEND_URL}/api/health`, {
      headers: { 'Origin': 'https://charism-ucb4.onrender.com' }
    });
    console.log('✅ CORS: WORKING');
  } catch (error) {
    console.log('❌ CORS: ERROR -', error.message);
  }

  console.log('Testing API...');
  try {
    const response = await axios.post(`${BACKEND_URL}/api/auth/register`, {
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      userId: `TEST${Date.now()}`,
      department: 'Test',
      year: 'Test',
      section: 'Test',
      role: 'Student'
    });
    console.log('✅ API: WORKING');
  } catch (error) {
    console.log('❌ API: ERROR -', error.message);
  }

  console.log('Testing Frontend...');
  try {
    const response = await axios.get(`${FRONTEND_URL}/`);
    console.log('✅ Frontend: WORKING');
  } catch (error) {
    console.log('❌ Frontend: ERROR -', error.message);
  }
}

testEverything().catch(console.error);