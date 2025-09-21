const mongoose = require('mongoose');
const Event = require('./models/Event');

// Connect to database
mongoose.connect('mongodb+srv://admin:admin123@ua-database.wzgg1.mongodb.net/charism?retryWrites=true&w=majority&appName=UA-DATABASE');

async function debugImages() {
  try {
    console.log('🔍 Checking event images in database...');
    
    const events = await Event.find({}).select('_id title image');
    
    console.log(`\n📊 Found ${events.length} events:`);
    
    events.forEach((event, index) => {
      console.log(`\n${index + 1}. Event: ${event.title}`);
      console.log(`   ID: ${event._id}`);
      console.log(`   Has image field: ${!!event.image}`);
      
      if (event.image) {
        console.log(`   Image type: ${typeof event.image}`);
        console.log(`   Image data exists: ${!!event.image.data}`);
        console.log(`   Image data length: ${event.image.data ? event.image.data.length : 'N/A'}`);
        console.log(`   Image contentType: ${event.image.contentType || 'N/A'}`);
        console.log(`   Image filename: ${event.image.filename || 'N/A'}`);
      } else {
        console.log(`   ❌ No image field`);
      }
    });
    
    // Check specific event that's failing
    const specificEvent = await Event.findById('68ceb01caffe9e1bff64abe4');
    if (specificEvent) {
      console.log(`\n🎯 Specific Event Check:`);
      console.log(`   Title: ${specificEvent.title}`);
      console.log(`   Has image: ${!!specificEvent.image}`);
      if (specificEvent.image) {
        console.log(`   Image data length: ${specificEvent.image.data ? specificEvent.image.data.length : 'N/A'}`);
        console.log(`   Image contentType: ${specificEvent.image.contentType || 'N/A'}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugImages();
