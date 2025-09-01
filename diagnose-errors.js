// Diagnostic script to help identify system issues
const https = require('https');

const testEndpoints = async () => {
  console.log('🔍 Starting system diagnostics...\n');
  
  const baseUrl = 'https://charism.vercel.app';
  const endpoints = [
    '/api/health',
    '/api/health-quick', 
    '/api/status',
    '/api/db-status',
    '/api/test-db-simple'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${baseUrl}${endpoint}`);
      
      const result = await new Promise((resolve, reject) => {
        const req = https.get(`${baseUrl}${endpoint}`, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            resolve({
              status: res.statusCode,
              data: data,
              headers: res.headers
            });
          });
        });
        
        req.on('error', (error) => {
          reject(error);
        });
        
        req.setTimeout(10000, () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
      });
      
      console.log(`✅ Status: ${result.status}`);
      console.log(`📄 Response: ${result.data.substring(0, 200)}...`);
      console.log('---\n');
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      console.log('---\n');
    }
  }
};

const checkFrontend = async () => {
  console.log('🌐 Testing frontend accessibility...\n');
  
  try {
    const result = await new Promise((resolve, reject) => {
      const req = https.get('https://charism.vercel.app', (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            contentType: res.headers['content-type'],
            dataLength: data.length
          });
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
    
    console.log(`✅ Frontend Status: ${result.status}`);
    console.log(`📄 Content-Type: ${result.contentType}`);
    console.log(`📏 Data Length: ${result.dataLength} bytes`);
    
    if (result.status === 200) {
      console.log('✅ Frontend is accessible');
    } else {
      console.log('⚠️ Frontend returned non-200 status');
    }
    
  } catch (error) {
    console.log(`❌ Frontend Error: ${error.message}`);
  }
};

const checkEnvironment = () => {
  console.log('\n🔧 Environment Check:\n');
  
  const checks = [
    { name: 'Node.js Version', value: process.version },
    { name: 'Platform', value: process.platform },
    { name: 'Architecture', value: process.arch },
    { name: 'Current Directory', value: process.cwd() }
  ];
  
  checks.forEach(check => {
    console.log(`${check.name}: ${check.value}`);
  });
};

const main = async () => {
  console.log('🚀 CHARISM Community Link - System Diagnostics\n');
  console.log('=' .repeat(50));
  
  await checkEnvironment();
  console.log('\n' + '=' .repeat(50));
  
  await checkFrontend();
  console.log('\n' + '=' .repeat(50));
  
  await testEndpoints();
  
  console.log('🎯 Diagnostic Summary:');
  console.log('1. If all endpoints return 200 OK - Backend is working');
  console.log('2. If endpoints fail - Check Vercel deployment');
  console.log('3. If frontend fails - Check frontend build');
  console.log('4. If database endpoints fail - Check MongoDB connection');
  console.log('\n💡 Next Steps:');
  console.log('- Check Vercel dashboard for deployment status');
  console.log('- Verify environment variables are set');
  console.log('- Check MongoDB connection string');
  console.log('- Review Vercel function logs');
};

// Run diagnostics
main().catch(console.error);
