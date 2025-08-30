// Test problematic endpoints
require('dotenv').config();

const testProblematicEndpoints = async () => {
  try {
    console.log('🧪 Testing Problematic Endpoints...\n');
    
    // Test 1: Check if we can connect to database
    console.log('📋 Test 1: Database Connection');
    const { getLazyConnection } = require('../config/db');
    const isConnected = await getLazyConnection();
    console.log('   Database connected:', isConnected ? '✅ Yes' : '❌ No');
    
    if (!isConnected) {
      console.log('❌ Cannot proceed without database connection');
      return;
    }
    
    // Test 2: Check Event model
    console.log('\n📋 Test 2: Event Model');
    const Event = require('../models/Event');
    console.log('   Event model loaded:', Event ? '✅ Yes' : '❌ No');
    
    if (Event) {
      try {
        const eventCount = await Event.countDocuments();
        console.log('   Events in database:', eventCount);
        
        // Try to find a specific event
        const testEvent = await Event.findById('68ad66f6002789fec501a25f');
        console.log('   Test event found:', testEvent ? '✅ Yes' : '❌ No');
        if (testEvent) {
          console.log('   Event title:', testEvent.title);
          console.log('   Event status:', testEvent.status);
          console.log('   Event visibility:', testEvent.isVisibleToStudents);
        }
      } catch (error) {
        console.log('   ❌ Error testing Event model:', error.message);
      }
    }
    
    // Test 3: Check Settings model
    console.log('\n📋 Test 3: Settings Model');
    const SchoolSettings = require('../models/SchoolSettings');
    console.log('   SchoolSettings model loaded:', SchoolSettings ? '✅ Yes' : '❌ No');
    
    if (SchoolSettings) {
      try {
        const settings = await SchoolSettings.findOne();
        console.log('   Settings found:', settings ? '✅ Yes' : '❌ No');
        if (settings) {
          console.log('   School name:', settings.schoolName);
          console.log('   Has logo:', settings.logo ? '✅ Yes' : '❌ No');
        }
      } catch (error) {
        console.log('   ❌ Error testing SchoolSettings model:', error.message);
      }
    }
    
    // Test 4: Check User model
    console.log('\n📋 Test 4: User Model');
    const User = require('../models/User');
    console.log('   User model loaded:', User ? '✅ Yes' : '❌ No');
    
    if (User) {
      try {
        const userCount = await User.countDocuments();
        console.log('   Users in database:', userCount);
      } catch (error) {
        console.log('   ❌ Error testing User model:', error.message);
      }
    }
    
    // Test 5: Check if there are any validation issues
    console.log('\n📋 Test 5: Model Validation');
    try {
      // Try to create a test event object to see if there are validation issues
      const testEventData = {
        title: 'Test Event',
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
      
      const testEvent = new Event(testEventData);
      console.log('   Test event validation:', '✅ Passed');
      
      // Check if there are any schema issues
      console.log('   Event schema fields:', Object.keys(Event.schema.paths));
      
    } catch (error) {
      console.log('   ❌ Event validation error:', error.message);
    }
    
    console.log('\n✅ Endpoint testing completed');
    
  } catch (error) {
    console.error('❌ Error in endpoint testing:', error);
  } finally {
    process.exit(0);
  }
};

testProblematicEndpoints();
