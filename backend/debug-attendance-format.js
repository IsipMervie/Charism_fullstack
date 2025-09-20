// Debug the attendance format to understand the issue
const mongoose = require('mongoose');
const Event = require('./models/Event');

async function debugAttendanceFormat() {
  try {
    // Connect to production MongoDB
    await mongoose.connect(process.env.PROD_MONGODB_URI);
    console.log('✅ Connected to Production MongoDB');

    const event = await Event.findById('68ce426bd8ff015084ccba63');
    
    if (!event) {
      console.log('❌ Event not found');
      return;
    }

    console.log('📅 Event:', event.title);
    console.log('👥 Raw Attendance Data:');
    
    event.attendance.forEach((att, index) => {
      console.log(`\n${index + 1}. Attendance Record:`);
      console.log(`   userId: ${att.userId} (type: ${typeof att.userId})`);
      console.log(`   userId.toString(): ${att.userId.toString()}`);
      console.log(`   registrationApproved: ${att.registrationApproved}`);
      console.log(`   status: ${att.status}`);
    });

    // Test the exact comparison that the route uses
    const testUserId = '68cb3c22e3a6114fea205498';
    console.log(`\n🔍 Testing with User ID: ${testUserId}`);
    
    const foundAttendance = event.attendance.find(a => a.userId.toString() === testUserId);
    console.log('Found attendance:', !!foundAttendance);
    
    if (foundAttendance) {
      console.log('✅ Attendance found!');
      console.log('Registration Approved:', foundAttendance.registrationApproved);
      console.log('Status:', foundAttendance.status);
    } else {
      console.log('❌ Attendance not found!');
      console.log('Available user IDs:');
      event.attendance.forEach((att, index) => {
        console.log(`  ${index + 1}. ${att.userId.toString()}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📤 Disconnected from Production MongoDB');
  }
}

debugAttendanceFormat();
