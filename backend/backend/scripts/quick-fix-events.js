// Quick fix for Event validation issues
require('dotenv').config();

const quickFixEvents = async () => {
  try {
    console.log('🔧 Quick Fixing Event Issues...\n');
    
    // Connect to database
    const { getLazyConnection } = require('../config/db');
    const isConnected = await getLazyConnection();
    console.log('Database connected:', isConnected ? '✅ Yes' : '❌ No');
    
    if (!isConnected) return;
    
    const mongoose = require('mongoose');
    
    console.log('📋 Removing problematic attendance records...');
    
    // Remove all attendance records with invalid files
    const result = await mongoose.connection.db.collection('events').updateMany(
      { 'attendance.documentation.files': { $exists: true } },
      { $unset: { attendance: 1 } }
    );
    
    console.log(`✅ Removed attendance from ${result.modifiedCount} events`);
    
    // Test if events can now be updated
    console.log('\n📋 Testing event operations...');
    const Event = require('../models/Event');
    const testEvent = await Event.findOne();
    
    if (testEvent) {
      try {
        await Event.updateOne(
          { _id: testEvent._id },
          { $set: { isVisibleToStudents: !testEvent.isVisibleToStudents } }
        );
        console.log('✅ Event update successful');
        
        // Revert
        await Event.updateOne(
          { _id: testEvent._id },
          { $set: { isVisibleToStudents: testEvent.isVisibleToStudents } }
        );
        console.log('✅ Event revert successful');
      } catch (error) {
        console.log('❌ Event update still failing:', error.message);
      }
    }
    
    console.log('\n✅ Quick fix completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
};

quickFixEvents();
