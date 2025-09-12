const mongoose = require('mongoose');
const Event = require('./models/Event');
const User = require('./models/User');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/CommunityLink', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const debugParticipants = async () => {
  try {
    console.log('🔍 Debugging participants...');
    
    // Get all events
    const events = await Event.find({});
    console.log(`📊 Found ${events.length} events`);
    
    for (const event of events) {
      console.log(`\n🔍 Event: ${event.title} (${event._id})`);
      console.log(`   Raw attendance count: ${event.attendance.length}`);
      
      if (event.attendance.length > 0) {
        // Test the exact same logic as the API
        const populatedEvent = await Event.findById(event._id)
          .populate('attendance.userId', 'name email department academicYear year section role profilePicture');
        
        const validAttendanceRecords = populatedEvent.attendance.filter(att => {
          if (!att.userId) {
            console.log('   ⚠️ No userId:', att._id);
            return false;
          }
          
          if (typeof att.userId === 'object' && att.userId.name) {
            return true;
          }
          
          if (typeof att.userId === 'string' && att.userId.length === 24) {
            console.log('   ⚠️ Unpopulated userId:', att._id, att.userId);
            return false;
          }
          
          return false;
        });
        
        console.log(`   Valid records: ${validAttendanceRecords.length}`);
        
        const participants = validAttendanceRecords.map(att => ({
          _id: att.userId._id,
          name: att.userId.name || 'Unknown User',
          email: att.userId.email || 'No email provided',
          role: att.userId.role || 'Student'
        }));
        
        console.log(`   Final participants: ${participants.length}`);
        participants.forEach((p, i) => {
          console.log(`     ${i+1}. ${p.name} (${p.email}) - ${p.role}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

const main = async () => {
  await connectDB();
  await debugParticipants();
  await mongoose.connection.close();
  console.log('✅ Done');
  process.exit(0);
};

main().catch(console.error);
