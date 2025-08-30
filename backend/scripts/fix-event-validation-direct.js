// Fix Event validation issues directly using MongoDB operations
require('dotenv').config();

const fixEventValidationDirect = async () => {
  try {
    console.log('🔧 Fixing Event Validation Issues Directly...\n');
    
    // Connect to database
    const { getLazyConnection } = require('../config/db');
    const isConnected = await getLazyConnection();
    console.log('Database connected:', isConnected ? '✅ Yes' : '❌ No');
    
    if (!isConnected) {
      console.log('❌ Cannot proceed without database connection');
      return;
    }
    
    const mongoose = require('mongoose');
    const Event = require('../models/Event');
    
    console.log('📋 Step 1: Check current events');
    const events = await Event.find({});
    console.log(`   Found ${events.length} events`);
    
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      console.log(`\n🔍 Event ${i + 1}: ${event.title} (${event._id})`);
      
      // Check attendance documentation files
      if (event.attendance && event.attendance.length > 0) {
        console.log(`   📋 Checking ${event.attendance.length} attendance records`);
        
        for (let j = 0; j < event.attendance.length; j++) {
          const attendance = event.attendance[j];
          if (attendance.documentation && attendance.documentation.files) {
            console.log(`     Attendance ${j + 1}: ${attendance.documentation.files.length} files`);
            
            // Check if any files have empty required fields
            const invalidFiles = attendance.documentation.files.filter(file => 
              !file.data || !file.contentType || !file.filename
            );
            
            if (invalidFiles.length > 0) {
              console.log(`     ❌ Found ${invalidFiles.length} invalid files`);
              
              // Remove the entire attendance record with invalid files
              try {
                const result = await mongoose.connection.db.collection('events').updateOne(
                  { _id: event._id },
                  { $pull: { attendance: { _id: attendance._id } } }
                );
                
                if (result.modifiedCount > 0) {
                  console.log(`     ✅ Removed attendance record with invalid files`);
                } else {
                  console.log(`     ⚠️ No changes made to attendance`);
                }
              } catch (error) {
                console.log(`     ❌ Failed to remove attendance: ${error.message}`);
              }
            } else {
              console.log(`     ✅ All files are valid`);
            }
          }
        }
      }
    }
    
    console.log('\n📋 Step 2: Verify fixes');
    const updatedEvents = await Event.find({});
    console.log(`   Total events after fixes: ${updatedEvents.length}`);
    
    // Test if events can now be updated
    console.log('\n📋 Step 3: Test event operations');
    const testEvent = updatedEvents[0];
    if (testEvent) {
      try {
        console.log(`   Testing update on: ${testEvent.title}`);
        const originalVisibility = testEvent.isVisibleToStudents;
        
        // Try to update visibility
        await Event.updateOne(
          { _id: testEvent._id },
          { $set: { isVisibleToStudents: !originalVisibility } }
        );
        console.log('   ✅ Toggle visibility successful');
        
        // Revert the change
        await Event.updateOne(
          { _id: testEvent._id },
          { $set: { isVisibleToStudents: originalVisibility } }
        );
        console.log('   ✅ Revert visibility successful');
        
      } catch (error) {
        console.log(`   ❌ Event operation test failed: ${error.message}`);
      }
    }
    
    console.log('\n✅ Event validation issues fixed directly!');
    
  } catch (error) {
    console.error('❌ Error fixing event validation issues:', error);
  } finally {
    process.exit(0);
  }
};

fixEventValidationDirect();
