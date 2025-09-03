const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

async function testUpload() {
  try {
    console.log('Testing profile picture upload...');
    
    // Read token and user info from saved files
    let token, userId;
    try {
      token = fs.readFileSync('token.txt', 'utf8').trim();
      const userInfo = JSON.parse(fs.readFileSync('user-info.txt', 'utf8'));
      userId = userInfo.id;
      console.log(`Using token for user: ${userInfo.name} (${userInfo.email})`);
    } catch (error) {
      console.error('❌ Token or user info not found. Please run "node test-login.js" first.');
      return;
    }
    
    // Create a simple test image (or use an existing one)
    const testImagePath = './test-image.png';
    
    // Check if test image exists, if not create a simple one
    if (!fs.existsSync(testImagePath)) {
      console.log('Creating test image...');
      // Create a simple 1x1 PNG image
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
        0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x63, 0xF8, 0xCF, 0xCF, 0x00,
        0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB0, 0x00, 0x00, 0x00,
        0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
      fs.writeFileSync(testImagePath, pngBuffer);
      console.log('Test image created successfully');
    }

    const formData = new FormData();
    formData.append('profilePicture', fs.createReadStream(testImagePath), {
      filename: 'test-image.png',
      contentType: 'image/png'
    });

    console.log(`Uploading to: https://charism-api.onrender.com/api/users/${userId}/profile-picture`);

    // Test with the production API
    const response = await axios.post(`https://charism-api.onrender.com/api/users/${userId}/profile-picture`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${token}`
      },
      timeout: 30000
    });

    console.log('✅ Upload successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('❌ Upload failed:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    
    if (error.response?.status === 400) {
      console.log('\n🔍 Common 400 errors:');
      console.log('- File too large (max 5MB)');
      console.log('- Invalid file type (only images allowed)');
      console.log('- Missing file in request');
      console.log('- Authentication issues');
    }
  }
}

testUpload();