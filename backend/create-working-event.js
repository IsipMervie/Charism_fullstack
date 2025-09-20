// Create a working event with public registration enabled
const mongoose = require('mongoose');
const Event = require('./models/Event');

async function createWorkingEvent() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/charism');
    console.log('✅ Connected to MongoDB');

    // Create a test event with public registration
    const testEvent = new Event({
      title: 'Test Event for Registration',
      description: 'This is a test event to verify registration functionality',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      time: '10:00 AM',
      startTime: '10:00 AM',
      endTime: '12:00 PM',
      location: 'Test Location',
      maxParticipants: 50,
      hours: 2,
      requiresApproval: true,
      isPublicRegistrationEnabled: true,
      status: 'Active',
      publicRegistrationToken: 'evt_68ce426bd8ff015084ccba63_1758357865303', // Use the exact token from the error
      createdBy: '68ce426bd8ff015084ccba63', // Use a valid user ID
      attendance: []
    });

    // Save the event
    await testEvent.save();
    console.log('✅ Test event created successfully!');
    console.log('📋 Event ID:', testEvent._id);
    console.log('📋 Token:', testEvent.publicRegistrationToken);
    console.log('📋 Public Registration Enabled:', testEvent.isPublicRegistrationEnabled);
    console.log('📋 Status:', testEvent.status);

    // Test the token
    console.log('\n🧪 Testing the token...');
    const foundEvent = await Event.findOne({ 
      publicRegistrationToken: 'evt_68ce426bd8ff015084ccba63_1758357865303' 
    });
    
    if (foundEvent) {
      console.log('✅ Token found in database!');
      console.log('📋 Event Title:', foundEvent.title);
      console.log('📋 Public Registration:', foundEvent.isPublicRegistrationEnabled);
    } else {
      console.log('❌ Token not found in database');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
  }
}

createWorkingEvent();
