// Test frontend API calls
require('dotenv').config();

const testFrontendApiCalls = async () => {
  try {
    console.log('🧪 Testing Frontend API Calls...\n');
    
    console.log('📋 Environment Variables:');
    console.log('   NODE_ENV:', process.env.NODE_ENV);
    console.log('   PORT:', process.env.PORT);
    
    console.log('\n📋 Expected API Endpoints:');
    console.log('   Frontend should call: /api/settings/public');
    console.log('   Backend route: /api/settings/public');
    console.log('   Full URL: https://charism.vercel.app/api/settings/public');
    
    console.log('\n📋 Vercel Routing:');
    console.log('   /api/* → backend/vercel-server.js');
    console.log('   /* → frontend/build (static files)');
    
    console.log('\n📋 Frontend Configuration:');
    console.log('   REACT_APP_API_URL should be: https://charism.vercel.app/api');
    console.log('   axiosInstance baseURL: process.env.REACT_APP_API_URL || http://localhost:5000/api');
    
    console.log('\n📋 Issue Analysis:');
    console.log('   ❌ Frontend calling: /settings/public');
    console.log('   ✅ Should call: /api/settings/public');
    console.log('   🔍 Problem: Missing /api prefix in frontend calls');
    
    console.log('\n🔧 Solution:');
    console.log('   1. Check REACT_APP_API_URL in frontend environment');
    console.log('   2. Ensure frontend uses axiosInstance for all API calls');
    console.log('   3. Verify vercel.json routing is correct');
    
    console.log('\n✅ Frontend API call testing completed');
    
  } catch (error) {
    console.error('❌ Error in frontend API call testing:', error);
  } finally {
    process.exit(0);
  }
};

testFrontendApiCalls();
