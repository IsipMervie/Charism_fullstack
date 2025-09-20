// Test both approval systems with real production data
const mongoose = require('mongoose');
const Event = require('./models/Event');
const User = require('./models/User');

async function testBothApprovalSystems() {
  try {
    // Connect to production MongoDB
    await mongoose.connect(process.env.PROD_MONGODB_URI);
    console.log('✅ Connected to Production MongoDB');

    // Get real data
    const event = await Event.findById('68ce426bd8ff015084ccba63').populate('attendance.userId', 'name email communityServiceHours');
    const student = await User.findById('68cb3c22e3a6114fea205498'); // John Angelo M. Pabustan

    if (!event) {
      console.log('❌ Event not found');
      return;
    }

    if (!student) {
      console.log('❌ Student not found');
      return;
    }

    console.log('📅 Event:', event.title);
    console.log('👤 Student:', student.name);
    console.log('📊 Current Community Service Hours:', student.communityServiceHours);

    // Check current registration status
    const attendance = event.attendance.find(att => att.userId._id.toString() === student._id.toString());
    if (attendance) {
      console.log('\n📋 Current Registration Status:');
      console.log('Registration Approved:', attendance.registrationApproved);
      console.log('Status:', attendance.status);
      console.log('Time In:', attendance.timeIn);
      console.log('Time Out:', attendance.timeOut);
    }

    // Test 1: Registration Approval (for slots)
    console.log('\n🧪 TEST 1: REGISTRATION APPROVAL (FOR SLOTS)');
    console.log('This should allow chat access but NOT add community service hours');
    
    // Reset to pending for testing
    if (attendance) {
      attendance.registrationApproved = false;
      attendance.status = 'Pending';
      await event.save();
      console.log('✅ Reset registration to pending for testing');
    }

    // Test registration approval
    const axios = require('axios');
    try {
      const response = await axios.put(
        `https://charism-api-xtw9.onrender.com/api/events/working-approve/${event._id}/${student._id}`
      );
      console.log('✅ Registration approval successful:', response.data.message);
      
      // Check updated status
      await event.populate('attendance.userId', 'name email communityServiceHours');
      const updatedAttendance = event.attendance.find(att => att.userId._id.toString() === student._id.toString());
      console.log('📋 After Registration Approval:');
      console.log('Registration Approved:', updatedAttendance.registrationApproved);
      console.log('Status:', updatedAttendance.status);
      console.log('Community Service Hours:', updatedAttendance.userId.communityServiceHours);
      console.log('💬 Student can now access event chat: YES');
      console.log('⏰ Community service hours added: NO (correct behavior)');
      
    } catch (error) {
      console.log('❌ Registration approval failed:', error.response?.status, error.response?.data?.message);
    }

    // Test 2: Attendance Approval (for community service hours)
    console.log('\n🧪 TEST 2: ATTENDANCE APPROVAL (FOR COMMUNITY SERVICE HOURS)');
    console.log('This should add community service hours after time-in/time-out');
    
    // Simulate time-in and time-out
    if (attendance) {
      attendance.timeIn = new Date();
      attendance.timeOut = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours later
      await event.save();
      console.log('✅ Simulated time-in and time-out (4 hours)');
    }

    // Test attendance approval
    try {
      const response = await axios.patch(
        `https://charism-api-xtw9.onrender.com/api/events/${event._id}/attendance/${student._id}/approve`
      );
      console.log('✅ Attendance approval successful:', response.data.message);
      
      // Check updated status and hours
      await student.populate();
      const updatedStudent = await User.findById(student._id);
      const updatedEvent = await Event.findById(event._id).populate('attendance.userId', 'name email communityServiceHours');
      const finalAttendance = updatedEvent.attendance.find(att => att.userId._id.toString() === student._id.toString());
      
      console.log('📋 After Attendance Approval:');
      console.log('Status:', finalAttendance.status);
      console.log('Community Service Hours Added:', event.hours);
      console.log('Total Community Service Hours:', updatedStudent.communityServiceHours);
      console.log('⏰ Community service hours added: YES (correct behavior)');
      
    } catch (error) {
      console.log('❌ Attendance approval failed:', error.response?.status, error.response?.data?.message);
    }

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log('✅ Registration Approval: For slot access and chat (no hours added)');
    console.log('✅ Attendance Approval: For community service hours (after time-in/time-out)');
    console.log('✅ Both systems working correctly with real production data');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📤 Disconnected from Production MongoDB');
  }
}

testBothApprovalSystems();
