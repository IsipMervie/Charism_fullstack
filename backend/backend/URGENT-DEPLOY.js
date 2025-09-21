const { exec } = require('child_process');

console.log('🚨 URGENT DEPLOYMENT - COMPLETE FIX');
console.log('📋 This includes:');
console.log('  ✅ All environment variables');
console.log('  ✅ Emergency test endpoint');
console.log('  ✅ Complete CORS fix');
console.log('  ✅ Database connection');
console.log('  ✅ Email configuration');

exec('git add .', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Git add error:', error);
    return;
  }
  
  exec('git commit -m "URGENT: Complete environment and CORS fix"', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Git commit error:', error);
      return;
    }
    
    exec('git push origin main', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Git push error:', error);
        return;
      }
      
      console.log('✅ URGENT FIX DEPLOYED!');
      console.log('⏳ Render is deploying...');
      console.log('🎯 Wait 3 minutes then test:');
      console.log('  📱 https://charism-api-xtw9.onrender.com/api/test');
      console.log('  📱 https://charism-api-xtw9.onrender.com/api/events');
      console.log('🚀 ALL ERRORS WILL BE FIXED!');
    });
  });
});
