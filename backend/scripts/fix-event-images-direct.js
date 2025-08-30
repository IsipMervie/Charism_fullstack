// Fix empty event image objects - direct approach
require('dotenv').config();
const mongoose = require('mongoose');

const fixEventImagesDirect = async () => {
  try {
    console.log('🔧 Fixing empty event image objects (direct approach)...\n');
    
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
    
    // Get all events
    const events = await db.collection('events').find({}).toArray();
    console.log(`📋 Found ${events.length} total events`);
    
    let updatedCount = 0;
    
    for (const event of events) {
      if (event.image && event.image.data) {
        // Check if the data is actually empty or invalid
        const dataLength = event.image.data.length || 0;
        const hasContentType = event.image.contentType && event.image.contentType.trim() !== '';
        const hasFilename = event.image.filename && event.image.filename.trim() !== '';
        
        console.log(`   Event: ${event.title || event._id}`);
        console.log(`     Data length: ${dataLength}`);
        console.log(`     Content type: ${hasContentType ? '✅' : '❌'}`);
        console.log(`     Filename: ${hasFilename ? '✅' : '❌'}`);
        
        // If data is empty or missing critical fields, remove the image
        if (dataLength === 0 || !hasContentType || !hasFilename) {
          console.log(`     ❌ Removing invalid image field`);
          
          const result = await db.collection('events').updateOne(
            { _id: event._id },
            { $unset: { image: "" } }
          );
          
          if (result.modifiedCount > 0) {
            updatedCount++;
            console.log(`     ✅ Image field removed`);
          }
        } else {
          console.log(`     ✅ Image field is valid`);
        }
        console.log('');
      } else if (event.image) {
        console.log(`   Event: ${event.title || event._id}`);
        console.log(`     ❌ Image field exists but no data, removing`);
        
        const result = await db.collection('events').updateOne(
          { _id: event._id },
          { $unset: { image: "" } }
        );
        
        if (result.modifiedCount > 0) {
          updatedCount++;
          console.log(`     ✅ Image field removed`);
        }
        console.log('');
      }
    }
    
    console.log(`\n✅ Event image cleanup complete`);
    console.log(`   Updated ${updatedCount} events`);
    
  } catch (error) {
    console.error('❌ Error fixing event images:', error);
  } finally {
    process.exit(0);
  }
};

fixEventImagesDirect();
