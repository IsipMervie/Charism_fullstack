const mongoose = require('mongoose');
const Event = require('./models/Event');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/charism', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function generateTokens() {
  try {
    console.log('🔍 Finding events without tokens...');
    
    // Find events without tokens
    const eventsWithoutTokens = await Event.find({ 
      publicRegistrationToken: { $exists: false }
    });
    
    console.log(`📋 Found ${eventsWithoutTokens.length} events without tokens`);
    
    if (eventsWithoutTokens.length === 0) {
      console.log('✅ All events already have tokens!');
      return;
    }
    
    // Generate tokens for each event
    for (const event of eventsWithoutTokens) {
      const token = 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      await Event.findByIdAndUpdate(event._id, {
        publicRegistrationToken: token,
        isPublicRegistrationEnabled: true
      });
      
      console.log(`✅ Generated token for "${event.title}": ${token}`);
    }
    
    console.log('🎉 All tokens generated successfully!');
    
    // Show all events with tokens
    const eventsWithTokens = await Event.find({ 
      publicRegistrationToken: { $exists: true, $ne: null } 
    }).select('title publicRegistrationToken isPublicRegistrationEnabled status');
    
    console.log('📋 Events with tokens:', eventsWithTokens);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

generateTokens();
