const mongoose = require('mongoose');
require('dotenv').config();

async function verifyUser() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGO_URI environment variable not found!');
      return;
    }
    
    await mongoose.connect(mongoUri);
    console.log('Connected to database');
    
    const User = require('./models/User');
    
    // Verify the Student user
    const email = 'mtsgarcia.student@ua.edu.ph';
    
    const result = await User.findOneAndUpdate(
      { email: email },
      { 
        isVerified: true,
        isApproved: true,
        approvalStatus: 'approved'
      }
    );
    
    if (result) {
      console.log(`✅ User verified successfully: ${email}`);
      console.log('User can now log in');
    } else {
      console.log(`❌ User with email ${email} not found`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

verifyUser();
