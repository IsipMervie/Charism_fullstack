// backend/scripts/set-null-instead.js
// Script to set empty object fields to null

const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config();

// Import database configuration
const { getLazyConnection } = require('../config/db');

async function setNullInstead() {
  try {
    console.log('🔧 Starting null assignment for empty objects...');
    
    // Connect to database
    const isConnected = await getLazyConnection();
    if (!isConnected) {
      console.error('❌ Failed to connect to database');
      return;
    }
    console.log('✅ Database connected');
    
    // Get direct access to collections
    const db = mongoose.connection.db;
    
    // Set SchoolSettings.logo to null
    console.log('\n📚 Setting SchoolSettings.logo to null...');
    const schoolSettingsCollection = db.collection('schoolsettings');
    const settingsResult = await schoolSettingsCollection.updateMany(
      {},
      { $set: { logo: null } }
    );
    console.log(`  ✅ Updated ${settingsResult.modifiedCount} SchoolSettings documents`);
    
    // Set Event.image to null
    console.log('\n🎉 Setting Event.image to null...');
    const eventsCollection = db.collection('events');
    const eventsResult = await eventsCollection.updateMany(
      {},
      { $set: { image: null } }
    );
    console.log(`  ✅ Updated ${eventsResult.modifiedCount} Event documents`);
    
    // Set User.profilePicture to null for users without data
    console.log('\n👤 Setting User.profilePicture to null...');
    const usersCollection = db.collection('users');
    
    // Find users with profile pictures that have no data
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
        { $set: { profilePicture: null } }
      );
      if (result.modifiedCount > 0) {
        usersFixed++;
        console.log(`  ✅ User ${user.name} profile picture set to null`);
      }
    }
    
    console.log(`  ✅ Fixed ${usersFixed} users`);
    
    console.log('\n✅ Null assignment completed!');
    console.log(`📊 Summary: ${settingsResult.modifiedCount} settings + ${eventsResult.modifiedCount} events + ${usersFixed} users fixed`);
    
  } catch (error) {
    console.error('❌ Error setting fields to null:', error);
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    }
    process.exit(0);
  }
}

// Run the null assignment
setNullInstead();
