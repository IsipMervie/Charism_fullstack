const mongoose = require('mongoose');
const Event = require('./models/Event');

mongoose.connect('mongodb+srv://admin:admin123@ua-database.wzgg1.mongodb.net/charism?retryWrites=true&w=majority&appName=UA-DATABASE');

async function checkRealEvents() {
  try {
    console.log('🔍 Checking all events in database...');
    
    const events = await Event.find({}).select('_id title image');
    
    console.log(`\n📊 Found ${events.length} events:`);
    
    let eventsWithImages = 0;
    let eventsWithoutImages = 0;
    
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
        
        if (event.image.data && event.image.data.length > 0) {
          eventsWithImages++;
          console.log(`   ✅ HAS IMAGE DATA`);
        } else {
          eventsWithoutImages++;
          console.log(`   ❌ NO IMAGE DATA`);
        }
      } else {
        eventsWithoutImages++;
        console.log(`   ❌ NO IMAGE FIELD`);
      }
    });
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Events with images: ${eventsWithImages}`);
    console.log(`   Events without images: ${eventsWithoutImages}`);
    console.log(`   Total events: ${events.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkRealEvents();
