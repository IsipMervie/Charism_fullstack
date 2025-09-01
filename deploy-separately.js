#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 CommunityLink Separate Deployment Script');
console.log('==========================================\n');

// Check if Vercel CLI is installed
try {
  execSync('vercel --version', { stdio: 'pipe' });
  console.log('✅ Vercel CLI is installed');
} catch (error) {
  console.log('❌ Vercel CLI not found. Please install it first:');
  console.log('   npm i -g vercel');
  process.exit(1);
}

// Function to deploy a service
function deployService(serviceName, servicePath) {
  console.log(`\n📦 Deploying ${serviceName}...`);
  console.log(`📍 Path: ${servicePath}`);
  
  try {
    // Change to service directory
    process.chdir(servicePath);
    console.log(`📁 Changed to directory: ${process.cwd()}`);
    
    // Check if vercel.json exists
    if (!fs.existsSync('vercel.json')) {
      console.log(`❌ vercel.json not found in ${servicePath}`);
      console.log(`   Please create the vercel.json file first.`);
      return false;
    }
    
    // Deploy to Vercel
    console.log('🚀 Starting deployment...');
    execSync('vercel --prod', { stdio: 'inherit' });
    
    console.log(`✅ ${serviceName} deployed successfully!`);
    return true;
    
  } catch (error) {
    console.error(`❌ Failed to deploy ${serviceName}:`, error.message);
    return false;
  }
}

// Main deployment process
async function main() {
  console.log('This script will help you deploy frontend and backend separately.\n');
  
  // Check current directory
  const currentDir = process.cwd();
  console.log(`📍 Current directory: ${currentDir}`);
  
  // Check if we're in the right place
  if (!fs.existsSync('frontend') || !fs.existsSync('backend')) {
    console.log('❌ Please run this script from the CommunityLink root directory');
    console.log('   (where frontend/ and backend/ folders are located)');
    process.exit(1);
  }
  
  console.log('\n📋 Deployment Options:');
  console.log('1. Deploy Backend only');
  console.log('2. Deploy Frontend only');
  console.log('3. Deploy Both (recommended for first time)');
  console.log('4. Exit');
  
  // For now, we'll deploy both (you can modify this logic)
  console.log('\n🚀 Starting deployment process...\n');
  
  // Deploy Backend first
  const backendSuccess = deployService('Backend', path.join(currentDir, 'backend'));
  
  if (backendSuccess) {
    console.log('\n⏳ Waiting 10 seconds before deploying frontend...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Deploy Frontend
    const frontendSuccess = deployService('Frontend', path.join(currentDir, 'frontend'));
    
    if (frontendSuccess) {
      console.log('\n🎉 Both services deployed successfully!');
      console.log('\n📝 Next steps:');
      console.log('1. Get your backend URL from the deployment output');
      console.log('2. Update frontend environment variables with backend URL');
      console.log('3. Set CORS_ORIGINS in backend environment variables');
      console.log('4. Test the connection between frontend and backend');
    } else {
      console.log('\n⚠️  Frontend deployment failed. Please check the errors above.');
    }
  } else {
    console.log('\n⚠️  Backend deployment failed. Please check the errors above.');
    console.log('   Frontend deployment skipped.');
  }
  
  console.log('\n📚 For detailed instructions, see:');
  console.log('   - deploy-separately.md');
  console.log('   - frontend/DEPLOYMENT.md');
  console.log('   - backend/DEPLOYMENT.md');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { deployService };
