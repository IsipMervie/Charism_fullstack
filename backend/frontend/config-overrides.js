const { override, disableEsLint, setWebpackOptimizationSplitChunks, addWebpackPlugin } = require('customize-cra');
const webpack = require('webpack');

module.exports = override(
  // Disable ESLint completely
  disableEsLint(),
  
  // Add webpack plugin to set environment variables
  addWebpackPlugin(
    new webpack.DefinePlugin({
      'process.env.DISABLE_ESLINT_PLUGIN': JSON.stringify('true'),
      'process.env.CI': JSON.stringify('false'),
      'process.env.GENERATE_SOURCEMAP': JSON.stringify('false'),
      'process.env.ESLINT_NO_DEV_ERRORS': JSON.stringify('true'),
      'process.env.SKIP_PREFLIGHT_CHECK': JSON.stringify('true'),
    })
  ),
  
  // Optimize bundle splitting
  setWebpackOptimizationSplitChunks({
    chunks: 'all',
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all',
      },
    },
  })
);
