// Delete user by email
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const deleteUser = async (email) => {
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
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`❌ No user found with email: ${email}`);
      return;
    }
    
    console.log(`👤 Found user: ${user.name} (${user.email})`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Created: ${user.createdAt}`);
    
    // Delete the user
    await User.deleteOne({ email });
    console.log(`✅ User ${email} deleted successfully`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
};

// Get email from command line argument
const email = process.argv[2];
if (!email) {
  console.log('Usage: node delete-user.js <email>');
  console.log('Example: node delete-user.js test@example.com');
  process.exit(1);
}

deleteUser(email);
