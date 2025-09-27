const mongoose = require('mongoose');

// Create database indexes for better performance
const createIndexes = async () => {
  try {
    console.log('🔧 Creating database indexes...');
    
    // User indexes
    if (mongoose.models.User) {
      await mongoose.models.User.collection.createIndex({ email: 1 }, { unique: true });
      await mongoose.models.User.collection.createIndex({ userId: 1 });
      await mongoose.models.User.collection.createIndex({ role: 1 });
      await mongoose.models.User.collection.createIndex({ approvalStatus: 1 });
      console.log('✅ User indexes created');
    }
    
    // Event indexes
    if (mongoose.models.Event) {
      await mongoose.models.Event.collection.createIndex({ createdBy: 1 });
      await mongoose.models.Event.collection.createIndex({ date: 1 });
      await mongoose.models.Event.collection.createIndex({ status: 1 });
      await mongoose.models.Event.collection.createIndex({ 'attendance.userId': 1 });
      console.log('✅ Event indexes created');
    }
    
    // Message indexes
    if (mongoose.models.Message) {
      await mongoose.models.Message.collection.createIndex({ email: 1 });
      await mongoose.models.Message.collection.createIndex({ createdAt: -1 });
      await mongoose.models.Message.collection.createIndex({ read: 1 });
      console.log('✅ Message indexes created');
    }
    
    // Feedback indexes
    if (mongoose.models.Feedback) {
      await mongoose.models.Feedback.collection.createIndex({ email: 1 });
      await mongoose.models.Feedback.collection.createIndex({ createdAt: -1 });
      console.log('✅ Feedback indexes created');
    }
    
    console.log('✅ All database indexes created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating database indexes:', error.message);
    return false;
  }
};

module.exports = {
  createIndexes
};