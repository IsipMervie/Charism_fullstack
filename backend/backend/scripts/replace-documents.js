// backend/scripts/replace-documents.js
// Script to replace documents and remove problematic fields

const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config();

// Import database configuration
const { getLazyConnection } = require('../config/db');

async function replaceDocuments() {
  try {
    console.log('🔧 Starting document replacement to remove problematic fields...');
    
    // Connect to database
    const isConnected = await getLazyConnection();
    if (!isConnected) {
      console.error('❌ Failed to connect to database');
      return;
    }
    console.log('✅ Database connected');
    
    // Get direct access to collections
    const db = mongoose.connection.db;
    
    // Replace SchoolSettings document without logo field
    console.log('\n📚 Replacing SchoolSettings document...');
    const schoolSettingsCollection = db.collection('schoolsettings');
    const settingsDoc = await schoolSettingsCollection.findOne({});
    
    if (settingsDoc) {
      // Create new document without logo field
      const newSettings = { ...settingsDoc };
      delete newSettings.logo;
      delete newSettings._id; // Remove _id for replacement
      
      const settingsResult = await schoolSettingsCollection.replaceOne(
        { _id: settingsDoc._id },
        newSettings
      );
      console.log(`  ✅ Replaced SchoolSettings document: ${settingsResult.modifiedCount} modified`);
    }
    
    // Replace Event documents without image field
    console.log('\n🎉 Replacing Event documents...');
    const eventsCollection = db.collection('events');
    const events = await eventsCollection.find({}).toArray();
    
    let eventsFixed = 0;
    for (const event of events) {
      // Create new document without image field
      const newEvent = { ...event };
      delete newEvent.image;
      delete newEvent._id; // Remove _id for replacement
      
      const eventResult = await eventsCollection.replaceOne(
        { _id: event._id },
        newEvent
      );
      if (eventResult.modifiedCount > 0) {
        eventsFixed++;
        console.log(`  ✅ Replaced Event "${event.title}": ${eventResult.modifiedCount} modified`);
      }
    }
    console.log(`  ✅ Fixed ${eventsFixed} events`);
    
    // Replace User documents without profilePicture field (for users without data)
    console.log('\n👤 Replacing User documents...');
    const usersCollection = db.collection('users');
    const users = await usersCollection.find({}).toArray();
    
    let usersFixed = 0;
    for (const user of users) {
      if (user.profilePicture && (!user.profilePicture.data || user.profilePicture.data.length === 0)) {
        // Create new document without profilePicture field
        const newUser = { ...user };
        delete newUser.profilePicture;
        delete newUser._id; // Remove _id for replacement
        
        const userResult = await usersCollection.replaceOne(
          { _id: user._id },
          newUser
        );
        if (userResult.modifiedCount > 0) {
          usersFixed++;
          console.log(`  ✅ Replaced User "${user.name}": ${userResult.modifiedCount} modified`);
        }
      }
    }
    console.log(`  ✅ Fixed ${usersFixed} users`);
    
    console.log('\n✅ Document replacement completed!');
    console.log(`📊 Summary: 1 settings + ${eventsFixed} events + ${usersFixed} users fixed`);
    
  } catch (error) {
    console.error('❌ Error replacing documents:', error);
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    }
    process.exit(0);
  }
}

// Run the replacement
replaceDocuments();
