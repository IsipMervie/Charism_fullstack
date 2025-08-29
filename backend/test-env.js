// Simple test script to check environment variables
require('dotenv').config();

console.log('🔍 ENVIRONMENT VARIABLES TEST');
console.log('==============================');

// Check critical variables
const checks = [
  { name: 'PORT', value: process.env.PORT, required: true },
  { name: 'FRONTEND_URL', value: process.env.FRONTEND_URL, required: true },
  { name: 'MONGO_URI', value: process.env.MONGO_URI, required: true },
  { name: 'JWT_SECRET', value: process.env.JWT_SECRET, required: true },
  { name: 'EMAIL_USER', value: process.env.EMAIL_USER, required: true },
  { name: 'EMAIL_PASS', value: process.env.EMAIL_PASS, required: true },
  { name: 'CORS_ORIGINS', value: process.env.CORS_ORIGINS, required: true },
  { name: 'MAX_FILE_SIZE', value: process.env.MAX_FILE_SIZE, required: false },
  { name: 'NODE_ENV', value: process.env.NODE_ENV, required: false }
];

let allGood = true;

checks.forEach(check => {
  if (check.value) {
    if (check.name === 'MONGO_URI') {
      console.log(`✅ ${check.name}: SET (${check.value.substring(0, 50)}...)`);
    } else if (check.name === 'EMAIL_PASS') {
      console.log(`✅ ${check.name}: SET (${check.value.substring(0, 10)}...)`);
    } else {
      console.log(`✅ ${check.name}: ${check.value}`);
    }
  } else {
    if (check.required) {
      console.log(`❌ ${check.name}: NOT SET (REQUIRED)`);
      allGood = false;
    } else {
      console.log(`⚠️  ${check.name}: NOT SET (optional)`);
    }
  }
});

console.log('\n📊 SUMMARY:');
if (allGood) {
  console.log('🎉 All required environment variables are set!');
  console.log('✅ Your .env file is working correctly');
} else {
  console.log('❌ Some required environment variables are missing');
  console.log('📝 Please check your .env file');
}

console.log('\n🔗 Next steps:');
if (allGood) {
  console.log('1. ✅ Environment variables are ready');
  console.log('2. 🔄 Restart your backend server');
  console.log('3. 🧪 Test email functionality');
  console.log('4. 🖼️  Test image loading');
} else {
  console.log('1. ❌ Fix missing environment variables');
  console.log('2. 📝 Copy env_production_actual.env to .env');
  console.log('3. 🔄 Restart your backend server');
}
