// Create a test registration for testing approval functionality
const mongoose = require('mongoose');
const Event = require('./models/Event');
const User = require('./models/User');

async function createTestRegistration() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/charism');
    console.log('✅ Connected to MongoDB');

    // Find an event with public registration
    const event = await Event.findOne({ 
      isPublicRegistrationEnabled: true,
      status: 'Active'
    });
    
    if (!event) {
      console.log('❌ No active events with public registration found');
      return;
    }
    
    console.log('📅 Found event:', event.title, '(ID:', event._id + ')');

    // Find a user to register
    const user = await User.findOne({ role: 'Student' });
    
    if (!user) {
      console.log('❌ No student users found');
      return;
    }
    
    console.log('👤 Found user:', user.name, '(ID:', user._id + ')');

    // Check if user is already registered
    const existingRegistration = event.attendance.find(att => 
      att.userId.toString() === user._id.toString()
    );
    
    if (existingRegistration) {
      console.log('⚠️ User is already registered for this event');
      console.log('📋 Current status:', existingRegistration.status);
      console.log('📋 Registration approved:', existingRegistration.registrationApproved);
      return;
    }

    // Add user to event attendance with pending registration
    event.attendance.push({
      userId: user._id,
      status: 'Pending',
      registrationApproved: false,
      timeIn: null,
      timeOut: null,
      documentation: {
        files: []
      }
    });

    await event.save();
    console.log('✅ Test registration created successfully!');
    console.log('📋 User:', user.name);
    console.log('📋 Event:', event.title);
    console.log('📋 Status: Pending');
    console.log('📋 Registration Approved: false');

    // Test the approval route
    console.log('\n🧪 Testing approval route...');
    const axios = require('axios');
    
    try {
      const response = await axios.put(
        `https://charism-api-xtw9.onrender.com/api/events/working-approve/${event._id}/${user._id}`
      );
      console.log('✅ Approval test successful:', response.data.message);
    } catch (error) {
      console.log('❌ Approval test failed:', error.response?.status, error.response?.data?.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📤 Disconnected from MongoDB');
  }
}

createTestRegistration();
