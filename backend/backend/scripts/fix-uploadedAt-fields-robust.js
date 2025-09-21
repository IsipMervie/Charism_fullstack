// backend/scripts/fix-uploadedAt-fields-robust.js
// Robust migration script to fix uploadedAt field issues

const mongoose = require('mongoose');

// Import models
const SchoolSettings = require('../models/SchoolSettings');
const Event = require('../models/Event');
const User = require('../models/User');

// Import database configuration
const { getLazyConnection } = require('../config/db');

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

// Helper function to safely convert string to object
function convertStringToFileObject(stringValue, fieldName) {
  if (!stringValue || typeof stringValue !== 'string') {
    return null;
  }
  
  // Check if it's already an object
  if (typeof stringValue === 'object' && stringValue !== null) {
    return stringValue;
  }
  
  // Convert string to proper object structure
  return {
    data: null, // We can't recover the actual file data
    contentType: getContentTypeFromFilename(stringValue),
    filename: stringValue,
    originalName: stringValue, // Use the string as both filename and original name
    uploadedAt: new Date(),
    fileSize: 0, // Unknown file size
    description: `Migrated from legacy ${fieldName} field`
  };
}

// Helper function to safely update document
async function safeUpdateDocument(document, fieldName, newValue, modelName) {
  try {
    if (newValue === null) {
      // If conversion failed, set to null to avoid future errors
      document[fieldName] = null;
      console.log(`  ⚠️  Setting ${fieldName} to null (conversion failed)`);
    } else {
      document[fieldName] = newValue;
      console.log(`  ✅ Converting ${fieldName} from string to object`);
    }
    
    await document.save();
    return true;
  } catch (saveError) {
    console.error(`  ❌ Failed to save ${modelName} document:`, saveError.message);
    return false;
  }
}

async function fixUploadedAtFields() {
  try {
    console.log('🔧 Starting robust uploadedAt field migration...');
    
    // Connect to database
    const isConnected = await getLazyConnection();
    if (!isConnected) {
      console.error('❌ Failed to connect to database');
      return;
    }
    console.log('✅ Database connected');
    
    let totalFixed = 0;
    let totalErrors = 0;
    
    // Fix SchoolSettings.logo field
    console.log('\n📚 Fixing SchoolSettings.logo field...');
    const schoolSettings = await SchoolSettings.find({});
    let fixedSchoolSettings = 0;
    let errorsSchoolSettings = 0;
    
    for (const setting of schoolSettings) {
      try {
        if (typeof setting.logo === 'string' && setting.logo) {
          console.log(`  Processing SchoolSettings logo: ${setting.logo}`);
          
          const convertedLogo = convertStringToFileObject(setting.logo, 'logo');
          const success = await safeUpdateDocument(setting, 'logo', convertedLogo, 'SchoolSettings');
          
          if (success) {
            fixedSchoolSettings++;
          } else {
            errorsSchoolSettings++;
          }
        }
      } catch (error) {
        console.error(`  ❌ Error processing SchoolSettings:`, error.message);
        errorsSchoolSettings++;
      }
    }
    console.log(`✅ Fixed ${fixedSchoolSettings} SchoolSettings documents (${errorsSchoolSettings} errors)`);
    
    // Fix Event.image field
    console.log('\n📅 Fixing Event.image field...');
    const events = await Event.find({});
    let fixedEvents = 0;
    let errorsEvents = 0;
    
    for (const event of events) {
      try {
        if (typeof event.image === 'string' && event.image) {
          console.log(`  Processing Event image: ${event.image}`);
          
          const convertedImage = convertStringToFileObject(event.image, 'image');
          const success = await safeUpdateDocument(event, 'image', convertedImage, 'Event');
          
          if (success) {
            fixedEvents++;
          } else {
            errorsEvents++;
          }
        }
      } catch (error) {
        console.error(`  ❌ Error processing Event:`, error.message);
        errorsEvents++;
      }
    }
    console.log(`✅ Fixed ${fixedEvents} Event documents (${errorsEvents} errors)`);
    
    // Fix User.profilePicture field
    console.log('\n👤 Fixing User.profilePicture field...');
    const users = await User.find({});
    let fixedUsers = 0;
    let errorsUsers = 0;
    
    for (const user of users) {
      try {
        if (typeof user.profilePicture === 'string' && user.profilePicture) {
          console.log(`  Processing User profile picture: ${user.profilePicture}`);
          
          const convertedProfilePicture = convertStringToFileObject(user.profilePicture, 'profilePicture');
          const success = await safeUpdateDocument(user, 'profilePicture', convertedProfilePicture, 'User');
          
          if (success) {
            fixedUsers++;
          } else {
            errorsUsers++;
          }
        }
      } catch (error) {
        console.error(`  ❌ Error processing User:`, error.message);
        errorsUsers++;
      }
    }
    console.log(`✅ Fixed ${fixedUsers} User documents (${errorsUsers} errors)`);
    
    // Calculate totals
    totalFixed = fixedSchoolSettings + fixedEvents + fixedUsers;
    totalErrors = errorsSchoolSettings + errorsEvents + errorsUsers;
    
    // Summary
    console.log('\n📊 Migration Summary:');
    console.log(`  SchoolSettings: ${fixedSchoolSettings} fixed, ${errorsSchoolSettings} errors`);
    console.log(`  Events: ${fixedEvents} fixed, ${errorsEvents} errors`);
    console.log(`  Users: ${fixedUsers} fixed, ${errorsUsers} errors`);
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
  fixUploadedAtFields();
}

module.exports = { fixUploadedAtFields };
