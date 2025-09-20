// Script to create a test event with a specific registration token
const mongoose = require('mongoose');
const Event = require('./models/Event');
const User = require('./models/User');

// Connect to database
const connectDB = async () => {
  try {
    const { getLazyConnection } = require('./config/db');
    await getLazyConnection();
    console.log('✅ Connected to database');
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
};

// Create test event
const createTestEvent = async () => {
  try {
    console.log('🔍 Creating test event...');
    
    // First, check if a test event already exists with this token
    const existingEvent = await Event.findOne({ 
      publicRegistrationToken: 'evt_68ce426bd8ff015084ccba63_1758347899119' 
    });
    
    if (existingEvent) {
      console.log('✅ Test event already exists:', existingEvent.title);
      console.log('📋 Event details:', {
        id: existingEvent._id,
        title: existingEvent.title,
        token: existingEvent.publicRegistrationToken,
        enabled: existingEvent.isPublicRegistrationEnabled,
        status: existingEvent.status
      });
      return existingEvent;
    }
    
    // Find an admin user to be the creator
    const adminUser = await User.findOne({ role: 'Admin' });
    if (!adminUser) {
      console.log('⚠️ No admin user found, creating a test admin user...');
      const testAdmin = new User({
        name: 'Test Admin',
        email: 'testadmin@example.com',
        password: 'testpassword123',
        role: 'Admin',
        userId: 'TEST_ADMIN_001'
      });
      await testAdmin.save();
      console.log('✅ Test admin user created');
    }
    
    const creator = adminUser || await User.findOne({ role: 'Admin' });
    
    // Create test event with the specific token
    const testEvent = new Event({
      title: 'Test Event for Registration Token',
      description: 'This is a test event created for testing the registration token endpoint.',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      startTime: '09:00',
      endTime: '17:00',
      location: 'Test Location',
      hours: 8,
      maxParticipants: 50,
      department: 'Computer Science',
      departments: ['Computer Science'],
      isForAllDepartments: false,
      status: 'Active',
      isVisibleToStudents: true,
      createdBy: creator._id,
      requiresApproval: false,
      publicRegistrationToken: 'evt_68ce426bd8ff015084ccba63_1758347899119', // The exact token from the test
      isPublicRegistrationEnabled: true // Enable public registration
    });
    
    await testEvent.save();
    console.log('✅ Test event created successfully!');
    console.log('📋 Event details:', {
      id: testEvent._id,
      title: testEvent.title,
      token: testEvent.publicRegistrationToken,
      enabled: testEvent.isPublicRegistrationEnabled,
      status: testEvent.status,
      date: testEvent.date,
      location: testEvent.location
    });
    
    return testEvent;
    
  } catch (error) {
    console.error('❌ Error creating test event:', error.message);
    throw error;
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await createTestEvent();
    console.log('\n🎯 Test event setup complete!');
    console.log('You can now run the endpoint tests.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
};

// Run the script
main();
