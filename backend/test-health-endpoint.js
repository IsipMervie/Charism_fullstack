#!/usr/bin/env node

// Test script to diagnose health endpoint issues
const http = require('http');
const https = require('https');

const testHealthEndpoint = (url, description) => {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    console.log(`\n🔍 Testing ${description}: ${url}`);
    
    const req = client.get(url, (res) => {
      console.log(`📊 Status: ${res.statusCode}`);
      console.log(`📋 Headers:`, res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log(`✅ Response:`, jsonData);
          resolve({ success: true, status: res.statusCode, data: jsonData });
        } catch (parseError) {
          console.log(`❌ Parse error:`, parseError.message);
          console.log(`📄 Raw response:`, data);
          resolve({ success: false, status: res.statusCode, error: parseError.message, rawData: data });
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Request error:`, error.message);
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      console.log(`⏰ Request timeout`);
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
};

const main = async () => {
  console.log('🚀 Health Endpoint Test Script');
  console.log('===============================');
  
  const baseUrls = [
    'http://localhost:5000',
    'https://charism-server-ua-backend.vercel.app'
  ];
  
  for (const baseUrl of baseUrls) {
    try {
      await testHealthEndpoint(`${baseUrl}/`, 'Root Endpoint');
      await testHealthEndpoint(`${baseUrl}/api/health`, 'Health Endpoint');
      await testHealthEndpoint(`${baseUrl}/api/status`, 'Status Endpoint');
      await testHealthEndpoint(`${baseUrl}/api/test`, 'Test Endpoint');
      await testHealthEndpoint(`${baseUrl}/api/frontend-test`, 'Frontend Test Endpoint');
    } catch (error) {
      console.log(`❌ Failed to test ${baseUrl}:`, error.message);
    }
  }
  
  console.log('\n✅ Testing complete!');
};

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testHealthEndpoint };
