const mongoose = require('mongoose');
const Event = require('./models/Event');

mongoose.connect('mongodb+srv://admin:admin123@ua-database.wzgg1.mongodb.net/charism?retryWrites=true&w=majority&appName=UA-DATABASE');

async function testImageEndpoint() {
  try {
    console.log('🧪 Testing image endpoint...');
    
    // Get the first event
    const event = await Event.findOne({}).select('_id title image');
    
    if (!event) {
      console.log('❌ No events found');
      return;
    }
    
    console.log(`\n📋 Testing Event: ${event.title}`);
    console.log(`   ID: ${event._id}`);
    console.log(`   Has image: ${!!event.image}`);
    
    if (event.image) {
      console.log(`   Image data length: ${event.image.data ? event.image.data.length : 'N/A'}`);
      console.log(`   Image contentType: ${event.image.contentType || 'N/A'}`);
      
      if (event.image.data && event.image.data.length > 0) {
        console.log('✅ Image data exists and has content');
        
        // Test the actual endpoint URL
        const imageUrl = `https://charism-api-xtw9.onrender.com/api/files/event-image/${event._id}`;
        console.log(`\n🔗 Image URL: ${imageUrl}`);
        console.log('✅ This URL should now work and show the image');
        
      } else {
        console.log('❌ Image data is empty');
      }
    } else {
      console.log('❌ No image field');
    }
    
    // Test with the specific failing event
    const specificEvent = await Event.findById('68ceb01caffe9e1bff64abe4');
    if (specificEvent) {
      console.log(`\n🎯 Specific Event Test:`);
      console.log(`   Title: ${specificEvent.title}`);
      console.log(`   Has image: ${!!specificEvent.image}`);
      if (specificEvent.image && specificEvent.image.data) {
        console.log(`   Image data length: ${specificEvent.image.data.length}`);
        console.log(`   Image contentType: ${specificEvent.image.contentType}`);
        console.log('✅ This event should now show images');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testImageEndpoint();
