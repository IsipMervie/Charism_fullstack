// backend/scripts/test-uploadedAt-fix.js
// Test script to verify uploadedAt field fix

const mongoose = require('mongoose');

// Import models
const SchoolSettings = require('../models/SchoolSettings');
const Event = require('../models/Event');
const User = require('../models/User');

// Import database configuration
const { getLazyConnection } = require('../config/db');

// Import the hasFile function to test
const { hasFile } = require('../utils/mongoFileStorage');

async function testUploadedAtFix() {
  try {
    console.log('🧪 Testing uploadedAt field fix...');
    
    // Connect to database
    const isConnected = await getLazyConnection();
    if (!isConnected) {
      console.error('❌ Failed to connect to database');
      return;
    }
    console.log('✅ Database connected');
    
    // Test 1: Test hasFile function with different data types
    console.log('\n📋 Test 1: Testing hasFile function...');
    
    const testCases = [
      { name: 'null', value: null, expected: false },
      { name: 'undefined', value: undefined, expected: false },
      { name: 'empty string', value: '', expected: false },
      { name: 'string value', value: 'test.jpg', expected: false },
      { name: 'number', value: 123, expected: false },
      { name: 'empty object', value: {}, expected: false },
      { name: 'object without data', value: { filename: 'test.jpg' }, expected: false },
      { name: 'object with empty data', value: { data: Buffer.alloc(0) }, expected: false },
      { name: 'valid file object', value: { data: Buffer.alloc(100), contentType: 'image/png' }, expected: true }
    ];
    
    testCases.forEach(testCase => {
      const result = hasFile(testCase.value);
      const status = result === testCase.expected ? '✅' : '❌';
      console.log(`  ${status} ${testCase.name}: ${result} (expected: ${testCase.expected})`);
    });
    
    // Test 2: Check actual database data
    console.log('\n📋 Test 2: Checking database data...');
    
    // Check SchoolSettings
    const schoolSettings = await SchoolSettings.findOne();
    if (schoolSettings) {
      console.log(`  📚 SchoolSettings.logo type: ${typeof schoolSettings.logo}`);
      if (typeof schoolSettings.logo === 'string') {
        console.log(`  ⚠️  Logo still contains string: ${schoolSettings.logo}`);
      } else if (schoolSettings.logo && typeof schoolSettings.logo === 'object') {
        console.log(`  ✅ Logo is object with keys: ${Object.keys(schoolSettings.logo).join(', ')}`);
      } else {
        console.log(`  ℹ️  Logo is: ${schoolSettings.logo}`);
      }
    } else {
      console.log('  ℹ️  No SchoolSettings found');
    }
    
    // Check Events
    const events = await Event.find().limit(3);
    console.log(`  📅 Found ${events.length} events to check`);
    
    events.forEach((event, index) => {
      console.log(`    Event ${index + 1}:`);
      console.log(`      Image type: ${typeof event.image}`);
      if (typeof event.image === 'string') {
        console.log(`      ⚠️  Image still contains string: ${event.image}`);
      } else if (event.image && typeof event.image === 'object') {
        console.log(`      ✅ Image is object with keys: ${Object.keys(event.image).join(', ')}`);
      } else {
        console.log(`      ℹ️  Image is: ${event.image}`);
      }
    });
    
    // Check Users
    const users = await User.find().limit(3);
    console.log(`  👤 Found ${users.length} users to check`);
    
    users.forEach((user, index) => {
      console.log(`    User ${index + 1}:`);
      console.log(`      Profile picture type: ${typeof user.profilePicture}`);
      if (typeof user.profilePicture === 'string') {
        console.log(`      ⚠️  Profile picture still contains string: ${user.profilePicture}`);
      } else if (user.profilePicture && typeof user.profilePicture === 'object') {
        console.log(`      ✅ Profile picture is object with keys: ${Object.keys(user.profilePicture).join(', ')}`);
      } else {
        console.log(`      ℹ️  Profile picture is: ${user.profilePicture}`);
      }
    });
    
    // Test 3: Test controller functions (simulate)
    console.log('\n📋 Test 3: Testing controller logic...');
    
    // Simulate what controllers do
    const testLogo = schoolSettings?.logo;
    let safeLogo = testLogo;
    
    if (typeof testLogo === 'string') {
      console.log('  ⚠️  Logo field contains string, converting to null to prevent errors');
      safeLogo = null;
    }
    
    const logoUrl = hasFile(safeLogo) ? `/api/files/school-logo` : null;
    console.log(`  🔗 Logo URL generated: ${logoUrl}`);
    
    console.log('\n✅ Testing completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    }
    process.exit(0);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testUploadedAtFix();
}

module.exports = { testUploadedAtFix };
