// Fix Event schema validation issues
require('dotenv').config();

const fixEventValidationIssues = async () => {
  try {
    console.log('🔧 Fixing Event Validation Issues...\n');
    
    // Connect to database
    const { getLazyConnection } = require('../config/db');
    const isConnected = await getLazyConnection();
    console.log('Database connected:', isConnected ? '✅ Yes' : '❌ No');
    
    if (!isConnected) {
      console.log('❌ Cannot proceed without database connection');
      return;
    }
    
    const Event = require('../models/Event');
    const User = require('../models/User');
    
    console.log('📋 Step 1: Check current events');
    const events = await Event.find({});
    console.log(`   Found ${events.length} events`);
    
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      console.log(`\n🔍 Event ${i + 1}: ${event.title} (${event._id})`);
      
      let needsUpdate = false;
      const updates = {};
      
      // Check if createdBy is missing
      if (!event.createdBy) {
        console.log('   ❌ Missing createdBy field');
        // Find a default admin user
        const adminUser = await User.findOne({ role: 'Admin' });
        if (adminUser) {
          updates.createdBy = adminUser._id;
          console.log(`   ✅ Will set createdBy to: ${adminUser.name} (${adminUser._id})`);
          needsUpdate = true;
        } else {
          console.log('   ❌ No admin user found to set as createdBy');
        }
      } else {
        console.log(`   ✅ createdBy: ${event.createdBy}`);
      }
      
      // Check attendance documentation files
      if (event.attendance && event.attendance.length > 0) {
        console.log(`   📋 Checking ${event.attendance.length} attendance records`);
        
        for (let j = 0; j < event.attendance.length; j++) {
          const attendance = event.attendance[j];
          if (attendance.documentation && attendance.documentation.files) {
            console.log(`     Attendance ${j + 1}: ${attendance.documentation.files.length} files`);
            
            // Check if any files have empty required fields
            const validFiles = attendance.documentation.files.filter(file => 
              file.data && file.contentType && file.filename
            );
            
            if (validFiles.length !== attendance.documentation.files.length) {
              console.log(`     ❌ Found ${attendance.documentation.files.length - validFiles.length} invalid files`);
              
              // Update attendance with only valid files
              if (!updates.attendance) updates.attendance = [...event.attendance];
              updates.attendance[j] = {
                ...attendance,
                documentation: {
                  ...attendance.documentation,
                  files: validFiles
                }
              };
              needsUpdate = true;
              console.log(`     ✅ Will remove invalid files, keeping ${validFiles.length} valid ones`);
            }
          }
        }
      }
      
      // Apply updates if needed
      if (needsUpdate) {
        try {
          console.log('   🔄 Updating event...');
          
          // Use updateOne to avoid validation issues
          const result = await Event.updateOne(
            { _id: event._id },
            { $set: updates }
          );
          
          if (result.modifiedCount > 0) {
            console.log('   ✅ Event updated successfully');
          } else {
            console.log('   ⚠️ No changes made to event');
          }
        } catch (error) {
          console.log(`   ❌ Failed to update event: ${error.message}`);
        }
      } else {
        console.log('   ✅ Event is valid, no updates needed');
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
    
    console.log('\n✅ Event validation issues fixed!');
    
  } catch (error) {
    console.error('❌ Error fixing event validation issues:', error);
  } finally {
    process.exit(0);
  }
};

fixEventValidationIssues();
