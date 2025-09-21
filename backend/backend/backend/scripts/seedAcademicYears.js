// backend/scripts/seedAcademicYears.js

const mongoose = require('mongoose');
const AcademicYear = require('../models/AcademicYear');

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/communitylink';

async function seedAcademicYears() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Clear existing academic years
    await AcademicYear.deleteMany({});
    console.log('Cleared existing academic years');

    // Create default academic years
    const academicYears = [
      {
        year: '2024-2025',
        description: 'Current Academic Year',
        isActive: true,
        startDate: new Date('2024-06-01'),
        endDate: new Date('2025-05-31')
      },
      {
        year: '2023-2024',
        description: 'Previous Academic Year',
        isActive: false,
        startDate: new Date('2023-06-01'),
        endDate: new Date('2024-05-31')
      },
      {
        year: '2022-2023',
        description: 'Past Academic Year',
        isActive: false,
        startDate: new Date('2022-06-01'),
        endDate: new Date('2023-05-31')
      }
    ];

    await AcademicYear.insertMany(academicYears);
    console.log('Academic years seeded successfully');

    // Display created academic years
    const createdYears = await AcademicYear.find().sort({ year: -1 });
    console.log('\nCreated academic years:');
    createdYears.forEach(year => {
      console.log(`- ${year.year}: ${year.description} (${year.isActive ? 'Active' : 'Inactive'})`);
    });

  } catch (error) {
    console.error('Error seeding academic years:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
seedAcademicYears(); 