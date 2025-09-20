const mongoose = require('mongoose');
const Event = require('./models/Event');
const User = require('./models/User');

async function testRegistrationAPI() {
  try {
    await mongoose.connect('mongodb+srv://admin:admin123@ua-database.wzgg1.mongodb.net/charism?retryWrites=true&w=majority&appName=UA-DATABASE');
    console.log('✅ Connected to database');
    
    // Get the Hello 3 event
    const hello3Event = await Event.findOne({ title: /hello 3/i })
      .populate('attendance.userId', 'name email role department academicYear year section');
    
    if (!hello3Event) {
      console.log('❌ Hello 3 event not found');
      return;
    }
    
    console.log(`✅ Found Hello 3 event: ${hello3Event._id}`);
    console.log(`📊 Registrations count: ${hello3Event.attendance.length}`);
    
    if (hello3Event.attendance.length > 0) {
      console.log('\n📋 Registrations:');
      hello3Event.attendance.forEach((reg, index) => {
        console.log(`   ${index + 1}. ${reg.userId.name}`);
        console.log(`      Email: ${reg.userId.email}`);
        console.log(`      Status: ${reg.status}`);
        console.log(`      Approved: ${reg.registrationApproved}`);
        console.log(`      Registered At: ${reg.registeredAt}`);
        console.log('');
      });
    } else {
      console.log('❌ No registrations found');
    }
    
    // Test the API response format
    console.log('🔍 Testing API response format...');
    const apiResponse = hello3Event.attendance || [];
    console.log('📤 API Response:', JSON.stringify(apiResponse, null, 2));
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testRegistrationAPI();
