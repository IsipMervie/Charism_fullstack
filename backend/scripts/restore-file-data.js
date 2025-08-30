// backend/scripts/restore-file-data.js
// Script to restore file data for files that were converted from strings

const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config();

// Import models
const SchoolSettings = require('../models/SchoolSettings');
const Event = require('../models/Event');
const User = require('../models/User');

// Import database configuration
const { getLazyConnection } = require('../config/db');

async function restoreFileData() {
  try {
    console.log('🔧 Starting file data restoration...');
    
    // Connect to database
    const isConnected = await getLazyConnection();
    if (!isConnected) {
      console.error('❌ Failed to connect to database');
      return;
    }
    console.log('✅ Database connected');
    
    // Restore SchoolSettings.logo
    console.log('\n📚 Restoring SchoolSettings.logo...');
    const settings = await SchoolSettings.findOne();
    if (settings && settings.logo && typeof settings.logo === 'object') {
      if (!settings.logo.data || settings.logo.data.length === 0) {
        console.log('  ⚠️  Logo has no data, setting to null');
        settings.logo = null;
        await settings.save();
        console.log('  ✅ Logo field cleared');
      } else {
        console.log('  ✅ Logo has data, no action needed');
      }
    }
    
    // Restore Event.image
    console.log('\n🎉 Restoring Event.image...');
    const events = await Event.find();
    let eventsFixed = 0;
    
    for (const event of events) {
      if (event.image && typeof event.image === 'object') {
        if (!event.image.data || event.image.data.length === 0) {
          console.log(`  ⚠️  Event "${event.title}" image has no data, clearing`);
          event.image = null;
          await event.save();
          eventsFixed++;
        }
      }
    }
    console.log(`  ✅ Fixed ${eventsFixed} events`);
    
    // Restore User.profilePicture
    console.log('\n👤 Restoring User.profilePicture...');
    const users = await User.find();
    let usersFixed = 0;
    
    for (const user of users) {
      if (user.profilePicture && typeof user.profilePicture === 'object') {
        if (!user.profilePicture.data || user.profilePicture.data.length === 0) {
          console.log(`  ⚠️  User "${user.name}" profile picture has no data, clearing`);
          user.profilePicture = null;
          await user.save();
          usersFixed++;
        }
      }
    }
    console.log(`  ✅ Fixed ${usersFixed} users`);
    
    console.log('\n✅ File data restoration completed!');
    console.log(`📊 Summary: ${eventsFixed} events + ${usersFixed} users fixed`);
    
  } catch (error) {
    console.error('❌ Error restoring file data:', error);
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    }
    process.exit(0);
  }
}

// Run the restoration
restoreFileData();
