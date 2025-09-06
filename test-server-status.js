// Simple server status test
const https = require('https');
const http = require('http');

const testServer = async (url) => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, (res) => {
      const endTime = Date.now();
      resolve({
        success: true,
        statusCode: res.statusCode,
        responseTime: `${endTime - startTime}ms`,
        headers: res.headers
      });
    });
    
    req.on('error', (error) => {
      const endTime = Date.now();
      resolve({
        success: false,
        error: error.message,
        code: error.code,
        responseTime: `${endTime - startTime}ms`
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Request timeout',
        code: 'TIMEOUT',
        responseTime: '10000ms+'
      });
    });
  });
};

const runTests = async () => {
  console.log('🔍 Testing server status...\n');
  
  const tests = [
    'https://charism-api.onrender.com/api/health',
    'https://charism-api.onrender.com/health',
    'https://charism-api.onrender.com/',
    'https://charism-api.onrender.com'
  ];
  
  for (const url of tests) {
    console.log(`📡 Testing: ${url}`);
    const result = await testServer(url);
    
    if (result.success) {
      console.log(`✅ SUCCESS - Status: ${result.statusCode}, Time: ${result.responseTime}`);
    } else {
      console.log(`❌ FAILED - Error: ${result.error}, Code: ${result.code}, Time: ${result.responseTime}`);
    }
    console.log('');
  }
};

runTests().catch(console.error);
