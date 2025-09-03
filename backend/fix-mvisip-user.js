const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function fixMvisipUser() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGO_URI environment variable not found!');
      return;
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');
    
    // Get User model
    const User = require('./models/User');
    
    // Find the user
    console.log('🔍 Looking for mvisip.student@ua.edu.ph...');
    const user = await User.findOne({ email: 'mvisip.student@ua.edu.ph' });
    
    if (!user) {
      console.log('❌ User not found. Creating new user...');
      
      // Create new user
      const hashedPassword = await bcrypt.hash('password123', 12);
      const newUser = new User({
        name: 'Mvisip Student',
        email: 'mvisip.student@ua.edu.ph',
        password: hashedPassword,
        role: 'Student',
        isVerified: true,
        isApproved: true,
        approvalStatus: 'approved',
        academicYear: '2024-2025',
        year: '1st Year',
        section: 'A',
        department: 'Computer Science'
      });
      
      await newUser.save();
      console.log('✅ New user created successfully');
      console.log('User ID:', newUser._id);
      
    } else {
      console.log('✅ User found. Fixing password and data...');
      
      // Fix the password
      const hashedPassword = await bcrypt.hash('password123', 12);
      
      // Update user with proper data
      const updatedUser = await User.findByIdAndUpdate(user._id, {
        password: hashedPassword,
        isVerified: true,
        isApproved: true,
        approvalStatus: 'approved',
        // Ensure all required fields are set
        name: user.name || 'Mvisip Student',
        role: user.role || 'Student',
        academicYear: user.academicYear || '2024-2025',
        year: user.year || '1st Year',
        section: user.section || 'A',
        department: user.department || 'Computer Science'
      }, { new: true });
      
      console.log('✅ User updated successfully');
      console.log('User ID:', updatedUser._id);
      console.log('Name:', updatedUser.name);
      console.log('Role:', updatedUser.role);
      console.log('Is Verified:', updatedUser.isVerified);
      console.log('Is Approved:', updatedUser.isApproved);
    }
    
    console.log('\n🔧 Login credentials:');
    console.log('Email: mvisip.student@ua.edu.ph');
    console.log('Password: password123');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from database');
  }
}

fixMvisipUser();
