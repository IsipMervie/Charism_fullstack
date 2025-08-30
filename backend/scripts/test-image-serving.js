// backend/scripts/test-image-serving.js
// Test script to verify image serving after migration

const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config();

// Import models
const SchoolSettings = require('../models/SchoolSettings');
const Event = require('../models/Event');
const User = require('../models/User');

// Import database configuration
const { getLazyConnection } = require('../config/db');

async function testImageServing() {
  try {
    console.log('🖼️  Testing image serving after migration...');
    
    // Connect to database
    const isConnected = await getLazyConnection();
    if (!isConnected) {
      console.error('❌ Failed to connect to database');
      return;
    }
    console.log('✅ Database connected');
    
    // Test SchoolSettings.logo
    console.log('\n📚 Testing SchoolSettings.logo...');
    const settings = await SchoolSettings.findOne();
    if (settings) {
      console.log('  ✅ SchoolSettings found');
      console.log('  📋 Logo field type:', typeof settings.logo);
      console.log('  📋 Logo field keys:', settings.logo ? Object.keys(settings.logo) : 'null');
      if (settings.logo && typeof settings.logo === 'object') {
        console.log('  📋 Logo data length:', settings.logo.data ? settings.logo.data.length : 'no data');
        console.log('  📋 Logo content type:', settings.logo.contentType);
        console.log('  📋 Logo filename:', settings.logo.filename);
        console.log('  📋 Logo uploadedAt:', settings.logo.uploadedAt);
      }
    } else {
      console.log('  ❌ No SchoolSettings found');
    }
    
    // Test Event.image
    console.log('\n🎉 Testing Event.image...');
    const events = await Event.find().limit(3);
    console.log(`  📋 Found ${events.length} events`);
    
    events.forEach((event, index) => {
      console.log(`  📋 Event ${index + 1} (${event.title}):`);
      console.log(`    📋 Image field type: ${typeof event.image}`);
      if (event.image && typeof event.image === 'object') {
        console.log(`    📋 Image data length: ${event.image.data ? event.image.data.length : 'no data'}`);
        console.log(`    📋 Image content type: ${event.image.contentType}`);
        console.log(`    📋 Image filename: ${event.image.filename}`);
        console.log(`    📋 Image uploadedAt: ${event.image.uploadedAt}`);
      }
    });
    
    // Test User.profilePicture
    console.log('\n👤 Testing User.profilePicture...');
    const users = await User.find().limit(3);
    console.log(`  📋 Found ${users.length} users`);
    
    users.forEach((user, index) => {
      console.log(`  📋 User ${index + 1} (${user.name}):`);
      console.log(`    📋 Profile picture field type: ${typeof user.profilePicture}`);
      if (user.profilePicture && typeof user.profilePicture === 'object') {
        console.log(`    📋 Profile picture data length: ${user.profilePicture.data ? user.profilePicture.data.length : 'no data'}`);
        console.log(`    📋 Profile picture content type: ${user.profilePicture.contentType}`);
        console.log(`    📋 Profile picture filename: ${user.profilePicture.filename}`);
        console.log(`    📋 Profile picture uploadedAt: ${user.profilePicture.uploadedAt}`);
      }
    });
    
    console.log('\n✅ Image serving test completed!');
    
  } catch (error) {
    console.error('❌ Error testing image serving:', error);
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
testImageServing();
