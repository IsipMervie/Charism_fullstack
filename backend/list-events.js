const mongoose = require('mongoose');
const Event = require('./models/Event');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/charism', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function listEvents() {
  try {
    console.log('🔍 Listing all events...');
    
    const events = await Event.find({}).select('title _id date status publicRegistrationToken isPublicRegistrationEnabled');
    
    console.log(`📋 Found ${events.length} events:`);
    
    events.forEach((event, index) => {
      console.log(`${index + 1}. "${event.title}"`);
      console.log(`   ID: ${event._id}`);
      console.log(`   Date: ${event.date}`);
      console.log(`   Status: ${event.status}`);
      console.log(`   Token: ${event.publicRegistrationToken || 'None'}`);
      console.log(`   Public Registration: ${event.isPublicRegistrationEnabled ? 'Enabled' : 'Disabled'}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

listEvents();
