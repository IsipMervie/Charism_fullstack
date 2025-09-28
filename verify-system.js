const http = require('http');
const https = require('https');

console.log('🔍 COMPREHENSIVE SYSTEM VERIFICATION');
console.log('=====================================\n');

// Test backend server
function testBackend() {
  return new Promise((resolve) => {
    console.log('Testing Backend Server (localhost:10000)...');
    const req = http.get('http://localhost:10000/api/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('✅ Backend Server: RUNNING');
          console.log('   Status:', result.status);
          console.log('   Message:', result.message);
          console.log('   Version:', result.version);
          resolve(true);
        } catch (e) {
          console.log('❌ Backend Server: ERROR - Invalid response');
          resolve(false);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Backend Server: NOT RUNNING');
      console.log('   Error:', err.message);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ Backend Server: TIMEOUT');
      req.destroy();
      resolve(false);
    });
  });
}

// Test frontend server
function testFrontend() {
  return new Promise((resolve) => {
    console.log('\nTesting Frontend Server (localhost:3000)...');
    const req = http.get('http://localhost:3000', (res) => {
      console.log('✅ Frontend Server: RUNNING');
      console.log('   Status Code:', res.statusCode);
      resolve(true);
    });
    
    req.on('error', (err) => {
      console.log('❌ Frontend Server: NOT RUNNING');
      console.log('   Error:', err.message);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ Frontend Server: TIMEOUT');
      req.destroy();
      resolve(false);
    });
  });
}

// Test Render deployment
function testRender() {
  return new Promise((resolve) => {
    console.log('\nTesting Render Deployment...');
    const req = https.get('https://charism-api-xtw9.onrender.com/api/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('✅ Render Backend: RUNNING');
          console.log('   Status:', result.status);
          console.log('   Message:', result.message);
          resolve(true);
        } catch (e) {
          console.log('❌ Render Backend: ERROR - Invalid response');
          resolve(false);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Render Backend: NOT ACCESSIBLE');
      console.log('   Error:', err.message);
      resolve(false);
    });
    
    req.setTimeout(10000, () => {
      console.log('❌ Render Backend: TIMEOUT');
      req.destroy();
      resolve(false);
    });
  });
}

// Test database connection
function testDatabase() {
  return new Promise((resolve) => {
    console.log('\nTesting Database Connection...');
    const req = http.get('http://localhost:10000/api/db-status', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.database && result.database.status === 'connected') {
            console.log('✅ Database: CONNECTED');
            console.log('   Host:', result.database.host);
            console.log('   Name:', result.database.name);
            console.log('   Ping:', result.database.ping);
            resolve(true);
          } else {
            console.log('❌ Database: NOT CONNECTED');
            resolve(false);
          }
        } catch (e) {
          console.log('❌ Database: ERROR - Invalid response');
          resolve(false);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Database: CONNECTION FAILED');
      console.log('   Error:', err.message);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ Database: TIMEOUT');
      req.destroy();
      resolve(false);
    });
  });
}

async function runVerification() {
  console.log('Starting system verification...\n');
  
  const backendOk = await testBackend();
  const frontendOk = await testFrontend();
  const renderOk = await testRender();
  const databaseOk = await testDatabase();
  
  console.log('\n📊 FINAL SYSTEM STATUS:');
  console.log('========================');
  console.log('Backend (Local):', backendOk ? '✅ RUNNING' : '❌ FAILED');
  console.log('Frontend (Local):', frontendOk ? '✅ RUNNING' : '❌ FAILED');
  console.log('Database (MongoDB):', databaseOk ? '✅ CONNECTED' : '❌ FAILED');
  console.log('Render (Production):', renderOk ? '✅ RUNNING' : '❌ FAILED');
  
  console.log('\n🎯 SYSTEM HEALTH:');
  if (backendOk && frontendOk && databaseOk) {
    console.log('🎉 EXCELLENT! Your local system is fully operational!');
    console.log('✅ All core services are running');
    console.log('✅ Database is connected');
    console.log('✅ API endpoints are responding');
    console.log('\n🌐 Access your application at: http://localhost:3000');
  } else if (backendOk && databaseOk) {
    console.log('⚠️ Backend is working, but frontend needs to be started');
    console.log('💡 Run: cd frontend && npm start');
  } else {
    console.log('❌ Some issues detected. Check the errors above.');
  }
  
  if (renderOk) {
    console.log('✅ Production deployment on Render is also working!');
  }
}

runVerification().catch(console.error);
