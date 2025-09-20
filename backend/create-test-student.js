// Create a test student user
const mongoose = require('mongoose');
const User = require('./models/User');

async function createTestStudent() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/charism');
    console.log('✅ Connected to MongoDB');

    // Check if test student already exists
    const existingStudent = await User.findOne({ email: 'teststudent@charism.edu.ph' });
    
    if (existingStudent) {
      console.log('✅ Test student already exists:', existingStudent.name, '(ID:', existingStudent._id + ')');
      return existingStudent;
    }

    // Create test student
    const testStudent = new User({
      name: 'Test Student',
      email: 'teststudent@charism.edu.ph',
      password: 'password123', // This will be hashed
      role: 'Student',
      department: 'BSIT',
      academicYear: '2024-2025',
      year: '3rd Year',
      section: 'A',
      communityServiceHours: 0,
      profilePicture: null
    });

    await testStudent.save();
    console.log('✅ Test student created successfully!');
    console.log('📋 Name:', testStudent.name);
    console.log('📋 Email:', testStudent.email);
    console.log('📋 ID:', testStudent._id);
    console.log('📋 Role:', testStudent.role);

    return testStudent;

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📤 Disconnected from MongoDB');
  }
}

createTestStudent();
