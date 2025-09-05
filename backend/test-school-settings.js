// Test script to check school settings functionality
const mongoose = require('mongoose');
const SchoolSettings = require('./models/SchoolSettings');

async function testSchoolSettings() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/charism', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Check if school settings exist
    let settings = await SchoolSettings.findOne();
    console.log('Current school settings:', settings);

    if (!settings) {
      console.log('No settings found, creating default...');
      settings = new SchoolSettings({
        schoolName: 'CHARISM Community Link',
        contactEmail: 'ceo@ua.edu.ph',
        logo: null
      });
      await settings.save();
      console.log('Default settings created');
    } else {
      console.log('Settings found:');
      console.log('- School Name:', settings.schoolName);
      console.log('- Contact Email:', settings.contactEmail);
      console.log('- Logo:', settings.logo ? 'Present' : 'Not set');
    }

    // Test public settings format
    const publicSettings = {
      schoolName: settings.schoolName || 'CHARISM Community Link',
      contactEmail: settings.contactEmail || '',
      logo: settings.logo || '',
    };
    
    console.log('\nPublic settings format:');
    console.log(JSON.stringify(publicSettings, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testSchoolSettings();
