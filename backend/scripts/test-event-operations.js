// Test event operations that are returning 500 errors
require('dotenv').config();

const testEventOperations = async () => {
  try {
    console.log('🧪 Testing Event Operations...\n');
    
    // Test 1: Database Connection
    console.log('📋 Test 1: Database Connection');
    const { getLazyConnection } = require('../config/db');
    const isConnected = await getLazyConnection();
    console.log('   Database connected:', isConnected ? '✅ Yes' : '❌ No');
    
    if (!isConnected) {
      console.log('❌ Cannot proceed without database connection');
      return;
    }
    
    // Test 2: Event Model
    console.log('\n📋 Test 2: Event Model');
    const Event = require('../models/Event');
    console.log('   Event model loaded:', Event ? '✅ Yes' : '❌ No');
    
    if (Event) {
      try {
        const eventCount = await Event.countDocuments();
        console.log('   Events in database:', eventCount);
        
        // Test 3: Find specific event that's causing issues
        console.log('\n📋 Test 3: Find Problematic Event');
        const testEvent = await Event.findById('68ad66f6002789fec501a25f');
        console.log('   Event found:', testEvent ? '✅ Yes' : '❌ No');
        
        if (testEvent) {
          console.log('   Event title:', testEvent.title);
          console.log('   Event status:', testEvent.status);
          console.log('   Event visibility:', testEvent.isVisibleToStudents);
          console.log('   Event image:', testEvent.image ? '✅ Has image' : '❌ No image');
          
          // Test 4: Try to update the event
          console.log('\n📋 Test 4: Test Event Update');
          try {
            const originalVisibility = testEvent.isVisibleToStudents;
            testEvent.isVisibleToStudents = !originalVisibility;
            await testEvent.save();
            console.log('   Event update successful: ✅ Yes');
            
            // Revert the change
            testEvent.isVisibleToStudents = originalVisibility;
            await testEvent.save();
            console.log('   Event revert successful: ✅ Yes');
          } catch (error) {
            console.log('   ❌ Event update failed:', error.message);
          }
        }
        
        // Test 5: Test Event Schema Validation
        console.log('\n📋 Test 5: Event Schema Validation');
        try {
          const testEventData = {
            title: 'Test Event for Validation',
            description: 'Test Description',
            date: new Date(),
            startTime: '09:00',
            endTime: '10:00',
            location: 'Test Location',
            hours: 1,
            maxParticipants: 10,
            departments: [],
            isForAllDepartments: true,
            status: 'Active',
            isVisibleToStudents: true,
            requiresApproval: false,
            isPublicRegistrationEnabled: false
          };
          
          const newEvent = new Event(testEventData);
          const validationResult = newEvent.validateSync();
          
          if (validationResult) {
            console.log('   ❌ Validation errors:', validationResult.errors);
          } else {
            console.log('   ✅ Validation passed');
          }
        } catch (error) {
          console.log('   ❌ Validation test failed:', error.message);
        }
        
      } catch (error) {
        console.log('   ❌ Error testing Event model:', error.message);
      }
    }
    
    // Test 6: Check for any middleware issues
    console.log('\n📋 Test 6: Middleware Check');
    try {
      const authMiddleware = require('../middleware/authMiddleware');
      console.log('   Auth middleware loaded:', authMiddleware ? '✅ Yes' : '❌ No');
      
      const roleMiddleware = require('../middleware/roleMiddleware');
      console.log('   Role middleware loaded:', roleMiddleware ? '✅ Yes' : '❌ No');
    } catch (error) {
      console.log('   ❌ Middleware check failed:', error.message);
    }
    
    console.log('\n✅ Event operations testing completed');
    
  } catch (error) {
    console.error('❌ Error in event operations testing:', error);
  } finally {
    process.exit(0);
  }
};

testEventOperations();
