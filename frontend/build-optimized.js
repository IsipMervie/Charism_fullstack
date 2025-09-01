#!/usr/bin/env node

// Optimized Build Script for Production
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting optimized build process...');

// Check if we're in the frontend directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Please run this script from the frontend directory');
  process.exit(1);
}

// Clean previous build
console.log('🧹 Cleaning previous build...');
if (fs.existsSync('build')) {
  fs.rmSync('build', { recursive: true, force: true });
}

// Install dependencies if needed
console.log('📦 Checking dependencies...');
if (!fs.existsSync('node_modules')) {
  console.log('📥 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
}

// Set production environment
process.env.NODE_ENV = 'production';
process.env.GENERATE_SOURCEMAP = 'false'; // Disable source maps for production

// Run build
console.log('🔨 Building optimized production bundle...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Optimize build output
console.log('⚡ Optimizing build output...');

const buildPath = path.join(__dirname, 'build');

// Optimize HTML files
const htmlFiles = findFiles(buildPath, '.html');
htmlFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Remove development comments
  content = content.replace(/<!--[\s\S]*?-->/g, '');
  
  // Minify HTML
  content = content.replace(/\s+/g, ' ').trim();
  
  fs.writeFileSync(file, content);
  console.log(`📄 Optimized: ${path.relative(buildPath, file)}`);
});

// Optimize CSS files
const cssFiles = findFiles(buildPath, '.css');
cssFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Remove comments and extra whitespace
  content = content.replace(/\/\*[\s\S]*?\*\//g, '');
  content = content.replace(/\s+/g, ' ').trim();
  
  fs.writeFileSync(file, content);
  console.log(`🎨 Optimized: ${path.relative(buildPath, file)}`);
});

// Optimize JavaScript files
const jsFiles = findFiles(buildPath, '.js');
jsFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Remove console.log statements in production
  if (process.env.NODE_ENV === 'production') {
    content = content.replace(/console\.(log|warn|info|debug)\([^)]*\);?/g, '');
  }
  
  // Remove extra whitespace
  content = content.replace(/\s+/g, ' ').trim();
  
  fs.writeFileSync(file, content);
  console.log(`⚙️ Optimized: ${path.relative(buildPath, file)}`);
});

// Create optimized service worker
console.log('🔧 Creating optimized service worker...');
const swContent = fs.readFileSync(path.join(__dirname, 'public', 'sw.js'), 'utf8');
const optimizedSw = swContent
  .replace(/console\.log\([^)]*\);?/g, '')
  .replace(/\s+/g, ' ')
  .trim();

fs.writeFileSync(path.join(buildPath, 'sw.js'), optimizedSw);

// Create performance manifest
console.log('📊 Creating performance manifest...');
const performanceManifest = {
  version: '1.0.0',
  buildTime: new Date().toISOString(),
  optimizations: [
    'Minified HTML, CSS, and JavaScript',
    'Removed development code',
    'Optimized service worker',
    'Performance monitoring enabled',
    'Lazy loading components',
    'Request deduplication',
    'Database connection optimization'
  ],
  cacheStrategy: {
    static: 'cache-first',
    api: 'network-first',
    images: 'lazy-loading'
  }
};

fs.writeFileSync(
  path.join(buildPath, 'performance-manifest.json'),
  JSON.stringify(performanceManifest, null, 2)
);

// Generate build report
console.log('📋 Generating build report...');
const buildReport = {
  timestamp: new Date().toISOString(),
  buildSize: getDirectorySize(buildPath),
  fileCount: countFiles(buildPath),
  optimizations: performanceManifest.optimizations
};

fs.writeFileSync(
  path.join(buildPath, 'build-report.json'),
  JSON.stringify(buildReport, null, 2)
);

console.log('🎉 Optimized build completed successfully!');
console.log(`📁 Build output: ${buildPath}`);
console.log(`📊 Build size: ${(buildReport.buildSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`📄 Total files: ${buildReport.fileCount}`);

// Helper functions
function findFiles(dir, extension) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    items.forEach(item => {
      const itemPath = path.join(currentDir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        traverse(itemPath);
      } else if (item.endsWith(extension)) {
        files.push(itemPath);
      }
    });
  }
  
  traverse(dir);
  return files;
}

function getDirectorySize(dir) {
  let size = 0;
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    items.forEach(item => {
      const itemPath = path.join(currentDir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        traverse(itemPath);
      } else {
        size += stat.size;
      }
    });
  }
  
  traverse(dir);
  return size;
}

function countFiles(dir) {
  let count = 0;
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    items.forEach(item => {
      const itemPath = path.join(currentDir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        traverse(itemPath);
      } else {
        count++;
      }
    });
  }
  
  traverse(dir);
  return count;
}
