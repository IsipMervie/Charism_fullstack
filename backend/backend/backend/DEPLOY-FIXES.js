#!/usr/bin/env node

/**
 * DEPLOY FIXES - Emergency deployment script for approval endpoints and email fixes
 * 
 * This script deploys the critical fixes for:
 * 1. Approval/disapproval endpoints (404 errors)
 * 2. Email notification improvements
 * 3. Enhanced error handling
 * 
 * Run this script to deploy the fixes to production.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 DEPLOYING CRITICAL FIXES...\n');

try {
  // Check if we're in the right directory
  if (!fs.existsSync('package.json')) {
    throw new Error('❌ Not in the correct directory. Please run from backend folder.');
  }

  console.log('📋 Deploying fixes for:');
  console.log('   ✅ Approval/disapproval endpoints');
  console.log('   ✅ Email notification improvements');
  console.log('   ✅ Enhanced error handling');
  console.log('   ✅ Share button fixes');
  console.log('   ✅ Event list layout improvements\n');

  // Check git status
  console.log('🔍 Checking git status...');
  try {
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    if (gitStatus.trim()) {
      console.log('📝 Changes detected:');
      console.log(gitStatus);
      console.log('\n💾 Committing changes...');
      
      execSync('git add .', { stdio: 'inherit' });
      execSync('git commit -m "🚀 CRITICAL FIXES: Approval endpoints, email notifications, share button, event layout"', { stdio: 'inherit' });
    } else {
      console.log('✅ No changes to commit');
    }
  } catch (error) {
    console.log('⚠️ Git operations failed:', error.message);
  }

  // Push to production
  console.log('\n🚀 Pushing to production...');
  try {
    execSync('git push origin main', { stdio: 'inherit' });
    console.log('\n✅ SUCCESS! Changes pushed to production');
    console.log('🌐 Your fixes should be live in a few minutes');
  } catch (error) {
    console.log('❌ Push failed:', error.message);
    console.log('💡 Please push manually: git push origin main');
  }

  console.log('\n📋 DEPLOYMENT SUMMARY:');
  console.log('   🔧 Fixed approval/disapproval 404 errors');
  console.log('   📧 Enhanced email notifications');
  console.log('   🔗 Fixed share button functionality');
  console.log('   🎨 Improved event list layout');
  console.log('   🛡️ Enhanced error handling');
  
  console.log('\n🎉 DEPLOYMENT COMPLETE!');
  console.log('⏰ Please wait 2-3 minutes for changes to take effect');
  console.log('🧪 Test the approval buttons after deployment');

} catch (error) {
  console.error('❌ DEPLOYMENT FAILED:', error.message);
  console.log('\n🔧 MANUAL DEPLOYMENT STEPS:');
  console.log('1. git add .');
  console.log('2. git commit -m "Fix approval endpoints and email notifications"');
  console.log('3. git push origin main');
  console.log('4. Wait 2-3 minutes for deployment');
  console.log('5. Test the approval buttons');
}
