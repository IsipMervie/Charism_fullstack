// backend/scripts/debug-database.js
// Debug script to see exactly what's in the database

const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config();

// Import database configuration
const { getLazyConnection } = require('../config/db');

async function debugDatabase() {
  try {
    console.log('🔍 Debugging database content...');
    
    // Connect to database
    const isConnected = await getLazyConnection();
    if (!isConnected) {
      console.error('❌ Failed to connect to database');
      return;
    }
    console.log('✅ Database connected');
    
    // Get direct access to collections
    const db = mongoose.connection.db;
    
    // Debug SchoolSettings
    console.log('\n📚 Debugging SchoolSettings...');
    const schoolSettingsCollection = db.collection('schoolsettings');
    const settingsDoc = await schoolSettingsCollection.findOne({});
    if (settingsDoc) {
      console.log('  📋 Document ID:', settingsDoc._id);
      console.log('  📋 All fields:', Object.keys(settingsDoc));
      console.log('  📋 Logo field:', settingsDoc.logo);
      console.log('  📋 Logo type:', typeof settingsDoc.logo);
      if (settingsDoc.logo && typeof settingsDoc.logo === 'object') {
        console.log('  📋 Logo keys:', Object.keys(settingsDoc.logo));
        console.log('  📋 Logo data length:', settingsDoc.logo.data ? settingsDoc.logo.data.length : 'no data');
      }
    }
    
    // Debug Events
    console.log('\n🎉 Debugging Events...');
    const eventsCollection = db.collection('events');
    const events = await eventsCollection.find({}).toArray();
    console.log(`  📋 Found ${events.length} events`);
    
    events.forEach((event, index) => {
      console.log(`  📋 Event ${index + 1} (${event.title}):`);
      console.log(`    📋 Document ID: ${event._id}`);
      console.log(`    📋 All fields: ${Object.keys(event)}`);
      console.log(`    📋 Image field: ${event.image}`);
      console.log(`    📋 Image type: ${typeof event.image}`);
      if (event.image && typeof event.image === 'object') {
        console.log(`    📋 Image keys: ${Object.keys(event.image)}`);
        console.log(`    📋 Image data length: ${event.image.data ? event.image.data.length : 'no data'}`);
      }
    });
    
    // Debug Users
    console.log('\n👤 Debugging Users...');
    const usersCollection = db.collection('users');
    const users = await usersCollection.find({}).toArray();
    console.log(`  📋 Found ${users.length} users`);
    
    users.forEach((user, index) => {
      console.log(`  📋 User ${index + 1} (${user.name}):`);
      console.log(`    📋 Document ID: ${user._id}`);
      console.log(`    📋 All fields: ${Object.keys(user)}`);
      console.log(`    📋 Profile picture field: ${user.profilePicture}`);
      console.log(`    📋 Profile picture type: ${typeof user.profilePicture}`);
      if (user.profilePicture && typeof user.profilePicture === 'object') {
        console.log(`    📋 Profile picture keys: ${Object.keys(user.profilePicture)}`);
        console.log(`    📋 Profile picture data length: ${user.profilePicture.data ? user.profilePicture.data.length : 'no data'}`);
      }
    });
    
    console.log('\n✅ Database debug completed!');
    
  } catch (error) {
    console.error('❌ Error debugging database:', error);
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    }
    process.exit(0);
  }
}

// Run the debug
debugDatabase();
