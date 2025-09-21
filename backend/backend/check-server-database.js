// Check what database the server is actually using
const axios = require('axios');

async function checkServerDatabase() {
  try {
    console.log('🔍 Checking what database the production server is using...');
    
    // Test the working registration token route
    const token = 'evt_1758347883290_dz9szfbbr'; // From Trial1 event
    console.log(`Testing token: ${token}`);
    
    try {
      const response = await axios.get(`https://charism-api-xtw9.onrender.com/api/events/working-register/${token}`);
      console.log('✅ Token route working!');
      console.log('📅 Event found:', response.data.title);
      console.log('📋 Event ID:', response.data._id);
      console.log('📋 Public Registration:', response.data.isPublicRegistrationEnabled);
    } catch (error) {
      console.log('❌ Token route failed:', error.response?.status, error.response?.data?.message);
    }

    // Test a simple route to see if server can find the event
    try {
      const response = await axios.get(`https://charism-api-xtw9.onrender.com/api/events/68ce426bd8ff015084ccba63`);
      console.log('✅ Event route working!');
      console.log('📅 Event found:', response.data.title);
      console.log('👥 Attendance count:', response.data.attendance?.length || 0);
    } catch (error) {
      console.log('❌ Event route failed:', error.response?.status, error.response?.data?.message);
    }

    // Test the approval route with detailed error
    try {
      const response = await axios.put(`https://charism-api-xtw9.onrender.com/api/events/working-approve/68ce426bd8ff015084ccba63/68cb3c22e3a6114fea205498`);
      console.log('✅ Approval route working!');
      console.log('📋 Response:', response.data.message);
    } catch (error) {
      console.log('❌ Approval route failed:', error.response?.status);
      console.log('🔍 Error details:', error.response?.data);
      
      // Check if it's a database connection issue
      if (error.response?.data?.message === 'Registration not found.') {
        console.log('\n💡 DIAGNOSIS:');
        console.log('The route is working, but the server cannot find the registration.');
        console.log('This suggests the server is connecting to a different database.');
        console.log('Possible causes:');
        console.log('1. Server is using a different MongoDB connection string');
        console.log('2. Server is using a different database name');
        console.log('3. Server has cached data that is outdated');
        console.log('4. Server environment variables are different');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkServerDatabase();
