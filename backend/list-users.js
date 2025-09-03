const mongoose = require('mongoose');
require('dotenv').config();

async function listUsers() {
  try {
    // Connect to database using the correct environment variable
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGO_URI environment variable not found!');
      console.log('💡 Make sure you have a .env file with MONGO_URI set');
      return;
    }
    
    await mongoose.connect(mongoUri);
    console.log('Connected to database');
    
    // Get User model
    const User = require('./models/User');
    
    // Find all users
    const users = await User.find({}).select('email name role');
    console.log('\n=== Users in Database ===');
    if (users.length === 0) {
      console.log('No users found in database');
    } else {
      users.forEach(user => {
        console.log(`Email: ${user.email}`);
        console.log(`Name: ${user.name}`);
        console.log(`Role: ${user.role}`);
        console.log('---');
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

listUsers();
