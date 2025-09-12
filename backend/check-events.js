const mongoose = require('mongoose');
const Event = require('./models/Event');

async function checkEvents() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/communitylink');
    console.log('Connected to MongoDB');
    
    const events = await Event.find({}).select('title attendance').lean();
    console.log('Total events:', events.length);
    
    events.forEach(event => {
      console.log(`Event: ${event.title}`);
      console.log(`  Participants: ${event.attendance ? event.attendance.length : 0}`);
      if (event.attendance && event.attendance.length > 0) {
        const userIds = event.attendance.map(a => a.userId);
        const uniqueUserIds = [...new Set(userIds.map(id => id.toString()))];
        console.log(`  Unique users: ${uniqueUserIds.length}`);
        if (userIds.length !== uniqueUserIds.length) {
          console.log('  ⚠️  DUPLICATE USERS FOUND!');
          
          // Find duplicates
          const duplicates = userIds.filter((id, index) => userIds.indexOf(id) !== index);
          console.log('  Duplicate user IDs:', [...new Set(duplicates)]);
        }
      }
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkEvents();