const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function resetPassword() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGO_URI environment variable not found!');
      console.log('💡 Make sure you have a .env file with MONGO_URI set');
      return;
    }
    
    await mongoose.connect(mongoUri);
    console.log('Connected to database');
    
    const User = require('./models/User');
    
    // Reset password for the Student user
    const email = 'mtsgarcia.student@ua.edu.ph'; // Student user from database
    const newPassword = 'password123';
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const result = await User.findOneAndUpdate(
      { email: email },
      { password: hashedPassword }
    );
    
    if (result) {
      console.log(`✅ Password reset successfully for ${email}`);
      console.log(`New password: ${newPassword}`);
    } else {
      console.log(`❌ User with email ${email} not found`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

resetPassword();
