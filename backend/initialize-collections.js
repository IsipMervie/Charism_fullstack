// Initialize all MongoDB collections
const mongoose = require('mongoose');

// Load all models
require('./models/Section');
require('./models/YearLevel');
require('./models/Department');
require('./models/AcademicYear');
require('./models/User');
require('./models/Event');
require('./models/Message');
require('./models/Feedback');

async function initializeCollections() {
  try {
    console.log('🔄 Initializing MongoDB collections...');
    
    // Get database connection
    const { getLazyConnection } = require('./config/db');
    const isConnected = await getLazyConnection();
    
    if (!isConnected) {
      console.log('❌ Database not connected');
      return;
    }
    
    // Create collections by inserting default data
    const Section = mongoose.model('Section');
    const YearLevel = mongoose.model('YearLevel');
    const Department = mongoose.model('Department');
    const AcademicYear = mongoose.model('AcademicYear');
    
    // Check if collections exist, if not create them
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log('📊 Existing collections:', collectionNames);
    
    // Create default sections if none exist
    const sectionCount = await Section.countDocuments();
    if (sectionCount === 0) {
      console.log('📝 Creating default sections...');
      await Section.insertMany([
        { name: 'A', isActive: true },
        { name: 'B', isActive: true },
        { name: 'C', isActive: true }
      ]);
    }
    
    // Create default year levels if none exist
    const yearLevelCount = await YearLevel.countDocuments();
    if (yearLevelCount === 0) {
      console.log('📝 Creating default year levels...');
      await YearLevel.insertMany([
        { name: '1st Year', isActive: true },
        { name: '2nd Year', isActive: true },
        { name: '3rd Year', isActive: true },
        { name: '4th Year', isActive: true }
      ]);
    }
    
    // Create default departments if none exist
    const departmentCount = await Department.countDocuments();
    if (departmentCount === 0) {
      console.log('📝 Creating default departments...');
      await Department.insertMany([
        { name: 'Computer Science', isActive: true },
        { name: 'Information Technology', isActive: true },
        { name: 'Business Administration', isActive: true },
        { name: 'Education', isActive: true }
      ]);
    }
    
    // Create default academic year if none exist
    const academicYearCount = await AcademicYear.countDocuments();
    if (academicYearCount === 0) {
      console.log('📝 Creating default academic year...');
      await AcademicYear.create({
        year: '2024-2025',
        name: '2024-2025',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2025-05-31'),
        isActive: true
      });
    }
    
    // List all collections after initialization
    const updatedCollections = await mongoose.connection.db.listCollections().toArray();
    const updatedCollectionNames = updatedCollections.map(c => c.name);
    
    console.log('✅ Collections after initialization:', updatedCollectionNames);
    console.log('🎉 Collection initialization complete!');
    
  } catch (error) {
    console.error('❌ Error initializing collections:', error);
  }
}

// Run initialization
initializeCollections().then(() => {
  console.log('✅ Initialization script completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Initialization failed:', error);
  process.exit(1);
});
