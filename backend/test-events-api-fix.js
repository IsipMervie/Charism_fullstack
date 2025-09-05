#!/usr/bin/env node

/**
 * Test script to verify the events API fixes
 * This script tests the events endpoint to ensure it's working properly
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'https://charism-api.onrender.com/api';
const TEST_TIMEOUT = 15000; // 15 seconds timeout

async function testEventsAPI() {
  console.log('🧪 Testing Events API Fixes');
  console.log('='.repeat(50));
  console.log(`🌐 API Base URL: ${API_BASE_URL}`);
  console.log(`⏱️  Test Timeout: ${TEST_TIMEOUT}ms`);
  console.log('');

  const tests = [
    {
      name: 'Events Health Check',
      url: `${API_BASE_URL}/events/health`,
      method: 'GET',
      timeout: 5000
    },
    {
      name: 'Get All Events',
      url: `${API_BASE_URL}/events`,
      method: 'GET',
      timeout: 10000
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    console.log(`🔍 Testing: ${test.name}`);
    console.log(`   URL: ${test.url}`);
    
    try {
      const startTime = Date.now();
      
      const response = await axios({
        method: test.method,
        url: test.url,
        timeout: test.timeout,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Events-API-Test/1.0'
        }
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   ⏱️  Response Time: ${responseTime}ms`);
      
      if (test.name === 'Events Health Check') {
        console.log(`   📊 Health Status: ${response.data.status || 'Unknown'}`);
        if (response.data.components) {
          console.log(`   🗄️  Database: ${response.data.components.database?.status || 'Unknown'}`);
          console.log(`   📋 Event Model: ${response.data.components.eventModel ? 'Available' : 'Missing'}`);
        }
      } else if (test.name === 'Get All Events') {
        const events = response.data.events || response.data;
        const eventCount = Array.isArray(events) ? events.length : 0;
        console.log(`   📅 Events Found: ${eventCount}`);
        
        if (eventCount > 0) {
          console.log(`   📝 Sample Event: ${events[0].title || 'No title'}`);
        }
      }
      
      passedTests++;
      console.log(`   ✅ PASSED\n`);
      
    } catch (error) {
      console.log(`   ❌ FAILED`);
      
      if (error.code === 'ECONNABORTED') {
        console.log(`   ⏰ Timeout Error: Request took longer than ${test.timeout}ms`);
      } else if (error.response) {
        console.log(`   📊 Status: ${error.response.status}`);
        console.log(`   💬 Message: ${error.response.data?.message || 'No message'}`);
        console.log(`   🔍 Error Type: ${error.response.data?.error || 'Unknown'}`);
      } else if (error.request) {
        console.log(`   🌐 Network Error: ${error.message}`);
      } else {
        console.log(`   ⚠️  Error: ${error.message}`);
      }
      
      console.log(`   ❌ FAILED\n`);
    }
  }

  console.log('='.repeat(50));
  console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Events API is working correctly.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Check the issues above.');
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted by user');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('\n💥 Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the tests
testEventsAPI().catch(error => {
  console.error('💥 Test script failed:', error.message);
  process.exit(1);
});
