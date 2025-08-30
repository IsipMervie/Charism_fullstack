// backend/scripts/test-api-endpoints.js
// Test script to verify API endpoints are working

const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config();

// Import database configuration
const { getLazyConnection } = require('../config/db');

async function testApiEndpoints() {
  try {
    console.log('🧪 Testing API endpoints after fixes...');
    
    // Connect to database
    const isConnected = await getLazyConnection();
    if (!isConnected) {
      console.error('❌ Failed to connect to database');
      return;
    }
    console.log('✅ Database connected');
    
    // Test SchoolSettings
    console.log('\n📚 Testing SchoolSettings...');
    const SchoolSettings = require('../models/SchoolSettings');
    const settings = await SchoolSettings.findOne();
    if (settings) {
      console.log('  ✅ SchoolSettings found');
      console.log('  📋 Logo field:', settings.logo);
      console.log('  📋 Logo type:', typeof settings.logo);
      if (settings.logo) {
        console.log('  📋 Logo has data:', !!(settings.logo.data && settings.logo.data.length > 0));
      }
    }
    
    // Test Events
    console.log('\n🎉 Testing Events...');
    const Event = require('../models/Event');
    const events = await Event.find().limit(2);
    console.log(`  📋 Found ${events.length} events`);
    
    events.forEach((event, index) => {
      console.log(`  📋 Event ${index + 1} (${event.title}):`);
      console.log(`    📋 Image field: ${event.image}`);
      console.log(`    📋 Image type: ${typeof event.image}`);
      if (event.image) {
        console.log(`    📋 Image has data: ${!!(event.image.data && event.image.data.length > 0)}`);
      }
    });
    
    // Test Users
    console.log('\n👤 Testing Users...');
    const User = require('../models/User');
    const users = await User.find().limit(2);
    console.log(`  📋 Found ${users.length} users`);
    
    users.forEach((user, index) => {
      console.log(`  📋 User ${index + 1} (${user.name}):`);
      console.log(`    📋 Profile picture field: ${user.profilePicture}`);
      console.log(`    📋 Profile picture type: ${typeof user.profilePicture}`);
      if (user.profilePicture) {
        console.log(`    📋 Profile picture has data: ${!!(user.profilePicture.data && user.profilePicture.data.length > 0)}`);
      }
    });
    
    console.log('\n✅ API endpoint test completed!');
    
  } catch (error) {
    console.error('❌ Error testing API endpoints:', error);
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    }
    process.exit(0);
  }
}

// Run the test
testApiEndpoints();
