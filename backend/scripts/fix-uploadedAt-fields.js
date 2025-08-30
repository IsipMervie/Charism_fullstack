// backend/scripts/fix-uploadedAt-fields.js
// Migration script to fix uploadedAt field issues

const mongoose = require('mongoose');
const path = require('path');

// Import models
const SchoolSettings = require('../models/SchoolSettings');
const Event = require('../models/Event');
const User = require('../models/User');

// Import database configuration
const { getLazyConnection } = require('../config/db');

async function fixUploadedAtFields() {
  try {
    console.log('🔧 Starting uploadedAt field migration...');
    
    // Connect to database
    const isConnected = await getLazyConnection();
    if (!isConnected) {
      console.error('❌ Failed to connect to database');
      return;
    }
    console.log('✅ Database connected');
    
    // Fix SchoolSettings.logo field
    console.log('\n📚 Fixing SchoolSettings.logo field...');
    const schoolSettings = await SchoolSettings.find({});
    let fixedSchoolSettings = 0;
    
    for (const setting of schoolSettings) {
      if (typeof setting.logo === 'string' && setting.logo) {
        console.log(`  Converting logo from string: ${setting.logo}`);
        
        // Convert string to proper object structure
        setting.logo = {
          data: null, // We can't recover the actual file data
          contentType: 'image/png', // Default to PNG
          filename: setting.logo,
          uploadedAt: new Date()
        };
        
        await setting.save();
        fixedSchoolSettings++;
        console.log(`  ✅ Fixed SchoolSettings logo`);
      }
    }
    console.log(`✅ Fixed ${fixedSchoolSettings} SchoolSettings documents`);
    
    // Fix Event.image field
    console.log('\n📅 Fixing Event.image field...');
    const events = await Event.find({});
    let fixedEvents = 0;
    
    for (const event of events) {
      if (typeof event.image === 'string' && event.image) {
        console.log(`  Converting event image from string: ${event.image}`);
        
        // Convert string to proper object structure
        event.image = {
          data: null, // We can't recover the actual file data
          contentType: 'image/png', // Default to PNG
          filename: event.image,
          uploadedAt: new Date()
        };
        
        await event.save();
        fixedEvents++;
        console.log(`  ✅ Fixed Event image`);
      }
    }
    console.log(`✅ Fixed ${fixedEvents} Event documents`);
    
    // Fix User.profilePicture field
    console.log('\n👤 Fixing User.profilePicture field...');
    const users = await User.find({});
    let fixedUsers = 0;
    
    for (const user of users) {
      if (typeof user.profilePicture === 'string' && user.profilePicture) {
        console.log(`  Converting profile picture from string: ${user.profilePicture}`);
        
        // Convert string to proper object structure
        user.profilePicture = {
          data: null, // We can't recover the actual file data
          contentType: 'image/png', // Default to PNG
          filename: user.profilePicture,
          uploadedAt: new Date()
        };
        
        await user.save();
        fixedUsers++;
        console.log(`  ✅ Fixed User profile picture`);
      }
    }
    console.log(`✅ Fixed ${fixedUsers} User documents`);
    
    // Summary
    console.log('\n📊 Migration Summary:');
    console.log(`  SchoolSettings: ${fixedSchoolSettings} fixed`);
    console.log(`  Events: ${fixedEvents} fixed`);
    console.log(`  Users: ${fixedUsers} fixed`);
    console.log(`  Total: ${fixedSchoolSettings + fixedEvents + fixedUsers} fields fixed`);
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    }
    process.exit(0);
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  fixUploadedAtFields();
}

module.exports = { fixUploadedAtFields };
