const { execSync } = require('child_process');

console.log('🚀 Starting Vercel build process...');

// First run the setup script to set environment variables
try {
  console.log('📋 Setting up environment variables...');
  require('./setup-env.js');
} catch (error) {
  console.log('⚠️  Setup script failed, continuing with direct environment setup...');
  // Set environment variables directly if setup script fails
  process.env.DISABLE_ESLINT_PLUGIN = 'true';
  process.env.CI = 'false';
  process.env.GENERATE_SOURCEMAP = 'false';
  process.env.ESLINT_NO_DEV_ERRORS = 'true';
  process.env.SKIP_PREFLIGHT_CHECK = 'true';
}

console.log('🔧 Environment variables set:');
console.log('- DISABLE_ESLINT_PLUGIN:', process.env.DISABLE_ESLINT_PLUGIN);
console.log('- CI:', process.env.CI);
console.log('- GENERATE_SOURCEMAP:', process.env.GENERATE_SOURCEMAP);
console.log('- ESLINT_NO_DEV_ERRORS:', process.env.ESLINT_NO_DEV_ERRORS);
console.log('- SKIP_PREFLIGHT_CHECK:', process.env.SKIP_PREFLIGHT_CHECK);

console.log('🏗️  Starting React build...');

try {
  execSync('react-scripts build', { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
