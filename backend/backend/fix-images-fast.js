const mongoose = require('mongoose');
const Event = require('./models/Event');
const fs = require('fs');
const path = require('path');

mongoose.connect('mongodb+srv://admin:admin123@ua-database.wzgg1.mongodb.net/charism?retryWrites=true&w=majority&appName=UA-DATABASE');

async function fixImages() {
  try {
    console.log('🚀 Fixing event images...');
    
    // Load default logo
    const logoPath = path.join(__dirname, 'logo.png');
    const logoBuffer = fs.readFileSync(logoPath);
    
    const imageData = {
      data: logoBuffer,
      contentType: 'image/png',
      filename: 'default-logo.png',
      uploadedAt: new Date()
    };
    
    // Update all events with empty image data
    const result = await Event.updateMany(
      { 
        'image.data': { $exists: false } 
      },
      { 
        $set: { image: imageData }
      }
    );
    
    console.log(`✅ Fixed ${result.modifiedCount} events with default images`);
    
    // Also fix events with empty image objects
    const result2 = await Event.updateMany(
      { 
        'image.data': null 
      },
      { 
        $set: { image: imageData }
      }
    );
    
    console.log(`✅ Fixed ${result2.modifiedCount} events with null image data`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixImages();
