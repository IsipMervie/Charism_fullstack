// Fix the Share Trial event directly
require('dotenv').config();
const mongoose = require('mongoose');

const fixShareTrialEvent = async () => {
  try {
    console.log('🔧 Fixing Share Trial event directly...\n');
    
    // Connect to database
    const { getLazyConnection } = require('../config/db');
    const isConnected = await getLazyConnection();
    
    if (!isConnected) {
      console.log('❌ Database not connected');
      return;
    }
    
    console.log('✅ Database connected\n');
    
    // Get database connection for direct operations
    const db = mongoose.connection.db;
    
    // Find the Share Trial event by title
    const event = await db.collection('events').findOne({ title: 'Share Trial' });
    
    if (!event) {
      console.log('❌ Share Trial event not found');
      return;
    }
    
    console.log(`📋 Found event: ${event.title}`);
    console.log(`   ID: ${event._id}`);
    console.log(`   Has image: ${!!event.image}`);
    
    if (event.image) {
      console.log(`   Image keys: ${Object.keys(event.image).join(', ')}`);
      console.log(`   Data exists: ${!!event.image.data}`);
      console.log(`   Content type: ${event.image.contentType || 'undefined'}`);
      console.log(`   Filename: ${event.image.filename || 'undefined'}`);
    }
    
    // Remove the image field completely
    const result = await db.collection('events').updateOne(
      { _id: event._id },
      { $unset: { image: "" } }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Image field removed successfully');
    } else {
      console.log('❌ Failed to remove image field');
    }
    
    // Verify the fix
    const updatedEvent = await db.collection('events').findOne({ _id: event._id });
    console.log(`\n📋 Verification:`);
    console.log(`   Has image after fix: ${!!updatedEvent.image}`);
    
    console.log('\n✅ Fix complete');
    
  } catch (error) {
    console.error('❌ Error fixing Share Trial event:', error);
  } finally {
    process.exit(0);
  }
};

fixShareTrialEvent();
