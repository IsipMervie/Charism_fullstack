const mongoose = require('mongoose');
const Event = require('./models/Event');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/charism', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testEventToken() {
  try {
    console.log('🔍 Testing event token: evt_1756797173382_eh0lcceri');
    
    // Find event by token
    const event = await Event.findOne({ 
      publicRegistrationToken: 'evt_1756797173382_eh0lcceri'
    });
    
    if (event) {
      console.log('✅ Event found:', {
        _id: event._id,
        title: event.title,
        publicRegistrationToken: event.publicRegistrationToken,
        isPublicRegistrationEnabled: event.isPublicRegistrationEnabled,
        status: event.status,
        date: event.date
      });
    } else {
      console.log('❌ Event not found with token: evt_1756797173382_eh0lcceri');
      
      // List all events with tokens
      const eventsWithTokens = await Event.find({ 
        publicRegistrationToken: { $exists: true, $ne: null } 
      }).select('title publicRegistrationToken isPublicRegistrationEnabled status');
      
      console.log('📋 Events with tokens:', eventsWithTokens);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

testEventToken();
