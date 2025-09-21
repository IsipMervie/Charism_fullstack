// backend/scripts/restore-file-data-safe.js
// Safe script to restore file data without affecting required fields

const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config();

// Import models
const SchoolSettings = require('../models/SchoolSettings');
const Event = require('../models/Event');
const User = require('../models/User');

// Import database configuration
const { getLazyConnection } = require('../config/db');

async function restoreFileDataSafe() {
  try {
    console.log('🔧 Starting safe file data restoration...');
    
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
    
    // Restore Event.image - use updateOne to avoid validation issues
    console.log('\n🎉 Restoring Event.image...');
    const events = await Event.find({ 'image.data': { $exists: true, $size: 0 } });
    console.log(`  📋 Found ${events.length} events with empty image data`);
    
    let eventsFixed = 0;
    for (const event of events) {
      try {
        // Use updateOne to avoid validation issues
        const result = await Event.updateOne(
          { _id: event._id },
          { $unset: { image: "" } }
        );
        if (result.modifiedCount > 0) {
          console.log(`  ✅ Event "${event.title}" image cleared`);
          eventsFixed++;
        }
      } catch (error) {
        console.log(`  ❌ Error clearing event "${event.title}":`, error.message);
      }
    }
    console.log(`  ✅ Fixed ${eventsFixed} events`);
    
    // Restore User.profilePicture - use updateOne to avoid validation issues
    console.log('\n👤 Restoring User.profilePicture...');
    const users = await User.find({ 'profilePicture.data': { $exists: true, $size: 0 } });
    console.log(`  📋 Found ${users.length} users with empty profile picture data`);
    
    let usersFixed = 0;
    for (const user of users) {
      try {
        // Use updateOne to avoid validation issues
        const result = await User.updateOne(
          { _id: user._id },
          { $unset: { profilePicture: "" } }
        );
        if (result.modifiedCount > 0) {
          console.log(`  ✅ User "${user.name}" profile picture cleared`);
          usersFixed++;
        }
      } catch (error) {
        console.log(`  ❌ Error clearing user "${user.name}":`, error.message);
      }
    }
    console.log(`  ✅ Fixed ${usersFixed} users`);
    
    console.log('\n✅ Safe file data restoration completed!');
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
restoreFileDataSafe();
