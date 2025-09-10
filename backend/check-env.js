// check-env.js - Environment variable checker for production deployment
const fs = require('fs');
const path = require('path');

console.log('🔍 Environment Variable Checker');
console.log('===============================\n');

// Check if we're in production
const isProduction = process.env.NODE_ENV === 'production';
console.log('🌐 Environment:', isProduction ? 'Production' : 'Local/Other');
console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT SET');

// Required environment variables
const requiredVars = [
  'MONGO_URI',
  'JWT_SECRET',
  'EMAIL_USER',
  'EMAIL_PASS'
];

console.log('\n📋 Required Environment Variables:');
console.log('==================================');

let missingVars = [];
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const preview = varName === 'MONGO_URI' 
      ? `${value.substring(0, 30)}...` 
      : varName === 'JWT_SECRET'
      ? `${value.substring(0, 10)}...`
      : value;
    console.log(`✅ ${varName}: ${preview}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    missingVars.push(varName);
  }
});

// Optional but recommended variables
const optionalVars = [
  'FRONTEND_URL',
  'BACKEND_URL',
  'CORS_ORIGINS',
  'PORT',
  'LOG_LEVEL'
];

console.log('\n📋 Optional Environment Variables:');
console.log('==================================');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`⚠️  ${varName}: NOT SET (optional)`);
  }
});

// Check MongoDB URI format
if (process.env.MONGO_URI) {
  const mongoUri = process.env.MONGO_URI;
  console.log('\n🔗 MongoDB URI Analysis:');
  console.log('========================');
  
  if (mongoUri.includes('mongodb+srv://')) {
    console.log('✅ MongoDB Atlas connection string detected');
  } else if (mongoUri.includes('mongodb://')) {
    console.log('✅ Standard MongoDB connection string detected');
  } else {
    console.log('❌ Invalid MongoDB URI format');
  }
  
  if (mongoUri.includes('retryWrites=true')) {
    console.log('✅ Retry writes enabled');
  } else {
    console.log('⚠️  Retry writes not explicitly enabled');
  }
  
  if (mongoUri.includes('w=majority')) {
    console.log('✅ Write concern set to majority');
  } else {
    console.log('⚠️  Write concern not set to majority');
  }
}

// Check for common issues
console.log('\n🔍 Common Issues Check:');
console.log('========================');

if (missingVars.length > 0) {
  console.log(`❌ Missing required variables: ${missingVars.join(', ')}`);
  console.log('   These must be set in production environment variables');
} else {
  console.log('✅ All required environment variables are set');
}

if (process.env.NODE_ENV !== 'production') {
  console.log('⚠️  NODE_ENV is not set to "production"');
  console.log('   This may cause issues in production deployment');
}

if (!process.env.CORS_ORIGINS) {
  console.log('⚠️  CORS_ORIGINS not set - may cause CORS issues');
}

console.log('\n📝 Next Steps:');
console.log('===============');

if (missingVars.length > 0) {
  console.log('1. Go to your hosting platform → Your Project → Settings → Environment Variables');
  console.log('2. Add the missing variables:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('3. Redeploy your project');
} else {
  console.log('1. All environment variables are set correctly');
  console.log('2. If you still have issues, check the MongoDB connection');
  console.log('3. Test with /api/health endpoint first');
}

console.log('\n🔗 Test Endpoints:');
console.log('==================');
console.log('- /api/health - Basic health check');
console.log('- /api/health-quick - Quick response test');
console.log('- /api/test-db-simple - Database connection test');
console.log('- /api/test-db-comprehensive - Full database test');

console.log('\n✨ Environment check complete!');
