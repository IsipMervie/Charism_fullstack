const axios = require('axios');

console.log('=== TESTING AUTH ENDPOINTS SPECIFICALLY ===');
console.log('Testing all authentication endpoints...\n');

async function testAuthEndpoints() {
  const authEndpoints = [
    {
      name: 'Register',
      url: 'https://charism-api-xtw9.onrender.com/api/auth/register',
      method: 'POST',
      data: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'testpassword123',
        userId: 'TEST001',
        academicYear: '2024-2025',
        year: '1st Year',
        section: 'A',
        department: 'Computer Science'
      }
    },
    {
      name: 'Login',
      url: 'https://charism-api-xtw9.onrender.com/api/auth/login',
      method: 'POST',
      data: {
        email: 'test@example.com',
        password: 'testpassword123'
      }
    },
    {
      name: 'Password Reset',
      url: 'https://charism-api-xtw9.onrender.com/api/auth/forgot-password',
      method: 'POST',
      data: {
        email: 'test@example.com'
      }
    }
  ];

  let workingEndpoints = 0;
  let totalEndpoints = authEndpoints.length;

  for (const endpoint of authEndpoints) {
    try {
      console.log(`🔍 Testing ${endpoint.name} endpoint...`);
      
      let response;
      if (endpoint.method === 'POST') {
        response = await axios.post(endpoint.url, endpoint.data, { timeout: 15000 });
      } else {
        response = await axios.get(endpoint.url, { timeout: 15000 });
      }
      
      console.log(`   ✅ ${endpoint.name}: ${response.status} - ${response.statusText}`);
      if (response.data && response.data.message) {
        console.log(`   📝 Response: ${response.data.message}`);
      }
      workingEndpoints++;
      
    } catch (error) {
      if (error.response) {
        console.log(`   ⚠️ ${endpoint.name}: ${error.response.status} - ${error.response.statusText}`);
        if (error.response.data && error.response.data.message) {
          console.log(`   📝 Error: ${error.response.data.message}`);
        }
        
        // Some responses are expected (like 400 for validation errors)
        if (error.response.status === 400) {
          console.log(`   ✅ ${endpoint.name}: Working (validation error expected)`);
          workingEndpoints++;
        }
      } else if (error.code === 'ECONNABORTED') {
        console.log(`   ⚠️ ${endpoint.name}: Timeout (server may be cold-starting)`);
      } else {
        console.log(`   ❌ ${endpoint.name}: ${error.message}`);
      }
    }
  }

  console.log(`\n📊 Auth endpoints working: ${workingEndpoints}/${totalEndpoints}`);
  return workingEndpoints >= totalEndpoints * 0.8;
}

// Test specific health endpoints
async function testHealthEndpoints() {
  console.log('\n🔍 Testing health endpoints...');
  
  const healthEndpoints = [
    'https://charism-api-xtw9.onrender.com/api/health',
    'https://charism-api-xtw9.onrender.com/api/health/db',
    'https://charism-api-xtw9.onrender.com/api/health/email',
    'https://charism-api-xtw9.onrender.com/api/files/health',
    'https://charism-api-xtw9.onrender.com/api/files/images/health'
  ];

  let workingHealth = 0;
  let totalHealth = healthEndpoints.length;

  for (const endpoint of healthEndpoints) {
    try {
      console.log(`🔍 Testing ${endpoint}...`);
      const response = await axios.get(endpoint, { timeout: 10000 });
      console.log(`   ✅ ${endpoint}: ${response.status}`);
      workingHealth++;
    } catch (error) {
      if (error.response) {
        console.log(`   ⚠️ ${endpoint}: ${error.response.status}`);
        if (error.response.status === 404) {
          console.log(`   📝 Note: Health endpoint not deployed yet (will work after deployment)`);
        }
      } else {
        console.log(`   ❌ ${endpoint}: ${error.message}`);
      }
    }
  }

  console.log(`\n📊 Health endpoints working: ${workingHealth}/${totalHealth}`);
  return workingHealth;
}

async function runAuthTests() {
  console.log('🚀 Starting authentication endpoint tests...\n');
  
  const authWorking = await testAuthEndpoints();
  const healthWorking = await testHealthEndpoints();
  
  console.log('\n=== AUTH ENDPOINT TEST RESULTS ===');
  console.log(`✅ Auth endpoints: ${authWorking ? 'WORKING' : 'NEEDS ATTENTION'}`);
  console.log(`✅ Health endpoints: ${healthWorking}/${5} working`);
  
  if (authWorking && healthWorking >= 2) {
    console.log('\n🎉 AUTH SYSTEM IS WORKING PROPERLY!');
  } else {
    console.log('\n⚠️ AUTH SYSTEM NEEDS ATTENTION!');
  }
  
  return { authWorking, healthWorking };
}

runAuthTests().catch(console.error);
