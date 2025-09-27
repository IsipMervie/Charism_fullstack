// Check users in database
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const checkUsers = async () => {
  try {
    console.log('🔍 Connecting to database...');
    
    const dbURI = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!dbURI) {
      console.error('❌ No MongoDB URI found!');
      return;
    }
    
    await mongoose.connect(dbURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      connectTimeoutMS: 5000,
    });
    
    console.log('✅ Connected to database');
    
    // Check all users
    const users = await User.find({}).select('name email userId role status createdAt');
    console.log(`\n📊 Total users found: ${users.length}`);
    
    if (users.length > 0) {
      console.log('\n👥 Users in database:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. Name: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   User ID: ${user.userId}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('   ---');
      });
    } else {
      console.log('📭 No users found in database');
    }
    
    // Check for specific email
    const testEmail = 'test@example.com'; // Change this to the email you're trying to register
    const existingUser = await User.findOne({ email: testEmail });
    
    if (existingUser) {
      console.log(`\n⚠️ User with email ${testEmail} already exists:`);
      console.log(`   Name: ${existingUser.name}`);
      console.log(`   User ID: ${existingUser.userId}`);
      console.log(`   Status: ${existingUser.status}`);
    } else {
      console.log(`\n✅ No user found with email: ${testEmail}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
};

checkUsers();
