const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/communitylink', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Feedback = require('./models/Feedback');

const updateFeedbackStatuses = async () => {
  try {
    console.log('🔄 Starting feedback status update...');
    
    // Update existing feedback records
    const result = await Feedback.updateMany(
      { status: { $in: ['open', 'closed'] } },
      [
        {
          $set: {
            status: {
              $switch: {
                branches: [
                  { case: { $eq: ['$status', 'open'] }, then: 'pending' },
                  { case: { $eq: ['$status', 'closed'] }, then: 'resolve' }
                ],
                default: 'pending'
              }
            }
          }
        }
      ]
    );

    console.log(`✅ Updated ${result.modifiedCount} feedback records`);
    
    // Show current status distribution
    const stats = await Feedback.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\n📊 Current status distribution:');
    stats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count}`);
    });

    console.log('\n🎉 Feedback status update completed successfully!');
    
  } catch (error) {
    console.error('❌ Error updating feedback statuses:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the update
updateFeedbackStatuses();
