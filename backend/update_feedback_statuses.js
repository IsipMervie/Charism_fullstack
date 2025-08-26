// Script to update existing feedback statuses to new simplified system
require('dotenv').config();
const mongoose = require('mongoose');
const Feedback = require('./models/Feedback');

async function updateFeedbackStatuses() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/communitylink');
    console.log('✅ Connected to database');

    // Get all feedback records
    const allFeedback = await Feedback.find({});
    console.log(`\n📊 Found ${allFeedback.length} feedback records`);

    if (allFeedback.length === 0) {
      console.log('💡 No feedback records to update');
      return;
    }

    // Show current status distribution
    const statusCounts = {};
    allFeedback.forEach(feedback => {
      statusCounts[feedback.status] = (statusCounts[feedback.status] || 0) + 1;
    });

    console.log('\n📈 Current Status Distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} records`);
    });

    // Update statuses
    console.log('\n🔧 Updating feedback statuses...');
    
    let updatedCount = 0;
    
    for (const feedback of allFeedback) {
      let newStatus = feedback.status;
      
      // Map old statuses to new ones
      if (['pending', 'in-progress', 'resolved'].includes(feedback.status)) {
        newStatus = 'open';
        feedback.status = 'open';
        await feedback.save();
        updatedCount++;
        console.log(`   ✅ Updated: ${feedback.subject} (${feedback.status} → open)`);
      }
    }

    console.log(`\n🎉 Update Complete!`);
    console.log(`   Updated ${updatedCount} records`);
    console.log(`   All feedback now uses simplified status system`);

    // Show new status distribution
    const newStatusCounts = {};
    const updatedFeedback = await Feedback.find({});
    updatedFeedback.forEach(feedback => {
      newStatusCounts[feedback.status] = (newStatusCounts[feedback.status] || 0) + 1;
    });

    console.log('\n📊 New Status Distribution:');
    Object.entries(newStatusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} records`);
    });

    console.log('\n✅ Feedback system now uses simplified statuses:');
    console.log('   - open: Active feedback that needs attention');
    console.log('   - closed: Completed feedback');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

updateFeedbackStatuses();
