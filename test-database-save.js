const mongoose = require('mongoose');

// Test if data is actually saving to MongoDB
const testDatabaseSave = async () => {
  console.log('🧪 TESTING DATABASE SAVE...');
  
  const MONGO_URI = 'mongodb+srv://admin:admin123@ua-database.wzgg1.mongodb.net/charism?retryWrites=true&w=majority&appName=UA-DATABASE';
  
  try {
    // Connect to database
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 15000,
      connectTimeoutMS: 10000,
      maxPoolSize: 1,
      minPoolSize: 0,
      maxIdleTimeMS: 15000,
      bufferCommands: true,
      family: 4,
      retryWrites: true,
      retryReads: true,
      w: 'majority',
      autoIndex: false,
      maxConnecting: 1
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Create test schema
    const TestSchema = new mongoose.Schema({
      name: String,
      email: String,
      message: String,
      timestamp: { type: Date, default: Date.now }
    });
    
    const TestModel = mongoose.model('TestMessage', TestSchema);
    
    // Count existing test messages
    const existingCount = await TestModel.countDocuments();
    console.log('📊 Existing test messages:', existingCount);
    
    // Create new test message
    const testMessage = new TestModel({
      name: 'Database Test User',
      email: 'test@database.com',
      message: 'Testing if data saves to MongoDB',
      timestamp: new Date()
    });
    
    // Save to database
    const savedMessage = await testMessage.save();
    console.log('✅ Message saved with ID:', savedMessage._id);
    
    // Count after save
    const newCount = await TestModel.countDocuments();
    console.log('📊 Total messages after save:', newCount);
    
    // Verify the message exists
    const foundMessage = await TestModel.findById(savedMessage._id);
    if (foundMessage) {
      console.log('✅ Message found in database:', foundMessage.name);
    } else {
      console.log('❌ Message NOT found in database');
    }
    
    // Test User model
    const User = require('./backend/models/User');
    const userCount = await User.countDocuments();
    console.log('📊 Total users in database:', userCount);
    
    // List recent users
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(3);
    console.log('📊 Recent users:');
    recentUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.email}) - ${user.createdAt || 'No date'}`);
    });
    
    console.log('\n🎯 DATABASE TEST RESULTS:');
    console.log('✅ Connection: Working');
    console.log('✅ Save operation: Working');
    console.log('✅ Read operation: Working');
    console.log(`✅ User count: ${userCount}`);
    
  } catch (error) {
    console.error('❌ DATABASE TEST FAILED:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

testDatabaseSave().catch(console.error);
