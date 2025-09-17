// Emergency CORS fix deployment script
const { exec } = require('child_process');

console.log('🚨 EMERGENCY CORS FIX DEPLOYMENT');
console.log('📋 Pushing aggressive CORS fix...');

exec('git add . && git commit -m "EMERGENCY CORS FIX - Force headers everywhere" && git push origin main', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log('✅ CORS fix pushed successfully!');
  console.log('⏳ Render is deploying...');
  console.log('🎯 Wait 3-5 minutes then test your frontend');
  console.log('📱 The CORS errors should be completely gone!');
});
