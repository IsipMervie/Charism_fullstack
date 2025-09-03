const mongoose = require('mongoose');
require('dotenv').config();

async function checkUserData() {
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
    
    // Check mvisip.student@ua.edu.ph
    console.log('\n🔍 Checking mvisip.student@ua.edu.ph...');
    const mvisipUser = await User.findOne({ email: 'mvisip.student@ua.edu.ph' });
    
    if (!mvisipUser) {
      console.log('❌ User mvisip.student@ua.edu.ph not found in database');
    } else {
      console.log('✅ User found:');
      console.log('ID:', mvisipUser._id);
      console.log('Name:', mvisipUser.name);
      console.log('Email:', mvisipUser.email);
      console.log('Role:', mvisipUser.role);
      console.log('Is Verified:', mvisipUser.isVerified);
      console.log('Is Approved:', mvisipUser.isApproved);
      console.log('Approval Status:', mvisipUser.approvalStatus);
      console.log('Password field exists:', !!mvisipUser.password);
      console.log('Password length:', mvisipUser.password ? mvisipUser.password.length : 'N/A');
      console.log('Password starts with $2b$:', mvisipUser.password ? mvisipUser.password.startsWith('$2b$') : 'N/A');
      console.log('Created at:', mvisipUser.createdAt);
      console.log('Updated at:', mvisipUser.updatedAt);
      
      // Check for any special characters or encoding issues
      console.log('Email contains special chars:', /[^a-zA-Z0-9@._-]/.test(mvisipUser.email));
      console.log('Name contains special chars:', /[^a-zA-Z0-9\s]/.test(mvisipUser.name));
    }
    
    // Check jampabustan.student@ua.edu.ph for comparison
    console.log('\n🔍 Checking jampabustan.student@ua.edu.ph (working user)...');
    const jampaUser = await User.findOne({ email: 'jampabustan.student@ua.edu.ph' });
    
    if (!jampaUser) {
      console.log('❌ User jampabustan.student@ua.edu.ph not found in database');
    } else {
      console.log('✅ Working user found:');
      console.log('ID:', jampaUser._id);
      console.log('Name:', jampaUser.name);
      console.log('Email:', jampaUser.email);
      console.log('Role:', jampaUser.role);
      console.log('Is Verified:', jampaUser.isVerified);
      console.log('Is Approved:', jampaUser.isApproved);
      console.log('Approval Status:', jampaUser.approvalStatus);
      console.log('Password field exists:', !!jampaUser.password);
      console.log('Password length:', jampaUser.password ? jampaUser.password.length : 'N/A');
      console.log('Password starts with $2b$:', jampaUser.password ? jampaUser.password.startsWith('$2b$') : 'N/A');
      console.log('Created at:', jampaUser.createdAt);
      console.log('Updated at:', jampaUser.updatedAt);
    }
    
    // Check for any users with similar email patterns
    console.log('\n🔍 Checking for users with similar email patterns...');
    const similarUsers = await User.find({
      email: { $regex: /mvisip/, $options: 'i' }
    });
    
    if (similarUsers.length > 0) {
      console.log('Found similar users:');
      similarUsers.forEach(user => {
        console.log(`- ${user.email} (${user.name})`);
      });
    } else {
      console.log('No users with similar email patterns found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from database');
  }
}

checkUserData();
