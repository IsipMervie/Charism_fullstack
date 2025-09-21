const { exec } = require('child_process');
console.log('🚀 FAST DEPLOY - SECURE FIX');
exec('git add . && git commit -m "SECURE: Remove credentials" && git push origin main', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  console.log('✅ DEPLOYED! Now set environment variables in Render dashboard!');
  console.log('📋 Go to Render → Environment tab → Add the variables from SECURE-SETUP-GUIDE.md');
});
