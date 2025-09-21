// Debug specific event - Share Trial
require('dotenv').config();
const mongoose = require('mongoose');

const debugSpecificEvent = async () => {
  try {
    console.log('🔍 Debugging specific event: Share Trial...\n');
    
    // Connect to database
    const { getLazyConnection } = require('../config/db');
    const isConnected = await getLazyConnection();
    
    if (!isConnected) {
      console.log('❌ Database not connected');
      return;
    }
    
    console.log('✅ Database connected\n');
    
    // Get the specific event
    const Event = require('../models/Event');
    const event = await Event.findOne({ title: 'Share Trial' });
    
    if (!event) {
      console.log('❌ Event not found');
      return;
    }
    
    console.log(`📋 Event: ${event.title}`);
    console.log(`   ID: ${event._id}`);
    console.log(`   Has image: ${!!event.image}`);
    
    if (event.image) {
      console.log(`   Image type: ${typeof event.image}`);
      console.log(`   Image keys: ${Object.keys(event.image).join(', ')}`);
      
      // Check each field individually
      console.log(`   Data exists: ${!!event.image.data}`);
      if (event.image.data) {
        console.log(`   Data type: ${typeof event.image.data}`);
        console.log(`   Data length: ${event.image.data.length}`);
        console.log(`   Data is Buffer: ${event.image.data instanceof Buffer}`);
      }
      
      console.log(`   Content type: ${event.image.contentType || 'undefined'}`);
      console.log(`   Filename: ${event.image.filename || 'undefined'}`);
      console.log(`   Uploaded at: ${event.image.uploadedAt || 'undefined'}`);
      
      // Try to access data directly
      try {
        const dataLength = event.image.data ? event.image.data.length : 'no data';
        console.log(`   Direct data length: ${dataLength}`);
      } catch (error) {
        console.log(`   Error accessing data: ${error.message}`);
      }
    }
    
    console.log('\n✅ Debug complete');
    
  } catch (error) {
    console.error('❌ Error debugging event:', error);
  } finally {
    process.exit(0);
  }
};

debugSpecificEvent();
