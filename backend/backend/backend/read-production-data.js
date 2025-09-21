// Read real data from PRODUCTION MongoDB
const mongoose = require('mongoose');
const Event = require('./models/Event');
const User = require('./models/User');

async function readProductionData() {
  try {
    // Try to connect to production MongoDB
    // You'll need to provide the production MongoDB URI
    const prodUri = process.env.PROD_MONGODB_URI || process.env.MONGODB_URI;
    
    console.log('🔗 Attempting to connect to:', prodUri ? 'Production MongoDB' : 'Local MongoDB');
    
    await mongoose.connect(prodUri || 'mongodb://localhost:27017/charism');
    console.log('✅ Connected to MongoDB');

    // 1. Read all users
    console.log('\n👥 ALL USERS IN PRODUCTION:');
    const users = await User.find().select('name email role department year academicYear');
    console.log(`Total users: ${users.length}`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Role: ${user.role}, Department: ${user.department}, Year: ${user.year}`);
    });

    // 2. Read all events
    console.log('\n📅 ALL EVENTS IN PRODUCTION:');
    const events = await Event.find().select('title _id status isPublicRegistrationEnabled publicRegistrationToken attendance');
    console.log(`Total events: ${events.length}`);
    
    events.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title} (ID: ${event._id})`);
      console.log(`   Status: ${event.status}, Public Reg: ${event.isPublicRegistrationEnabled}`);
      console.log(`   Token: ${event.publicRegistrationToken}`);
      console.log(`   Attendance count: ${event.attendance.length}`);
      
      // Show attendance details
      if (event.attendance.length > 0) {
        console.log('   👥 Attendance:');
        event.attendance.forEach((att, attIndex) => {
          console.log(`     ${attIndex + 1}. User ID: ${att.userId}, Status: ${att.status}, Approved: ${att.registrationApproved}`);
        });
      }
      console.log('');
    });

    // 3. Find events with pending registrations
    console.log('\n⏳ EVENTS WITH PENDING REGISTRATIONS IN PRODUCTION:');
    const eventsWithPending = await Event.find({
      'attendance.registrationApproved': false,
      'attendance.status': 'Pending'
    }).populate('attendance.userId', 'name email').select('title _id attendance');

    if (eventsWithPending.length > 0) {
      eventsWithPending.forEach(event => {
        console.log(`📅 ${event.title} (ID: ${event._id})`);
        const pendingRegistrations = event.attendance.filter(att => 
          att.registrationApproved === false && att.status === 'Pending'
        );
        
        pendingRegistrations.forEach((reg, index) => {
          console.log(`  ${index + 1}. ${reg.userId?.name || 'Unknown'} (${reg.userId?.email || 'No email'})`);
          console.log(`     User ID: ${reg.userId?._id || reg.userId}`);
          console.log(`     Status: ${reg.status}, Registration Approved: ${reg.registrationApproved}`);
        });
        console.log('');
      });
    } else {
      console.log('❌ No events with pending registrations found in production');
    }

    // 4. Summary
    console.log('\n📊 PRODUCTION SUMMARY:');
    console.log(`👥 Total Users: ${users.length}`);
    console.log(`🎓 Students: ${users.filter(u => u.role === 'Student').length}`);
    console.log(`👨‍💼 Staff/Admin: ${users.filter(u => u.role !== 'Student').length}`);
    console.log(`📅 Total Events: ${events.length}`);
    console.log(`⏳ Events with Pending Registrations: ${eventsWithPending.length}`);

    // 5. Show connection info
    console.log('\n🔗 CONNECTION INFO:');
    console.log(`Database: ${mongoose.connection.db.databaseName}`);
    console.log(`Host: ${mongoose.connection.host}`);
    console.log(`Port: ${mongoose.connection.port}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 If this is local data, you may need to:');
    console.log('1. Set PROD_MONGODB_URI environment variable');
    console.log('2. Or provide the production MongoDB connection string');
  } finally {
    await mongoose.disconnect();
    console.log('\n📤 Disconnected from MongoDB');
  }
}

readProductionData();
