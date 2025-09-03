const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Test configuration
const API_BASE_URL = 'http://localhost:5000/api';
const TEST_USER_ID = '68b3e0c8f5cc8903ff854bc4'; // Use the user ID from the logs
const TEST_TOKEN = 'your-test-token-here'; // You'll need to get a valid token

async function testProfilePictureUpload() {
  try {
    console.log('🧪 Testing Profile Picture Upload...');
    console.log('API URL:', API_BASE_URL);
    console.log('User ID:', TEST_USER_ID);
    
    // Create a test image file (1x1 pixel PNG)
    const testImagePath = path.join(__dirname, 'test-image.png');
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
      0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC, 0x33,
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    fs.writeFileSync(testImagePath, testImageBuffer);
    console.log('✅ Test image created:', testImagePath);
    
    // Create FormData
    const formData = new FormData();
    formData.append('profilePicture', fs.createReadStream(testImagePath), {
      filename: 'test-image.png',
      contentType: 'image/png'
    });
    
    console.log('📦 FormData created');
    console.log('FormData entries:');
    // In Node.js, we can't easily iterate FormData entries, so just confirm it was created
    console.log('- FormData created successfully with profilePicture field');
    
    // Make the request
    const response = await axios.post(
      `${API_BASE_URL}/users/${TEST_USER_ID}/profile-picture`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${TEST_TOKEN}`
        },
        timeout: 10000
      }
    );
    
    console.log('✅ Upload successful!');
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
    // Clean up
    fs.unlinkSync(testImagePath);
    console.log('🧹 Test image cleaned up');
    
  } catch (error) {
    console.error('❌ Upload failed!');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Response headers:', error.response.headers);
    }
    
    if (error.request) {
      console.error('Request details:', error.request);
    }
  }
}

// Run the test
testProfilePictureUpload();
