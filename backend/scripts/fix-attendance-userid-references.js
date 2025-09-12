const mongoose = require('mongoose');
const Event = require('../models/Event');
const User = require('../models/User');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/communitylink', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Fix attendance records with invalid userId references
const fixAttendanceUserIds = async () => {
  try {
    console.log('🔍 Starting attendance userId reference cleanup...');
    
    // Get all events
    const events = await Event.find({});
    console.log(`📊 Found ${events.length} events to check`);
    
    let totalFixed = 0;
    let totalRemoved = 0;
    
    for (const event of events) {
      console.log(`\n🔍 Checking event: ${event.title} (${event._id})`);
      console.log(`   Attendance records: ${event.attendance.length}`);
      
      const validAttendanceRecords = [];
      let eventFixed = 0;
      let eventRemoved = 0;
      
      for (const attendance of event.attendance) {
        if (!attendance.userId) {
          console.log(`   ⚠️ Removing attendance record with no userId: ${attendance._id}`);
          eventRemoved++;
          continue;
        }
        
        // Check if userId is a valid ObjectId string
        if (typeof attendance.userId === 'string') {
          if (attendance.userId.length === 24) {
            // Try to find the user
            const user = await User.findById(attendance.userId);
            if (user) {
              console.log(`   ✅ Found user for attendance record: ${user.name} (${user.email})`);
              validAttendanceRecords.push(attendance);
            } else {
              console.log(`   ❌ User not found for attendance record: ${attendance.userId}`);
              eventRemoved++;
            }
          } else {
            console.log(`   ❌ Invalid ObjectId format: ${attendance.userId}`);
            eventRemoved++;
          }
        } else if (typeof attendance.userId === 'object' && attendance.userId._id) {
          // Already populated, check if user exists
          const user = await User.findById(attendance.userId._id);
          if (user) {
            console.log(`   ✅ User exists for populated attendance record: ${user.name} (${user.email})`);
            validAttendanceRecords.push(attendance);
          } else {
            console.log(`   ❌ User not found for populated attendance record: ${attendance.userId._id}`);
            eventRemoved++;
          }
        } else {
          console.log(`   ❌ Invalid userId type: ${typeof attendance.userId}`);
          eventRemoved++;
        }
      }
      
      if (eventRemoved > 0 || eventFixed > 0) {
        console.log(`   📝 Updating event with ${validAttendanceRecords.length} valid records (removed ${eventRemoved})`);
        event.attendance = validAttendanceRecords;
        await event.save();
        eventFixed++;
      }
      
      totalFixed += eventFixed;
      totalRemoved += eventRemoved;
    }
    
    console.log(`\n✅ Cleanup completed!`);
    console.log(`   Events fixed: ${totalFixed}`);
    console.log(`   Attendance records removed: ${totalRemoved}`);
    
  } catch (error) {
    console.error('❌ Error fixing attendance records:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await fixAttendanceUserIds();
  await mongoose.connection.close();
  console.log('✅ Database connection closed');
  process.exit(0);
};

main().catch(console.error);
