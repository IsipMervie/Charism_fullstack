// FORCE DEPLOYMENT SCRIPT - URGENT FIX
// This script will force a complete rebuild and deployment

console.log('🚀 FORCE DEPLOYMENT STARTING...');

// Step 1: Clear all caches and rebuild
const { execSync } = require('child_process');

try {
  console.log('📦 Building frontend...');
  execSync('cd frontend && npm run build', { stdio: 'inherit' });
  
  console.log('✅ Build successful!');
  console.log('📤 Committing changes...');
  
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "🚨 FORCE DEPLOY: Clear cache and rebuild - URGENT FIX"', { stdio: 'inherit' });
  
  console.log('🚀 Pushing to GitHub...');
  execSync('git push origin main', { stdio: 'inherit' });
  
  console.log('✅ FORCE DEPLOYMENT COMPLETE!');
  console.log('⏰ Wait 3-5 minutes for Render to deploy');
  console.log('🔄 Clear your browser cache (Ctrl+Shift+R)');
  console.log('🔍 Look for: "🚀 [FIXED VERSION]" in console logs');
  
} catch (error) {
  console.error('❌ DEPLOYMENT FAILED:', error.message);
  process.exit(1);
}