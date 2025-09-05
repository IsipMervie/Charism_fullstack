#!/usr/bin/env node

/**
 * Local test script to verify the optimized getAllEvents function
 * This tests the function directly without going through the API
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import the optimized controller
const { getAllEvents } = require('./controllers/eventController');

async function testLocalEvents() {
  console.log('🧪 Testing Local Events Function');
  console.log('='.repeat(50));
  
  try {
    // Mock request object
    const mockReq = {
      user: {
        role: 'Student',
        userId: 'test-user-id'
      }
    };
    
    // Mock response object
    const mockRes = {
      json: (data) => {
        console.log('✅ Response received:');
        console.log('📊 Events count:', data.events?.length || 0);
        console.log('📝 Message:', data.message || 'No message');
        console.log('⚠️ Warning:', data.warning || 'No warning');
        console.log('❌ Error:', data.error || 'No error');
        
        if (data.events && data.events.length > 0) {
          console.log('📅 Sample event:', {
            title: data.events[0].title,
            date: data.events[0].date,
            status: data.events[0].status
          });
        }
        
        return mockRes;
      },
      status: (code) => {
        console.log('📊 Status code:', code);
        return mockRes;
      }
    };
    
    console.log('🔄 Testing getAllEvents function...');
    const startTime = Date.now();
    
    await getAllEvents(mockReq, mockRes);
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`⏱️ Response time: ${responseTime}ms`);
    
    if (responseTime < 5000) {
      console.log('✅ PASSED - Response time under 5 seconds');
    } else {
      console.log('❌ FAILED - Response time over 5 seconds');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the test
testLocalEvents().catch(error => {
  console.error('💥 Test script failed:', error.message);
  process.exit(1);
});
