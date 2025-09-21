// Debug event image data structure
require('dotenv').config();
const mongoose = require('mongoose');

const debugEventImages = async () => {
  try {
    console.log('🔍 Debugging event image data structure...\n');
    
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
    console.log(`📋 Found ${events.length} total events\n`);
    
    for (const event of events) {
      console.log(`📋 Event: ${event.title || event._id}`);
      console.log(`   Has image field: ${!!event.image}`);
      
      if (event.image) {
        console.log(`   Image type: ${typeof event.image}`);
        console.log(`   Image keys: ${Object.keys(event.image).join(', ')}`);
        
        if (event.image.data) {
          console.log(`   Data type: ${typeof event.image.data}`);
          console.log(`   Data length: ${event.image.data ? event.image.data.length : 'undefined'}`);
          console.log(`   Data is Buffer: ${event.image.data instanceof Buffer}`);
          console.log(`   Data is Array: ${Array.isArray(event.image.data)}`);
        }
        
        if (event.image.contentType) {
          console.log(`   Content type: ${event.image.contentType}`);
        }
        
        if (event.image.filename) {
          console.log(`   Filename: ${event.image.filename}`);
        }
        
        if (event.image.uploadedAt) {
          console.log(`   Uploaded at: ${event.image.uploadedAt}`);
        }
      }
      console.log('');
    }
    
    console.log('✅ Debug complete');
    
  } catch (error) {
    console.error('❌ Error debugging event images:', error);
  } finally {
    process.exit(0);
  }
};

debugEventImages();
