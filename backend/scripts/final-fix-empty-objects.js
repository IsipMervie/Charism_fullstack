// backend/scripts/final-fix-empty-objects.js
// Final script to remove empty object fields with no data

const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config();

// Import database configuration
const { getLazyConnection } = require('../config/db');

async function finalFixEmptyObjects() {
  try {
    console.log('🔧 Starting final empty object cleanup...');
    
    // Connect to database
    const isConnected = await getLazyConnection();
    if (!isConnected) {
      console.error('❌ Failed to connect to database');
      return;
    }
    console.log('✅ Database connected');
    
    // Get direct access to collections
    const db = mongoose.connection.db;
    
    // Fix SchoolSettings.logo - remove if no data
    console.log('\n📚 Fixing SchoolSettings.logo...');
    const schoolSettingsCollection = db.collection('schoolsettings');
    const settingsResult = await schoolSettingsCollection.updateMany(
      { 'logo.data': { $exists: true, $ne: null }, $or: [{ 'logo.data': { $size: 0 } }, { 'logo.data': null }] },
      { $unset: { logo: "" } }
    );
    console.log(`  ✅ Updated ${settingsResult.modifiedCount} SchoolSettings documents`);
    
    // Fix Event.image - remove if no data
    console.log('\n🎉 Fixing Event.image...');
    const eventsCollection = db.collection('events');
    const eventsResult = await eventsCollection.updateMany(
      { 'image.data': { $exists: true, $ne: null }, $or: [{ 'image.data': { $size: 0 } }, { 'image.data': null }] },
      { $unset: { image: "" } }
    );
    console.log(`  ✅ Updated ${eventsResult.modifiedCount} Event documents`);
    
    // Fix User.profilePicture - remove if no data
    console.log('\n👤 Fixing User.profilePicture...');
    const usersCollection = db.collection('users');
    const usersResult = await usersCollection.updateMany(
      { 'profilePicture.data': { $exists: true, $ne: null }, $or: [{ 'profilePicture.data': { $size: 0 } }, { 'profilePicture.data': null }] },
      { $unset: { profilePicture: "" } }
    );
    console.log(`  ✅ Updated ${usersResult.modifiedCount} User documents`);
    
    console.log('\n✅ Final empty object cleanup completed!');
    console.log(`📊 Summary: ${settingsResult.modifiedCount} settings + ${eventsResult.modifiedCount} events + ${usersResult.modifiedCount} users fixed`);
    
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
finalFixEmptyObjects();
