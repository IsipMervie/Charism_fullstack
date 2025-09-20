// Test approval system locally
const mongoose = require('mongoose');
const Event = require('./models/Event');
const User = require('./models/User');

async function testLocalApproval() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/charism');
    console.log('✅ Connected to MongoDB');

    // Find event with pending registrations
    const event = await Event.findOne({
      'attendance.registrationApproved': false,
      'attendance.status': 'Pending'
    }).populate('attendance.userId', 'name email');

    if (!event) {
      console.log('❌ No events with pending registrations found');
      return;
    }

    console.log('📅 Found event:', event.title);
    console.log('👥 Pending registrations:');

    const pendingRegistrations = event.attendance.filter(att => 
      att.registrationApproved === false && att.status === 'Pending'
    );

    pendingRegistrations.forEach((reg, index) => {
      console.log(`${index + 1}. ${reg.userId.name} (${reg.userId.email}) - ID: ${reg.userId._id}`);
    });

    // Test approval for first student
    if (pendingRegistrations.length > 0) {
      const firstStudent = pendingRegistrations[0];
      const studentId = firstStudent.userId._id;
      
      console.log(`\n🧪 Testing approval for: ${firstStudent.userId.name}`);
      
      // Simulate the approval process
      const attendance = event.attendance.find(a => a.userId.toString() === studentId.toString());
      if (attendance) {
        attendance.registrationApproved = true;
        attendance.status = 'Pending'; // Keep as Pending until they attend
        await event.save();
        
        console.log('✅ Registration approved successfully!');
        console.log('📧 Email would be sent to:', firstStudent.userId.email);
        console.log('💬 Student can now access event chat');
        console.log('⏰ Student still needs to attend to get community service hours');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📤 Disconnected from MongoDB');
  }
}

testLocalApproval();
