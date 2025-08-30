// Build configuration for Vercel deployment
// This file sets environment variables to disable ESLint during build

const path = require('path');

module.exports = {
  // Set environment variables
  env: {
    DISABLE_ESLINT_PLUGIN: 'true',
    CI: 'false',
    GENERATE_SOURCEMAP: 'false',
    ESLINT_NO_DEV_ERRORS: 'true',
    SKIP_PREFLIGHT_CHECK: 'true'
  },
  
  // Build output directory
  outputDir: 'build',
  
  // Disable ESLint
  lintOnSave: false,
  
  // Production source maps
  productionSourceMap: false
};
