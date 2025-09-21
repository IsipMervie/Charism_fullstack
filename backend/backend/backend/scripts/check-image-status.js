// Check current image status in database
require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const SchoolSettings = require('../models/SchoolSettings');
const Event = require('../models/Event');
const User = require('../models/User');

const checkImageStatus = async () => {
  try {
    console.log('🔍 Checking image status in database...\n');
    
    // Connect to database
    const { getLazyConnection } = require('../config/db');
    const isConnected = await getLazyConnection();
    
    if (!isConnected) {
      console.log('❌ Database not connected');
      return;
    }
    
    console.log('✅ Database connected\n');
    
    // Check SchoolSettings logo
    console.log('📋 Checking SchoolSettings logo...');
    const settings = await SchoolSettings.findOne();
    if (settings) {
      console.log('✅ SchoolSettings found');
      if (settings.logo) {
        console.log('   Logo field exists:', {
          type: typeof settings.logo,
          keys: Object.keys(settings.logo),
          hasData: settings.logo.data ? settings.logo.data.length : 'no data',
          contentType: settings.logo.contentType,
          filename: settings.logo.filename
        });
      } else {
        console.log('   ❌ No logo field');
      }
    } else {
      console.log('❌ No SchoolSettings found');
    }
    
    console.log('\n📋 Checking Events with images...');
    const events = await Event.find({});
    console.log(`   Found ${events.length} events`);
    
    events.forEach((event, index) => {
      if (event.image) {
        console.log(`   Event ${index + 1} (${event.title}):`, {
          type: typeof event.image,
          keys: Object.keys(event.image),
          hasData: event.image.data ? event.image.data.length : 'no data',
          contentType: event.image.contentType,
          filename: event.image.filename
        });
      }
    });
    
    console.log('\n📋 Checking Users with profile pictures...');
    const users = await User.find({ profilePicture: { $exists: true, $ne: null } });
    console.log(`   Found ${users.length} users with profile pictures`);
    
    users.forEach((user, index) => {
      if (user.profilePicture) {
        console.log(`   User ${index + 1} (${user.name}):`, {
          type: typeof user.profilePicture,
          keys: Object.keys(user.profilePicture),
          hasData: user.profilePicture.data ? user.profilePicture.data.length : 'no data',
          contentType: user.profilePicture.contentType,
          filename: user.profilePicture.filename
        });
      }
    });
    
    console.log('\n✅ Image status check complete');
    
  } catch (error) {
    console.error('❌ Error checking image status:', error);
  } finally {
    process.exit(0);
  }
};

checkImageStatus();
