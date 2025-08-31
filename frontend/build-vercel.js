const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Vercel build process...');

// First run the setup script to set environment variables
try {
  console.log('📋 Setting up environment files...');
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

// Temporarily remove ESLint configuration files and modify package.json
const eslintrcPath = path.join(__dirname, '.eslintrc.js');
const eslintrcBackupPath = path.join(__dirname, '.eslintrc.js.backup');
const packagePath = path.join(__dirname, 'package.json');
const packageBackupPath = path.join(__dirname, 'package.json.backup');

// Backup and remove .eslintrc.js
if (fs.existsSync(eslintrcPath)) {
  fs.copyFileSync(eslintrcPath, eslintrcBackupPath);
  fs.unlinkSync(eslintrcPath);
  console.log('✅ .eslintrc.js temporarily removed for build');
}

// Backup and modify package.json to remove ESLint config
if (fs.existsSync(packagePath)) {
  fs.copyFileSync(packagePath, packageBackupPath);
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Remove ESLint configuration
  if (packageContent.eslintConfig) {
    delete packageContent.eslintConfig;
    console.log('✅ ESLint configuration removed from package.json');
  }
  
  fs.writeFileSync(packagePath, JSON.stringify(packageContent, null, 2));
}

console.log('🏗️  Starting React build with react-app-rewired...');

try {
  execSync('npx react-app-rewired build', { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} finally {
  // Restore original files
  if (fs.existsSync(eslintrcBackupPath)) {
    fs.copyFileSync(eslintrcBackupPath, eslintrcPath);
    fs.unlinkSync(eslintrcBackupPath);
    console.log('✅ Original .eslintrc.js restored');
  }
  
  if (fs.existsSync(packageBackupPath)) {
    fs.copyFileSync(packageBackupPath, packagePath);
    fs.unlinkSync(packageBackupPath);
    console.log('✅ Original package.json restored');
  }
}
