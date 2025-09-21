// Fix empty event image objects
require('dotenv').config();
const mongoose = require('mongoose');

const fixEventImages = async () => {
  try {
    console.log('🔧 Fixing empty event image objects...\n');
    
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
    
    // Find events with empty image objects
    const events = await db.collection('events').find({
      'image.data': { $exists: true, $size: 0 }
    }).toArray();
    
    console.log(`📋 Found ${events.length} events with empty image data`);
    
    if (events.length > 0) {
      // Remove the image field completely from these events
      const result = await db.collection('events').updateMany(
        { 'image.data': { $exists: true, $size: 0 } },
        { $unset: { image: "" } }
      );
      
      console.log(`✅ Updated ${result.modifiedCount} events`);
      console.log('   Removed empty image fields');
    }
    
    // Also check for events with image objects that have no data
    const eventsWithNoData = await db.collection('events').find({
      'image.data': { $exists: true },
      $or: [
        { 'image.data': { $size: 0 } },
        { 'image.data': null },
        { 'image.data': undefined }
      ]
    }).toArray();
    
    console.log(`📋 Found ${eventsWithNoData.length} events with no image data`);
    
    if (eventsWithNoData.length > 0) {
      const result2 = await db.collection('events').updateMany(
        {
          'image.data': { $exists: true },
          $or: [
            { 'image.data': { $size: 0 } },
            { 'image.data': null },
            { 'image.data': undefined }
          ]
        },
        { $unset: { image: "" } }
      );
      
      console.log(`✅ Updated ${result2.modifiedCount} events`);
      console.log('   Removed image fields with no data');
    }
    
    console.log('\n✅ Event image cleanup complete');
    
  } catch (error) {
    console.error('❌ Error fixing event images:', error);
  } finally {
    process.exit(0);
  }
};

fixEventImages();
