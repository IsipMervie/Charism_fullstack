// backend/scripts/test-env-loading.js
// Test script to verify environment variables are loading

// Load dotenv first
require('dotenv').config();

console.log('🧪 Testing environment variable loading...');
console.log('');

console.log('📋 Environment Variables:');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  MONGO_URI exists:', !!process.env.MONGO_URI);
console.log('  MONGO_URI length:', process.env.MONGO_URI ? process.env.MONGO_URI.length : 0);
console.log('  MONGO_URI preview:', process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 50) + '...' : 'Not set');
console.log('  PORT:', process.env.PORT);
console.log('  JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('  EMAIL_USER:', process.env.EMAIL_USER);

console.log('');
console.log('🔍 Available environment variables:');
Object.keys(process.env).forEach(key => {
  if (key.includes('MONGO') || key.includes('NODE') || key.includes('PORT') || key.includes('JWT') || key.includes('EMAIL')) {
    const value = process.env[key];
    const preview = value && value.length > 30 ? value.substring(0, 30) + '...' : value;
    console.log(`  ${key}: ${preview}`);
  }
});

console.log('');
console.log('✅ Environment test completed!');
