// Emergency fix script for 500 errors
const https = require('https');

const testSpecificEndpoints = async () => {
  console.log('🚨 EMERGENCY DIAGNOSTIC - Testing specific failing endpoints\n');
  
  const baseUrl = 'https://charism.vercel.app';
  const criticalEndpoints = [
    '/api/health',
    '/api/test-settings',
    '/api/settings/public/school',
    '/api/db-status'
  ];

  for (const endpoint of criticalEndpoints) {
    try {
      console.log(`🔍 Testing: ${baseUrl}${endpoint}`);
      
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
        
        req.setTimeout(15000, () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
      });
      
      if (result.status === 200) {
        console.log(`✅ Status: ${result.status} - WORKING`);
      } else if (result.status === 500) {
        console.log(`❌ Status: ${result.status} - SERVER ERROR`);
        console.log(`📄 Error Response: ${result.data.substring(0, 300)}...`);
      } else {
        console.log(`⚠️ Status: ${result.status} - UNEXPECTED`);
      }
      console.log('---\n');
      
    } catch (error) {
      console.log(`💥 Error: ${error.message}`);
      console.log('---\n');
    }
  }
};

const checkVercelStatus = async () => {
  console.log('🌐 Checking Vercel deployment status...\n');
  
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
            dataLength: data.length,
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
    
    console.log(`✅ Frontend Status: ${result.status}`);
    console.log(`📏 Data Length: ${result.dataLength} bytes`);
    
    if (result.status === 200) {
      console.log('✅ Frontend is accessible');
    } else {
      console.log('❌ Frontend has issues');
    }
    
  } catch (error) {
    console.log(`❌ Frontend Error: ${error.message}`);
  }
};

const provideSolutions = () => {
  console.log('\n🎯 EMERGENCY SOLUTIONS:\n');
  console.log('1. 🔄 IMMEDIATE ACTIONS:');
  console.log('   - Go to Vercel Dashboard → Functions → Check logs');
  console.log('   - Look for any recent deployment errors');
  console.log('   - Check if environment variables are still set');
  console.log('   - Try redeploying the project');
  
  console.log('\n2. 🔧 QUICK FIXES:');
  console.log('   - Clear browser cache completely');
  console.log('   - Try incognito/private browsing mode');
  console.log('   - Test on different browser');
  console.log('   - Check if MongoDB connection is still valid');
  
  console.log('\n3. 🚨 IF STILL BROKEN:');
  console.log('   - Check MongoDB Atlas (if using) - connection might be down');
  console.log('   - Verify all environment variables in Vercel');
  console.log('   - Check if Vercel account has any issues');
  console.log('   - Consider rolling back to previous deployment');
  
  console.log('\n4. 📞 GET HELP:');
  console.log('   - Check Vercel status page: https://vercel-status.com/');
  console.log('   - Check MongoDB status if using Atlas');
  console.log('   - Review Vercel function logs for specific errors');
};

const main = async () => {
  console.log('🚨 CHARISM Community Link - EMERGENCY DIAGNOSTIC\n');
  console.log('=' .repeat(60));
  
  await checkVercelStatus();
  console.log('\n' + '=' .repeat(60));
  
  await testSpecificEndpoints();
  console.log('=' .repeat(60));
  
  provideSolutions();
  
  console.log('\n💡 NEXT STEPS:');
  console.log('1. Run this script to see which endpoints are failing');
  console.log('2. Check Vercel dashboard for deployment issues');
  console.log('3. Verify environment variables are still set');
  console.log('4. Check MongoDB connection if using external database');
  console.log('5. Try redeploying if everything looks correct');
};

// Run emergency diagnostic
main().catch(console.error);
