// backend/scripts/fix-uploadedAt-fields-direct.js
// Direct database migration script to fix uploadedAt field issues
// This bypasses Mongoose model loading to avoid the uploadedAt error

const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config();

// Helper function to determine content type from filename
function getContentTypeFromFilename(filename) {
  if (!filename) return 'application/octet-stream';
  
  const ext = filename.toLowerCase().split('.').pop();
  const contentTypeMap = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    'csv': 'text/csv'
  };
  
  return contentTypeMap[ext] || 'application/octet-stream';
}

// Helper function to convert string to file object
function convertStringToFileObject(stringValue, fieldName) {
  if (!stringValue || typeof stringValue !== 'string') {
    return null;
  }
  
  return {
    data: null, // We can't recover the actual file data
    contentType: getContentTypeFromFilename(stringValue),
    filename: stringValue,
    originalName: stringValue,
    uploadedAt: new Date(),
    fileSize: 0,
    description: `Migrated from legacy ${fieldName} field`
  };
}

async function fixUploadedAtFieldsDirect() {
  try {
    console.log('🔧 Starting direct uploadedAt field migration...');
    
    // Connect to MongoDB directly
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGO_URI not found in environment variables');
      return;
    }
    
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected successfully');
    
    const db = mongoose.connection.db;
    let totalFixed = 0;
    let totalErrors = 0;
    
    // Fix SchoolSettings.logo field using direct database operations
    console.log('\n📚 Fixing SchoolSettings.logo field...');
    try {
      const schoolSettingsCollection = db.collection('schoolsettings');
      const schoolSettings = await schoolSettingsCollection.find({}).toArray();
      let fixedSchoolSettings = 0;
      
      for (const setting of schoolSettings) {
        if (typeof setting.logo === 'string' && setting.logo) {
          console.log(`  Processing SchoolSettings logo: ${setting.logo}`);
          
          const convertedLogo = convertStringToFileObject(setting.logo, 'logo');
          if (convertedLogo) {
            await schoolSettingsCollection.updateOne(
              { _id: setting._id },
              { $set: { logo: convertedLogo } }
            );
            fixedSchoolSettings++;
            console.log(`  ✅ Fixed SchoolSettings logo`);
          }
        }
      }
      console.log(`✅ Fixed ${fixedSchoolSettings} SchoolSettings documents`);
      totalFixed += fixedSchoolSettings;
    } catch (error) {
      console.error(`  ❌ Error fixing SchoolSettings:`, error.message);
      totalErrors++;
    }
    
    // Fix Event.image field using direct database operations
    console.log('\n📅 Fixing Event.image field...');
    try {
      const eventsCollection = db.collection('events');
      const events = await eventsCollection.find({}).toArray();
      let fixedEvents = 0;
      
      for (const event of events) {
        if (typeof event.image === 'string' && event.image) {
          console.log(`  Processing Event image: ${event.image}`);
          
          const convertedImage = convertStringToFileObject(event.image, 'image');
          if (convertedImage) {
            await eventsCollection.updateOne(
              { _id: event._id },
              { $set: { image: convertedImage } }
            );
            fixedEvents++;
            console.log(`  ✅ Fixed Event image`);
          }
        }
      }
      console.log(`✅ Fixed ${fixedEvents} Event documents`);
      totalFixed += fixedEvents;
    } catch (error) {
      console.error(`  ❌ Error fixing Events:`, error.message);
      totalErrors++;
    }
    
    // Fix User.profilePicture field using direct database operations
    console.log('\n👤 Fixing User.profilePicture field...');
    try {
      const usersCollection = db.collection('users');
      const users = await usersCollection.find({}).toArray();
      let fixedUsers = 0;
      
      for (const user of users) {
        if (typeof user.profilePicture === 'string' && user.profilePicture) {
          console.log(`  Processing User profile picture: ${user.profilePicture}`);
          
          const convertedProfilePicture = convertStringToFileObject(user.profilePicture, 'profilePicture');
          if (convertedProfilePicture) {
            await usersCollection.updateOne(
              { _id: user._id },
              { $set: { profilePicture: convertedProfilePicture } }
            );
            fixedUsers++;
            console.log(`  ✅ Fixed User profile picture`);
          }
        }
      }
      console.log(`✅ Fixed ${fixedUsers} User documents`);
      totalFixed += fixedUsers;
    } catch (error) {
      console.error(`  ❌ Error fixing Users:`, error.message);
      totalErrors++;
    }
    
    // Summary
    console.log('\n📊 Migration Summary:');
    console.log(`  Total: ${totalFixed} fields fixed, ${totalErrors} errors`);
    
    if (totalErrors === 0) {
      console.log('\n🎉 Migration completed successfully with no errors!');
    } else {
      console.log('\n⚠️  Migration completed with some errors. Check the logs above.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
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

// Run the migration if this script is executed directly
if (require.main === module) {
  fixUploadedAtFieldsDirect();
}

module.exports = { fixUploadedAtFieldsDirect };
