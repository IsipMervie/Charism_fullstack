const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login...');
    
    // Try with a Student user to test different roles
    const credentials = {
      email: 'mtsgarcia.student@ua.edu.ph',  // Student user from database
      password: 'password123'                // Try common password
    };
    
    console.log(`Attempting login with email: ${credentials.email}`);
    
    const response = await axios.post('https://charism-api.onrender.com/api/auth/login', credentials, {
      timeout: 10000
    });
    
    console.log('✅ Login successful!');
    console.log('Token:', response.data.token);
    console.log('User ID:', response.data.user._id);
    console.log('User Name:', response.data.user.name);
    console.log('User Role:', response.data.user.role);
    
    // Save token to a file for easy access
    const fs = require('fs');
    fs.writeFileSync('token.txt', response.data.token);
    console.log('Token saved to token.txt');
    
    // Also save user info
    fs.writeFileSync('user-info.txt', JSON.stringify({
      id: response.data.user._id,
      email: response.data.user.email,
      name: response.data.user.name,
      role: response.data.user.role
    }, null, 2));
    console.log('User info saved to user-info.txt');
    
  } catch (error) {
    console.error('❌ Login failed:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    
    if (error.response?.status === 400 && error.response?.data?.message === 'User not found') {
      console.log('\n💡 Tip: Run "node list-users.js" to see available users in the database');
    } else if (error.response?.status === 401) {
      console.log('\n💡 Tip: Password might be incorrect. Try resetting the password.');
    }
  }
}

testLogin();