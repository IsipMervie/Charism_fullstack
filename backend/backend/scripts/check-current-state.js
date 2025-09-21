// backend/scripts/check-current-state.js
// Script to check current database state

const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config();

// Import models
const SchoolSettings = require('../models/SchoolSettings');
const Event = require('../models/Event');
const User = require('../models/User');

// Import database configuration
const { getLazyConnection } = require('../config/db');

async function checkCurrentState() {
  try {
    console.log('🔍 Checking current database state...');
    
    // Connect to database
    const isConnected = await getLazyConnection();
    if (!isConnected) {
      console.error('❌ Failed to connect to database');
      return;
    }
    console.log('✅ Database connected');
    
    // Check SchoolSettings.logo
    console.log('\n📚 Checking SchoolSettings.logo...');
    const settings = await SchoolSettings.findOne();
    if (settings) {
      console.log('  📋 Logo field exists:', !!settings.logo);
      if (settings.logo) {
        console.log('  📋 Logo type:', typeof settings.logo);
        if (typeof settings.logo === 'object') {
          console.log('  📋 Logo keys:', Object.keys(settings.logo));
          console.log('  📋 Logo has data:', !!(settings.logo.data && settings.logo.data.length > 0));
          console.log('  📋 Logo data length:', settings.logo.data ? settings.logo.data.length : 'no data');
        }
      }
    } else {
      console.log('  ❌ No SchoolSettings found');
    }
    
    // Check Event.image
    console.log('\n🎉 Checking Event.image...');
    const events = await Event.find();
    console.log(`  📋 Found ${events.length} events`);
    
    events.forEach((event, index) => {
      console.log(`  📋 Event ${index + 1} (${event.title}):`);
      console.log(`    📋 Image field exists: ${!!event.image}`);
      if (event.image) {
        console.log(`    📋 Image type: ${typeof event.image}`);
        if (typeof event.image === 'object') {
          console.log(`    📋 Image keys: ${Object.keys(event.image)}`);
          console.log(`    📋 Image has data: ${!!(event.image.data && event.image.data.length > 0)}`);
          console.log(`    📋 Image data length: ${event.image.data ? event.image.data.length : 'no data'}`);
        }
      }
    });
    
    // Check User.profilePicture
    console.log('\n👤 Checking User.profilePicture...');
    const users = await User.find();
    console.log(`  📋 Found ${users.length} users`);
    
    users.forEach((user, index) => {
      console.log(`  📋 User ${index + 1} (${user.name}):`);
      console.log(`    📋 Profile picture field exists: ${!!user.profilePicture}`);
      if (user.profilePicture) {
        console.log(`    📋 Profile picture type: ${typeof user.profilePicture}`);
        if (typeof user.profilePicture === 'object') {
          console.log(`    📋 Profile picture keys: ${Object.keys(user.profilePicture)}`);
          console.log(`    📋 Profile picture has data: ${!!(user.profilePicture.data && user.profilePicture.data.length > 0)}`);
          console.log(`    📋 Profile picture data length: ${user.profilePicture.data ? user.profilePicture.data.length : 'no data'}`);
        }
      }
    });
    
    console.log('\n✅ Database state check completed!');
    
  } catch (error) {
    console.error('❌ Error checking database state:', error);
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    }
    process.exit(0);
  }
}

// Run the check
checkCurrentState();
