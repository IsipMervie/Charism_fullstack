#!/usr/bin/env node

// Build optimization script for React app
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting optimized build process...');

// Create optimized build configuration
const createOptimizedConfig = () => {
  const configPath = path.join(__dirname, 'config-overrides.js');
  
  const optimizedConfig = `
const { override, addWebpackPlugin, addBabelPlugin } = require('customize-cra');
const CompressionPlugin = require('compression-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const TerserPlugin = require('terser-webpack-plugin');

module.exports = override(
  // Add compression plugin for gzip
  addWebpackPlugin(
    new CompressionPlugin({
      test: /\\.(js|css|html|svg)$/,
      algorithm: 'gzip',
      threshold: 10240,
      minRatio: 0.8,
    })
  ),

  // Optimize bundle analyzer (only in development)
  process.env.NODE_ENV === 'development' && addWebpackPlugin(
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
    })
  ),

  // Add babel plugins for optimization
  addBabelPlugin('babel-plugin-transform-react-remove-prop-types'),
  addBabelPlugin('babel-plugin-transform-react-pure-class-components'),

  // Webpack optimizations
  (config) => {
    // Optimize chunks
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\\\/]node_modules[\\\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      },
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: process.env.NODE_ENV === 'production',
              drop_debugger: process.env.NODE_ENV === 'production',
            },
            mangle: true,
          },
          extractComments: false,
        }),
      ],
    };

    // Optimize resolve
    config.resolve.alias = {
      ...config.resolve.alias,
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    };

    // Optimize module rules
    config.module.rules.push({
      test: /\\.(png|jpe?g|gif|svg)$/,
      use: [
        {
          loader: 'file-loader',
          options: {
            name: '[name].[hash:8].[ext]',
            outputPath: 'static/media/',
          },
        },
        {
          loader: 'image-webpack-loader',
          options: {
            mozjpeg: {
              progressive: true,
              quality: 80,
            },
            optipng: {
              enabled: true,
            },
            pngquant: {
              quality: [0.65, 0.90],
              speed: 4,
            },
            gifsicle: {
              interlaced: false,
            },
          },
        },
      ],
    });

    return config;
  }
);
`;

  fs.writeFileSync(configPath, optimizedConfig);
  console.log('✅ Optimized config created');
};

// Create .env.production file with optimizations
const createProductionEnv = () => {
  const envPath = path.join(__dirname, '.env.production');
  
  const productionEnv = `
# Production optimizations
GENERATE_SOURCEMAP=false
DISABLE_ESLINT_PLUGIN=true
INLINE_RUNTIME_CHUNK=false
IMAGE_INLINE_SIZE_LIMIT=0

# Performance optimizations
REACT_APP_ENABLE_PERFORMANCE_MONITORING=true
REACT_APP_ENABLE_SERVICE_WORKER=true
REACT_APP_CACHE_VERSION=1

# Bundle optimizations
REACT_APP_BUNDLE_ANALYZE=false
REACT_APP_COMPRESSION_ENABLED=true
`;

  fs.writeFileSync(envPath, productionEnv);
  console.log('✅ Production environment file created');
};

// Create optimized package.json scripts
const updatePackageScripts = () => {
  const packagePath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  packageJson.scripts = {
    ...packageJson.scripts,
    'build:optimized': 'npm run build:prod',
    'build:analyze': 'BUNDLE_ANALYZE=true npm run build',
    'build:fast': 'SKIP_PREFLIGHT_CHECK=true npm run build',
    'prebuild': 'node build-optimized.js',
  };

  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Package.json scripts updated');
};

// Main optimization function
const optimizeBuild = () => {
  try {
    console.log('🔧 Applying build optimizations...');
    
    createOptimizedConfig();
    createProductionEnv();
    updatePackageScripts();
    
    console.log('✅ Build optimizations completed!');
    console.log('');
    console.log('📊 Available build commands:');
    console.log('  npm run build:optimized - Optimized production build');
    console.log('  npm run build:analyze - Build with bundle analysis');
    console.log('  npm run build:fast - Fast build (skip preflight)');
    console.log('');
    console.log('🚀 Your app is now optimized for maximum performance!');
    
  } catch (error) {
    console.error('❌ Build optimization failed:', error);
    process.exit(1);
  }
};

// Run optimizations
optimizeBuild();