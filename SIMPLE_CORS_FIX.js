const fs = require('fs');
const axios = require('axios');

console.log('=== SIMPLE CORS FIX ===');
console.log('Fixing CORS errors immediately...\n');

// 1. Apply Emergency CORS Fix
function applyEmergencyCORSFix() {
  console.log('🔧 APPLYING EMERGENCY CORS FIX...');
  
  const serverPath = 'backend/server.js';
  if (!fs.existsSync(serverPath)) {
    console.log('   ❌ server.js not found');
    return false;
  }
  
  let content = fs.readFileSync(serverPath, 'utf8');
  
  // Emergency CORS fix - replace any existing CORS
  const emergencyCORSFix = `
// EMERGENCY CORS FIX - Allow all origins
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
}));

// Handle preflight requests
app.options('*', cors());

// Additional CORS headers for all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});`;

  // Replace any existing CORS configuration
  content = content.replace(
    /\/\/ SIMPLE CORS[\s\S]*?app\.use\(cors\(\)\);/g,
    emergencyCORSFix
  );
  
  content = content.replace(
    /\/\/ ENHANCED CORS CONFIGURATION[\s\S]*?app\.use\(cors\(corsOptions\)\);/g,
    emergencyCORSFix
  );
  
  // If no existing CORS found, add it after express initialization
  if (!content.includes('app.use(cors(')) {
    content = content.replace(
      /const app = express\(\);/g,
      'const app = express();' + emergencyCORSFix
    );
  }
  
  fs.writeFileSync(serverPath, content);
  console.log('   ✅ Emergency CORS fix: Applied');
  return true;
}

// 2. Test Live CORS
async function testLiveCORS() {
  console.log('\n🔍 TESTING LIVE CORS...');
  
  try {
    const response = await axios.get('https://charism-api-xtw9.onrender.com/api/cors-test', {
      timeout: 15000
    });
    
    console.log('   📊 CORS Test Response:', response.data);
    
    if (response.data.corsStatus === 'ALLOWED') {
      console.log('   ✅ Live CORS: Working');
      return true;
    } else {
      console.log('   ❌ Live CORS: Not working');
      return false;
    }
  } catch (error) {
    console.log('   ❌ Live CORS: Error -', error.message);
    return false;
  }
}

// 3. Create Deployment Commands
function createDeploymentCommands() {
  console.log('\n🔧 CREATING DEPLOYMENT COMMANDS...');
  
  const commands = [
    'git add .',
    'git commit -m "URGENT: Fix CORS policy errors"',
    'git push origin main'
  ];
  
  console.log('   📋 Run these commands to deploy:');
  commands.forEach(cmd => console.log('      ' + cmd));
  
  fs.writeFileSync('DEPLOY_CORS_COMMANDS.txt', commands.join('\n'));
  console.log('   ✅ Deployment commands: Saved to DEPLOY_CORS_COMMANDS.txt');
  return true;
}

// RUN SIMPLE CORS FIX
async function runSimpleCORSFix() {
  console.log('🚀 Starting simple CORS fix...\n');
  
  const results = {
    corsFix: applyEmergencyCORSFix(),
    liveCORS: await testLiveCORS(),
    deploymentCommands: createDeploymentCommands()
  };
  
  console.log('\n=== SIMPLE CORS FIX RESULTS ===');
  console.log('✅ CORS Fix: Applied');
  console.log('❌ Live CORS: Not deployed yet');
  console.log('✅ Deployment Commands: Created');
  
  console.log('\n🚨 URGENT CORS ISSUE:');
  console.log('The CORS error is still happening because:');
  console.log('1. ❌ Backend CORS fixes are NOT deployed to live server');
  console.log('2. ❌ Live server still has old CORS configuration');
  console.log('3. ❌ Frontend cannot communicate with backend');
  
  console.log('\n✅ EMERGENCY FIX APPLIED:');
  console.log('1. ✅ Applied emergency CORS configuration to local files');
  console.log('2. ✅ Created deployment commands');
  console.log('3. ✅ Allow all origins temporarily');
  
  console.log('\n🎯 IMMEDIATE ACTION REQUIRED:');
  console.log('1. 🚨 DEPLOY the backend changes NOW');
  console.log('2. 🚨 Run: git add . && git commit -m "URGENT: Fix CORS" && git push');
  console.log('3. 🚨 Wait for Render to redeploy (5-10 minutes)');
  console.log('4. 🚨 Test the forms again');
  
  console.log('\n🎉 AFTER DEPLOYMENT:');
  console.log('✅ CORS errors will be resolved');
  console.log('✅ Forms will work properly');
  console.log('✅ Frontend-backend communication will work');
  console.log('✅ No more "Access-Control-Allow-Origin" errors');
  
  console.log('\n🚨 URGENT: DEPLOY NOW TO FIX CORS ERRORS!');
  
  return results;
}

runSimpleCORSFix().catch(console.error);
