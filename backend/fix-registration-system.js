// Comprehensive fix for registration approval system
const mongoose = require('mongoose');
const Event = require('./models/Event');
const User = require('./models/User');

async function fixRegistrationSystem() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/charism');
    console.log('✅ Connected to MongoDB');

    // 1. Create test students if they don't exist
    console.log('\n👥 Creating test students...');
    const students = [
      { name: 'John Doe', email: 'john.doe@charism.edu.ph', department: 'BSIT', year: '3rd Year' },
      { name: 'Jane Smith', email: 'jane.smith@charism.edu.ph', department: 'BSCS', year: '2nd Year' },
      { name: 'Mike Johnson', email: 'mike.johnson@charism.edu.ph', department: 'BSIT', year: '4th Year' }
    ];

    const createdStudents = [];
    for (const studentData of students) {
      let student = await User.findOne({ email: studentData.email });
      if (!student) {
        student = new User({
          ...studentData,
          password: 'password123',
          role: 'Student',
          academicYear: '2024-2025',
          section: 'A',
          communityServiceHours: 0,
          profilePicture: null
        });
        await student.save();
        console.log(`✅ Created student: ${student.name}`);
      } else {
        console.log(`✅ Student exists: ${student.name}`);
      }
      createdStudents.push(student);
    }

    // 2. Get an active event
    console.log('\n📅 Setting up event...');
    let event = await Event.findOne({ 
      isPublicRegistrationEnabled: true,
      status: 'Active'
    });

    if (!event) {
      // Create a test event if none exists
      event = new Event({
        title: 'Community Service Event',
        description: 'A community service event for testing',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        time: '10:00 AM',
        startTime: '10:00 AM',
        endTime: '2:00 PM',
        location: 'Community Center',
        maxParticipants: 50,
        hours: 4,
        requiresApproval: true,
        isPublicRegistrationEnabled: true,
        status: 'Active',
        publicRegistrationToken: `evt_${Date.now()}_test`,
        createdBy: '68ce426bd8ff015084ccba63',
        attendance: []
      });
      await event.save();
      console.log('✅ Created test event:', event.title);
    } else {
      console.log('✅ Using existing event:', event.title);
    }

    // 3. Add pending registrations
    console.log('\n📝 Adding pending registrations...');
    for (const student of createdStudents) {
      // Check if student is already registered
      const existingRegistration = event.attendance.find(att => 
        att.userId.toString() === student._id.toString()
      );

      if (!existingRegistration) {
        event.attendance.push({
          userId: student._id,
          status: 'Pending',
          registrationApproved: false,
          timeIn: null,
          timeOut: null,
          documentation: {
            files: []
          }
        });
        console.log(`✅ Added pending registration for: ${student.name}`);
      } else {
        console.log(`⚠️ ${student.name} already registered`);
      }
    }

    await event.save();

    // 4. Test the approval system
    console.log('\n🧪 Testing approval system...');
    const axios = require('axios');
    
    const testStudent = createdStudents[0];
    const testEventId = event._id;
    const testUserId = testStudent._id;

    console.log(`Testing approval for ${testStudent.name} (${testUserId}) in event ${event.title} (${testEventId})`);

    try {
      const response = await axios.put(
        `https://charism-api-xtw9.onrender.com/api/events/working-approve/${testEventId}/${testUserId}`
      );
      console.log('✅ Approval test successful:', response.data.message);
    } catch (error) {
      console.log('❌ Approval test failed:', error.response?.status, error.response?.data?.message);
    }

    // 5. Summary
    console.log('\n📋 SUMMARY:');
    console.log('✅ Test students created');
    console.log('✅ Event configured');
    console.log('✅ Pending registrations added');
    console.log('✅ Approval system tested');
    console.log('\n🎯 You can now test the registration approval page!');
    console.log(`📅 Event: ${event.title}`);
    console.log(`🔗 Event ID: ${event._id}`);
    console.log(`👥 Students with pending registrations: ${createdStudents.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📤 Disconnected from MongoDB');
  }
}

fixRegistrationSystem();
