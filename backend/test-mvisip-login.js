const axios = require('axios');

async function testMvisipLogin() {
  try {
    console.log('🔍 Testing login for mvisip.student@ua.edu.ph...');
    
    const credentials = {
      email: 'mvisip.student@ua.edu.ph',
      password: 'password123'  // Try common password
    };
    
    console.log(`📧 Attempting login with email: ${credentials.email}`);
    
    const response = await axios.post('https://charism-api.onrender.com/api/auth/login', credentials, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login successful!');
    console.log('Token:', response.data.token);
    console.log('User ID:', response.data.user._id);
    console.log('User Name:', response.data.user.name);
    console.log('User Role:', response.data.user.role);
    console.log('Is Verified:', response.data.user.isVerified);
    console.log('Is Approved:', response.data.user.isApproved);
    
  } catch (error) {
    console.error('❌ Login failed for mvisip.student@ua.edu.ph:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    
    if (error.response?.status === 500) {
      console.log('\n🔧 500 Error Analysis:');
      console.log('- This indicates a server-side error');
      console.log('- Could be database connection issue');
      console.log('- Could be bcrypt password comparison issue');
      console.log('- Could be JWT token generation issue');
      console.log('- Could be user data corruption');
    } else if (error.response?.status === 400 && error.response?.data?.message === 'User not found') {
      console.log('\n💡 User not found in database');
    } else if (error.response?.status === 401) {
      console.log('\n💡 Authentication failed - check password or verification status');
    }
  }
}

// Also test the working user for comparison
async function testWorkingUser() {
  try {
    console.log('\n🔍 Testing login for jampabustan.student@ua.edu.ph (working user)...');
    
    const credentials = {
      email: 'jampabustan.student@ua.edu.ph',
      password: 'password123'
    };
    
    const response = await axios.post('https://charism-api.onrender.com/api/auth/login', credentials, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Working user login successful!');
    console.log('User ID:', response.data.user._id);
    console.log('User Role:', response.data.user.role);
    
  } catch (error) {
    console.error('❌ Working user login also failed:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
  }
}

async function runTests() {
  await testMvisipLogin();
  await testWorkingUser();
}

runTests();
