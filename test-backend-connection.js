// Test script to check backend connection
const https = require('https');

const testBackend = async () => {
  console.log('🔍 Testing backend connection...');
  
  const testUrl = 'https://charism.vercel.app/api/health';
  
  return new Promise((resolve, reject) => {
    const req = https.get(testUrl, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('✅ Backend is accessible!');
        console.log('Status:', res.statusCode);
        console.log('Response:', data);
        resolve({ status: res.statusCode, data: data });
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Backend connection failed:', error.message);
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      console.log('❌ Request timeout');
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
};

// Run the test
testBackend()
  .then(result => {
    console.log('\n🎉 Backend is working!');
    console.log('You can now try logging in.');
  })
  .catch(error => {
    console.log('\n💥 Backend is not accessible');
    console.log('Error:', error.message);
    console.log('\nPossible solutions:');
    console.log('1. Check if your backend is deployed to Vercel');
    console.log('2. Check if the environment variables are set correctly');
    console.log('3. Check if the MongoDB connection is working');
  });
