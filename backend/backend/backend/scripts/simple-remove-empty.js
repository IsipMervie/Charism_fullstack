// backend/scripts/simple-remove-empty.js
// Simple script to remove empty object fields

const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config();

// Import database configuration
const { getLazyConnection } = require('../config/db');

async function simpleRemoveEmpty() {
  try {
    console.log('🔧 Starting simple empty object removal...');
    
    // Connect to database
    const isConnected = await getLazyConnection();
    if (!isConnected) {
      console.error('❌ Failed to connect to database');
      return;
    }
    console.log('✅ Database connected');
    
    // Get direct access to collections
    const db = mongoose.connection.db;
    
    // Remove SchoolSettings.logo completely
    console.log('\n📚 Removing SchoolSettings.logo...');
    const schoolSettingsCollection = db.collection('schoolsettings');
    const settingsResult = await schoolSettingsCollection.updateMany(
      {},
      { $unset: { logo: "" } }
    );
    console.log(`  ✅ Updated ${settingsResult.modifiedCount} SchoolSettings documents`);
    
    // Remove Event.image completely
    console.log('\n🎉 Removing Event.image...');
    const eventsCollection = db.collection('events');
    const eventsResult = await eventsCollection.updateMany(
      {},
      { $unset: { image: "" } }
    );
    console.log(`  ✅ Updated ${eventsResult.modifiedCount} Event documents`);
    
    // Remove User.profilePicture completely (except for users with actual data)
    console.log('\n👤 Removing User.profilePicture...');
    const usersCollection = db.collection('users');
    
    // First, find users with profile pictures that have no data
    const usersWithEmptyPics = await usersCollection.find({
      'profilePicture.data': { $exists: true, $ne: null },
      $or: [
        { 'profilePicture.data': { $size: 0 } },
        { 'profilePicture.data': null }
      ]
    }).toArray();
    
    console.log(`  📋 Found ${usersWithEmptyPics.length} users with empty profile pictures`);
    
    let usersFixed = 0;
    for (const user of usersWithEmptyPics) {
      const result = await usersCollection.updateOne(
        { _id: user._id },
        { $unset: { profilePicture: "" } }
      );
      if (result.modifiedCount > 0) {
        usersFixed++;
        console.log(`  ✅ User ${user.name} profile picture removed`);
      }
    }
    
    console.log(`  ✅ Fixed ${usersFixed} users`);
    
    console.log('\n✅ Simple empty object removal completed!');
    console.log(`📊 Summary: ${settingsResult.modifiedCount} settings + ${eventsResult.modifiedCount} events + ${usersFixed} users fixed`);
    
  } catch (error) {
    console.error('❌ Error removing empty objects:', error);
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    }
    process.exit(0);
  }
}

// Run the removal
simpleRemoveEmpty();
