// Check what real data exists in the database
const mongoose = require('mongoose');
const Event = require('./models/Event');
const User = require('./models/User');

async function checkRealData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/charism');
    console.log('✅ Connected to MongoDB');

    // Check events with public registration
    console.log('\n📅 Events with Public Registration:');
    const eventsWithPublicReg = await Event.find({ 
      isPublicRegistrationEnabled: true,
      status: 'Active'
    }).select('title _id publicRegistrationToken isPublicRegistrationEnabled status');
    
    if (eventsWithPublicReg.length > 0) {
      eventsWithPublicReg.forEach(event => {
        console.log(`- ${event.title} (ID: ${event._id})`);
        console.log(`  Token: ${event.publicRegistrationToken}`);
        console.log(`  Public Reg: ${event.isPublicRegistrationEnabled}`);
        console.log(`  Status: ${event.status}`);
        console.log('');
      });
    } else {
      console.log('❌ No events with public registration found');
    }

    // Check events with pending registrations
    console.log('\n👥 Events with Pending Registrations:');
    const eventsWithPending = await Event.find({
      'attendance.registrationApproved': false,
      'attendance.status': 'Pending'
    }).populate('attendance.userId', 'name email').select('title _id attendance');

    if (eventsWithPending.length > 0) {
      eventsWithPending.forEach(event => {
        console.log(`- ${event.title} (ID: ${event._id})`);
        const pendingRegistrations = event.attendance.filter(att => 
          att.registrationApproved === false && att.status === 'Pending'
        );
        pendingRegistrations.forEach(reg => {
          console.log(`  👤 ${reg.userId?.name || 'Unknown'} (ID: ${reg.userId?._id || reg.userId})`);
        });
        console.log('');
      });
    } else {
      console.log('❌ No events with pending registrations found');
    }

    // Check all events
    console.log('\n📋 All Events:');
    const allEvents = await Event.find().select('title _id status isPublicRegistrationEnabled');
    allEvents.forEach(event => {
      console.log(`- ${event.title} (ID: ${event._id}) - Status: ${event.status} - Public Reg: ${event.isPublicRegistrationEnabled}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📤 Disconnected from MongoDB');
  }
}

checkRealData();
