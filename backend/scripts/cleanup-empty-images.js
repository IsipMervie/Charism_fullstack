// Clean up empty image objects with undefined values
require('dotenv').config();
const mongoose = require('mongoose');

const cleanupEmptyImages = async () => {
  try {
    console.log('🧹 Cleaning up empty image objects...\n');
    
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
    
    // Find events with empty image objects (where data is undefined or null)
    const events = await db.collection('events').find({
      'image.data': { $in: [null, undefined] }
    }).toArray();
    
    console.log(`📋 Found ${events.length} events with empty image data`);
    
    if (events.length > 0) {
      // Remove the image field completely from these events
      const result = await db.collection('events').updateMany(
        { 'image.data': { $in: [null, undefined] } },
        { $unset: { image: "" } }
      );
      
      console.log(`✅ Updated ${result.modifiedCount} events`);
      console.log('   Removed empty image fields');
    }
    
    // Also check for events with image objects that have no meaningful data
    const eventsWithNoData = await db.collection('events').find({
      $and: [
        { 'image': { $exists: true } },
        {
          $or: [
            { 'image.data': { $in: [null, undefined] } },
            { 'image.contentType': { $in: [null, undefined, ''] } },
            { 'image.filename': { $in: [null, undefined, ''] } }
          ]
        }
      ]
    }).toArray();
    
    console.log(`📋 Found ${eventsWithNoData.length} events with incomplete image data`);
    
    if (eventsWithNoData.length > 0) {
      const result2 = await db.collection('events').updateMany(
        {
          $and: [
            { 'image': { $exists: true } },
            {
              $or: [
                { 'image.data': { $in: [null, undefined] } },
                { 'image.contentType': { $in: [null, undefined, ''] } },
                { 'image.filename': { $in: [null, undefined, ''] } }
              ]
            }
          ]
        },
        { $unset: { image: "" } }
      );
      
      console.log(`✅ Updated ${result2.modifiedCount} events`);
      console.log('   Removed incomplete image fields');
    }
    
    console.log('\n✅ Image cleanup complete');
    
  } catch (error) {
    console.error('❌ Error cleaning up images:', error);
  } finally {
    process.exit(0);
  }
};

cleanupEmptyImages();
