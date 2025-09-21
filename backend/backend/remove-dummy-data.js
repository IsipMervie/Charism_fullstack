// Remove dummy test data
const mongoose = require('mongoose');
const Event = require('./models/Event');
const User = require('./models/User');

async function removeDummyData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/charism');
    console.log('✅ Connected to MongoDB');

    // Remove test students
    const testEmails = [
      'john.doe@charism.edu.ph',
      'jane.smith@charism.edu.ph', 
      'mike.johnson@charism.edu.ph',
      'teststudent@charism.edu.ph'
    ];

    console.log('🗑️ Removing test students...');
    for (const email of testEmails) {
      const student = await User.findOne({ email });
      if (student) {
        await User.deleteOne({ _id: student._id });
        console.log(`✅ Removed: ${student.name}`);
      }
    }

    // Remove test registrations from events
    console.log('\n🗑️ Removing test registrations...');
    const events = await Event.find();
    
    for (const event of events) {
      const originalLength = event.attendance.length;
      
      // Remove registrations for test students
      event.attendance = event.attendance.filter(att => {
        // Keep registrations that don't match test student IDs
        return !testEmails.includes(att.userId?.email);
      });
      
      if (event.attendance.length !== originalLength) {
        await event.save();
        console.log(`✅ Cleaned registrations from: ${event.title}`);
      }
    }

    console.log('\n✅ Dummy data removed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📤 Disconnected from MongoDB');
  }
}

removeDummyData();
