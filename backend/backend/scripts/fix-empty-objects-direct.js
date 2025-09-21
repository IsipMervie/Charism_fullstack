// backend/scripts/fix-empty-objects-direct.js
// Script to completely remove empty object fields using direct database updates

const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config();

// Import database configuration
const { getLazyConnection } = require('../config/db');

async function fixEmptyObjectsDirect() {
  try {
    console.log('🔧 Starting direct empty object cleanup...');
    
    // Connect to database
    const isConnected = await getLazyConnection();
    if (!isConnected) {
      console.error('❌ Failed to connect to database');
      return;
    }
    console.log('✅ Database connected');
    
    // Get direct access to collections
    const db = mongoose.connection.db;
    
    // Fix SchoolSettings.logo - completely remove if empty
    console.log('\n📚 Fixing SchoolSettings.logo...');
    const schoolSettingsCollection = db.collection('schoolsettings');
    const settingsResult = await schoolSettingsCollection.updateMany(
      { 'logo.data': { $exists: true, $size: 0 } },
      { $unset: { logo: "" } }
    );
    console.log(`  ✅ Updated ${settingsResult.modifiedCount} SchoolSettings documents`);
    
    // Fix Event.image - completely remove if empty
    console.log('\n🎉 Fixing Event.image...');
    const eventsCollection = db.collection('events');
    const eventsResult = await eventsCollection.updateMany(
      { 'image.data': { $exists: true, $size: 0 } },
      { $unset: { image: "" } }
    );
    console.log(`  ✅ Updated ${eventsResult.modifiedCount} Event documents`);
    
    // Fix User.profilePicture - completely remove if empty
    console.log('\n👤 Fixing User.profilePicture...');
    const usersCollection = db.collection('users');
    const usersResult = await usersCollection.updateMany(
      { 'profilePicture.data': { $exists: true, $size: 0 } },
      { $unset: { profilePicture: "" } }
    );
    console.log(`  ✅ Updated ${usersResult.modifiedCount} User documents`);
    
    console.log('\n✅ Direct empty object cleanup completed!');
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
fixEmptyObjectsDirect();
