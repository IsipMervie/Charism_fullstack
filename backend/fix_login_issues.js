// Script to fix login issues and set up users for testing
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function fixLoginIssues() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/communitylink');
    console.log('✅ Connected to database');

    // Get all users
    const users = await User.find({});
    console.log(`\n👥 Found ${users.length} users in database`);

    if (users.length === 0) {
      console.log('❌ No users found. This is likely why login is failing.');
      console.log('💡 Solution: Register new users through the frontend.');
      return;
    }

    // Check for unverified users
    const unverifiedUsers = users.filter(u => !u.isVerified);
    console.log(`📧 ${unverifiedUsers.length} users have unverified emails`);

    if (unverifiedUsers.length > 0) {
      console.log('\n🔧 FIXING: Auto-verifying all user emails for testing...');
      
      for (const user of unverifiedUsers) {
        user.isVerified = true;
        await user.save();
        console.log(`   ✅ Verified: ${user.email}`);
      }
    }

    // Check for unapproved staff
    const unapprovedStaff = users.filter(u => u.role === 'Staff' && !u.isApproved);
    console.log(`👨‍💼 ${unapprovedStaff.length} staff users need approval`);

    if (unapprovedStaff.length > 0) {
      console.log('\n🔧 FIXING: Auto-approving all staff users for testing...');
      
      for (const user of unapprovedStaff) {
        user.isApproved = true;
        user.approvalStatus = 'approved';
        await user.save();
        console.log(`   ✅ Approved: ${user.email}`);
      }
    }

    // Final status check
    const updatedUsers = await User.find({});
    const loginEligible = updatedUsers.filter(u => 
      u.isVerified && (u.role !== 'Staff' || u.isApproved)
    );

    console.log('\n✅ LOGIN STATUS AFTER FIXES:');
    console.log('============================');
    
    updatedUsers.forEach(user => {
      const canLogin = user.isVerified && (user.role !== 'Staff' || user.isApproved);
      console.log(`${canLogin ? '✅' : '❌'} ${user.email} (${user.role}) - ${canLogin ? 'CAN LOGIN' : 'CANNOT LOGIN'}`);
    });

    console.log(`\n🎉 RESULT: ${loginEligible.length}/${updatedUsers.length} users can now login!`);

    if (loginEligible.length > 0) {
      console.log('\n🚀 TEST ACCOUNTS READY:');
      loginEligible.forEach(user => {
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: Ready to login`);
        console.log('   ---');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

fixLoginIssues();
