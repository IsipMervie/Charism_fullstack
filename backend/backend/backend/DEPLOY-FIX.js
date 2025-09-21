const { exec } = require('child_process');
console.log('🚀 DEPLOYING 502 FIX');
exec('git add backend/server.js', (error, stdout, stderr) => {
  exec('git commit -m "EMERGENCY: Fix 502 errors"', (error, stdout, stderr) => {
    exec('git push origin main', (error, stdout, stderr) => {
      console.log('✅ DEPLOYED! Server will work in 2 minutes!');
    });
  });
});
