// Test API endpoints directly
require('dotenv').config();
const mongoose = require('mongoose');

const testApiEndpoints = async () => {
  try {
    console.log('🧪 Testing API endpoints directly...\n');
    
    // Connect to database
    const { getLazyConnection } = require('../config/db');
    const isConnected = await getLazyConnection();
    
    if (!isConnected) {
      console.log('❌ Database not connected');
      return;
    }
    
    console.log('✅ Database connected\n');
    
    // Test 1: Get events through Mongoose model
    console.log('📋 Test 1: Getting events through Mongoose model...');
    const Event = require('../models/Event');
    const events = await Event.find({});
    console.log(`   Found ${events.length} events`);
    
    events.forEach((event, index) => {
      console.log(`   Event ${index + 1}: ${event.title}`);
      console.log(`     Has image: ${!!event.image}`);
      if (event.image) {
        console.log(`     Image type: ${typeof event.image}`);
        console.log(`     Image keys: ${Object.keys(event.image).join(', ')}`);
        if (event.image.data) {
          console.log(`     Data length: ${event.image.data.length}`);
        }
      }
      console.log('');
    });
    
    // Test 2: Get school settings through Mongoose model
    console.log('📋 Test 2: Getting school settings through Mongoose model...');
    const SchoolSettings = require('../models/SchoolSettings');
    const settings = await SchoolSettings.findOne();
    
    if (settings) {
      console.log('   SchoolSettings found');
      console.log(`     Has logo: ${!!settings.logo}`);
      if (settings.logo) {
        console.log(`     Logo type: ${typeof settings.logo}`);
        console.log(`     Logo keys: ${Object.keys(settings.logo).join(', ')}`);
        if (settings.logo.data) {
          console.log(`     Data length: ${settings.logo.data.length}`);
        }
      }
    } else {
      console.log('   ❌ No SchoolSettings found');
    }
    
    console.log('\n✅ API endpoint tests complete');
    
  } catch (error) {
    console.error('❌ Error testing API endpoints:', error);
  } finally {
    process.exit(0);
  }
};

testApiEndpoints();
