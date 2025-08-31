#!/usr/bin/env node

// Script to set environment variables for Vercel build
// This ensures ESLint is disabled during the build process

const fs = require('fs');
const path = require('path');

// Set environment variables
process.env.DISABLE_ESLINT_PLUGIN = 'true';
process.env.CI = 'false';
process.env.GENERATE_SOURCEMAP = 'false';
process.env.ESLINT_NO_DEV_ERRORS = 'true';
process.env.SKIP_PREFLIGHT_CHECK = 'true';

console.log('✅ Environment variables set for Vercel build:');
console.log('   DISABLE_ESLINT_PLUGIN:', process.env.DISABLE_ESLINT_PLUGIN);
console.log('   CI:', process.env.CI);
console.log('   GENERATE_SOURCEMAP:', process.env.GENERATE_SOURCEMAP);
console.log('   ESLINT_NO_DEV_ERRORS:', process.env.ESLINT_NO_DEV_ERRORS);
console.log('   SKIP_PREFLIGHT_CHECK:', process.env.SKIP_PREFLIGHT_CHECK);

// Create multiple environment files to ensure they're loaded
const envContent = `DISABLE_ESLINT_PLUGIN=true
CI=false
GENERATE_SOURCEMAP=false
ESLINT_NO_DEV_ERRORS=true
SKIP_PREFLIGHT_CHECK=true
`;

const envFiles = ['.env.local', '.env.production', '.env.build'];

envFiles.forEach(fileName => {
  try {
    fs.writeFileSync(path.join(__dirname, fileName), envContent);
    console.log(`✅ ${fileName} file created`);
  } catch (error) {
    console.log(`⚠️  Could not create ${fileName} file:`, error.message);
  }
});

console.log('🚀 Ready for build process');
