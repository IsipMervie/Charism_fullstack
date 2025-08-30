// backend/scripts/fix-empty-objects.js
// Script to completely remove empty object fields

const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config();

// Import models
const SchoolSettings = require('../models/SchoolSettings');
const Event = require('../models/Event');
const User = require('../models/User');

// Import database configuration
const { getLazyConnection } = require('../config/db');

async function fixEmptyObjects() {
  try {
    console.log('🔧 Starting empty object cleanup...');
    
    // Connect to database
    const isConnected = await getLazyConnection();
    if (!isConnected) {
      console.error('❌ Failed to connect to database');
      return;
    }
    console.log('✅ Database connected');
    
    // Fix SchoolSettings.logo - completely remove if empty
    console.log('\n📚 Fixing SchoolSettings.logo...');
    const settings = await SchoolSettings.findOne();
    if (settings && settings.logo && typeof settings.logo === 'object') {
      if (!settings.logo.data || settings.logo.data.length === 0) {
        console.log('  ⚠️  Logo is empty object, completely removing');
        settings.logo = undefined;
        await settings.save();
        console.log('  ✅ Logo field completely removed');
      } else {
        console.log('  ✅ Logo has data, no action needed');
      }
    }
    
    // Fix Event.image - completely remove if empty
    console.log('\n🎉 Fixing Event.image...');
    const events = await Event.find();
    let eventsFixed = 0;
    
    for (const event of events) {
      if (event.image && typeof event.image === 'object') {
        if (!event.image.data || event.image.data.length === 0) {
          console.log(`  ⚠️  Event "${event.title}" image is empty object, completely removing`);
          event.image = undefined;
          await event.save();
          eventsFixed++;
          console.log(`  ✅ Event "${event.title}" image completely removed`);
        }
      }
    }
    console.log(`  ✅ Fixed ${eventsFixed} events`);
    
    // Fix User.profilePicture - completely remove if empty
    console.log('\n👤 Fixing User.profilePicture...');
    const users = await User.find();
    let usersFixed = 0;
    
    for (const user of users) {
      if (user.profilePicture && typeof user.profilePicture === 'object') {
        if (!user.profilePicture.data || user.profilePicture.data.length === 0) {
          console.log(`  ⚠️  User "${user.name}" profile picture is empty object, completely removing`);
          user.profilePicture = undefined;
          await user.save();
          usersFixed++;
          console.log(`  ✅ User "${user.name}" profile picture completely removed`);
        }
      }
    }
    console.log(`  ✅ Fixed ${usersFixed} users`);
    
    console.log('\n✅ Empty object cleanup completed!');
    console.log(`📊 Summary: ${eventsFixed} events + ${usersFixed} users fixed`);
    
  } catch (error) {
    console.error('❌ Error cleaning up empty objects:', error);
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    }
    process.exit(0);
  }
}

// Run the cleanup
fixEmptyObjects();
