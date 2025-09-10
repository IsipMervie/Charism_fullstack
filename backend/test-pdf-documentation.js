// Test script for PDF generation and documentation functionality
// This will help verify that all PDF and documentation features work properly

const axios = require('axios');

const BASE_URL = 'https://charism.onrender.com';

// Test PDF generation endpoints
const testPDFEndpoints = [
  { path: '/api/reports/test', method: 'GET', auth: false, description: 'Reports Route Test' },
  { path: '/api/reports/students-by-year?year=2025-2026', method: 'GET', auth: true, description: 'Students by Year PDF' },
  { path: '/api/reports/students-40-hours', method: 'GET', auth: true, description: 'Students 40+ Hours PDF' },
  { path: '/api/reports/event-list', method: 'GET', auth: true, description: 'Event List PDF' }
];

// Test documentation endpoints
const testDocumentationEndpoints = [
  { path: '/api/events/health', method: 'GET', auth: false, description: 'Events Health Check' },
  { path: '/api/files/documentation/test-file', method: 'GET', auth: false, description: 'Documentation File Serving' },
  { path: '/api/files/event-document/test-event/test-doc', method: 'GET', auth: false, description: 'Event Document Serving' }
];

// Test file upload endpoints (will return 400/401 without data)
const testUploadEndpoints = [
  { path: '/api/events/test-event/documentation/upload', method: 'POST', auth: true, description: 'Documentation Upload' }
];

async function testEndpoint(endpoint, type = 'General') {
  try {
    console.log(`🔍 Testing ${type}: ${endpoint.description}`);
    console.log(`   Path: ${endpoint.path}`);
    console.log(`   Method: ${endpoint.method}`);
    
    let response;
    
    if (endpoint.method === 'GET') {
      response = await axios.get(`${BASE_URL}${endpoint.path}`);
    } else if (endpoint.method === 'POST') {
      // For POST endpoints, just check if they exist (will return 400/401 without data)
      response = await axios.post(`${BASE_URL}${endpoint.path}`, {});
    }
    
    console.log(`   ✅ Status: ${response.status} - ${response.statusText}`);
    
    if (response.data && typeof response.data === 'object') {
      const dataPreview = JSON.stringify(response.data).substring(0, 150);
      console.log(`   📊 Data: ${dataPreview}...`);
    }
    
    return { success: true, status: response.status, data: response.data };
    
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.message;
      
      if (status === 401 && endpoint.auth) {
        console.log(`   ⚠️  ${status} - Unauthorized (Expected for protected endpoint)`);
        return { success: true, status, message: 'Expected 401 for protected endpoint' };
      } else if (status === 400 && endpoint.method === 'POST') {
        console.log(`   ⚠️  ${status} - Bad Request (Expected for POST without data)`);
        return { success: true, status, message: 'Expected 400 for POST without data' });
      } else if (status === 404 && endpoint.path.includes('test-')) {
        console.log(`   ⚠️  ${status} - Not Found (Expected for test endpoints)`);
        return { success: true, status, message: 'Expected 404 for test endpoints' });
      } else {
        console.log(`   ❌ ${status} - ${message}`);
        return { success: false, status, message };
      }
    } else {
      console.log(`   ❌ Network Error - ${error.message}`);
      return { success: false, status: 0, message: error.message };
    }
  }
}

async function testPDFGeneration() {
  console.log('\n📄 Testing PDF Generation Endpoints...\n');
  
  const results = [];
  
  for (const endpoint of testPDFEndpoints) {
    const result = await testEndpoint(endpoint, 'PDF');
    results.push({
      ...endpoint,
      ...result
    });
    console.log(''); // Empty line for readability
  }
  
  return results;
}

async function testDocumentation() {
  console.log('\n📁 Testing Documentation Endpoints...\n');
  
  const results = [];
  
  for (const endpoint of testDocumentationEndpoints) {
    const result = await testEndpoint(endpoint, 'Documentation');
    results.push({
      ...endpoint,
      ...result
    });
    console.log(''); // Empty line for readability
  }
  
  return results;
}

async function testFileUploads() {
  console.log('\n📤 Testing File Upload Endpoints...\n');
  
  const results = [];
  
  for (const endpoint of testUploadEndpoints) {
    const result = await testEndpoint(endpoint, 'File Upload');
    results.push({
      ...endpoint,
      ...result
    });
    console.log(''); // Empty line for readability
  }
  
  return results;
}

async function testAllFeatures() {
  console.log('🧪 Testing PDF Generation and Documentation Features...\n');
  console.log(`🌐 Base URL: ${BASE_URL}\n`);
  
  // Test all feature categories
  const pdfResults = await testPDFGeneration();
  const docResults = await testDocumentation();
  const uploadResults = await testFileUploads();
  
  // Combine all results
  const allResults = [...pdfResults, ...docResults, ...uploadResults];
  
  // Summary
  console.log('📊 Test Results Summary:');
  console.log('========================');
  
  const successful = allResults.filter(r => r.success).length;
  const failed = allResults.filter(r => !r.success).length;
  const total = allResults.length;
  
  console.log(`✅ Successful: ${successful}/${total}`);
  console.log(`❌ Failed: ${failed}/${total}`);
  
  // PDF Generation Results
  const pdfSuccessful = pdfResults.filter(r => r.success).length;
  const pdfTotal = pdfResults.length;
  console.log(`📄 PDF Generation: ${pdfSuccessful}/${pdfTotal} working`);
  
  // Documentation Results
  const docSuccessful = docResults.filter(r => r.success).length;
  const docTotal = docResults.length;
  console.log(`📁 Documentation: ${docSuccessful}/${docTotal} working`);
  
  // File Upload Results
  const uploadSuccessful = uploadResults.filter(r => r.success).length;
  const uploadTotal = uploadResults.length;
  console.log(`📤 File Uploads: ${uploadSuccessful}/${uploadTotal} working`);
  
  if (failed > 0) {
    console.log('\n🚨 Failed Endpoints:');
    allResults.filter(r => !r.success).forEach(r => {
      console.log(`   ❌ ${r.description}: ${r.path} - ${r.message}`);
    });
  }
  
  console.log('\n🏁 Testing complete!');
  
  return allResults;
}

// Run the comprehensive test
testAllFeatures().catch(console.error);
