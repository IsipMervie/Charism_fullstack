// Deploy test data to production database
const mongoose = require('mongoose');

async function deployToProduction() {
  try {
    // Connect to production MongoDB (you'll need to set the production MONGODB_URI)
    const prodUri = process.env.PROD_MONGODB_URI || process.env.MONGODB_URI;
    
    if (!prodUri) {
      console.log('❌ No production MongoDB URI found');
      console.log('💡 Set PROD_MONGODB_URI environment variable');
      return;
    }

    await mongoose.connect(prodUri);
    console.log('✅ Connected to Production MongoDB');

    const Event = require('./models/Event');
    const User = require('./models/User');

    // Find existing events in production
    const events = await Event.find({ 
      isPublicRegistrationEnabled: true,
      status: 'Active'
    });

    console.log(`📅 Found ${events.length} active events in production`);

    if (events.length === 0) {
      console.log('❌ No active events found in production');
      return;
    }

    // Use the first event
    const event = events[0];
    console.log('📅 Using event:', event.title, '(ID:', event._id + ')');

    // Create test students in production
    const students = [
      { name: 'John Doe', email: 'john.doe@charism.edu.ph', department: 'BSIT', year: '3rd Year' },
      { name: 'Jane Smith', email: 'jane.smith@charism.edu.ph', department: 'BSCS', year: '2nd Year' }
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
        console.log(`✅ Created student in production: ${student.name}`);
      } else {
        console.log(`✅ Student exists in production: ${student.name}`);
      }
      createdStudents.push(student);
    }

    // Add pending registrations to production event
    console.log('\n📝 Adding pending registrations to production...');
    for (const student of createdStudents) {
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
      }
    }

    await event.save();

    console.log('\n🎯 PRODUCTION SETUP COMPLETE!');
    console.log('✅ Test students created in production');
    console.log('✅ Pending registrations added to production');
    console.log('✅ Registration approval system ready to test');
    console.log('\n📋 You can now test the registration approval page in production!');
    console.log(`📅 Event: ${event.title}`);
    console.log(`🔗 Event ID: ${event._id}`);
    console.log(`👥 Students with pending registrations: ${createdStudents.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📤 Disconnected from Production MongoDB');
  }
}

deployToProduction();
