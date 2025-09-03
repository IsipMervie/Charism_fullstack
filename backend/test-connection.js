const mongoose = require('mongoose');

async function testConnection() {
  try {
    // Use the correct MongoDB URI from .env file
    const mongoUri = 'mongodb+srv://admin:admin123@ua-database.wzgg1.mongodb.net/charism?retryWrites=true&w=majority&appName=UA-DATABASE';
    
    console.log('Testing connection to production database...');
    console.log('URI:', mongoUri.substring(0, 50) + '...');
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      maxPoolSize: 1,
      minPoolSize: 0,
      maxIdleTimeMS: 10000,
      bufferCommands: true,
      family: 4,
      retryWrites: true,
      retryReads: true,
      w: 'majority',
      autoIndex: false,
      maxConnecting: 1,
      serverApi: {
        version: '1',
        strict: false,
        deprecationErrors: false,
      },
      heartbeatFrequencyMS: 3000,
    });
    
    console.log('✅ Connected to database successfully!');
    
    // Test User model
    const User = require('./models/User');
    const users = await User.find({}).select('email name role').limit(5);
    
    console.log('\n=== Sample Users ===');
    if (users.length === 0) {
      console.log('No users found');
    } else {
      users.forEach(user => {
        console.log(`Email: ${user.email}`);
        console.log(`Name: ${user.name}`);
        console.log(`Role: ${user.role}`);
        console.log('---');
      });
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testConnection();
