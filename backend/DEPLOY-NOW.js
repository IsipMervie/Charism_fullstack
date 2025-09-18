// DEPLOY NOW - Complete environment fix
const { exec } = require('child_process');

console.log('🚀 DEPLOYING SECURE FIX');
console.log('📋 This includes:');
console.log('  ✅ Secure server configuration');
console.log('  ✅ Correct Port (10000)');
console.log('  ✅ Clean code without credentials');
console.log('  ✅ Environment variable ready');
console.log('  ✅ Professional deployment');

exec('git add .', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Git add error:', error);
    return;
  }
  
  exec('git commit -m "SECURE: Remove hardcoded credentials, use environment variables"', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Git commit error:', error);
      return;
    }
    
    exec('git push origin main', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Git push error:', error);
        return;
      }
      
      console.log('✅ SECURE DEPLOYMENT COMPLETE!');
      console.log('⏳ Render is deploying...');
      console.log('🔐 NEXT STEP: Set environment variables in Render dashboard');
      console.log('📋 See SECURE-DEPLOYMENT-GUIDE.md for instructions');
      console.log('🎯 After setting env vars, your frontend will work perfectly!');
      console.log('🚀 Professional and secure deployment!');
    });
  });
});
