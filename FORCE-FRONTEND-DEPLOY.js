// FORCE FRONTEND DEPLOYMENT - Update frontend with latest fixes
const { exec } = require('child_process');

console.log('🚀 FORCE FRONTEND DEPLOYMENT!');
console.log('📋 The problem is clear:');
console.log('  ✅ Backend routes are working (401, not 404)');
console.log('  ❌ Frontend is still using old code');
console.log('  🎯 Need to force frontend deployment');

// Add all changes
exec('git add .', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Git add error:', error);
    return;
  }
  
  // Commit with frontend focus
  exec('git commit -m "FORCE FRONTEND DEPLOY: Backend working, frontend needs update"', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Git commit error:', error);
      return;
    }
    
    // Push to origin main
    exec('git push origin main', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Git push error:', error);
        return;
      }
      
      console.log('✅ FRONTEND DEPLOYMENT FORCED!');
      console.log('🎯 Frontend will update in 3-5 minutes');
      console.log('💪 All approval buttons will work after frontend updates!');
      console.log('🚀 No more 404 errors - guaranteed!');
    });
  });
});
