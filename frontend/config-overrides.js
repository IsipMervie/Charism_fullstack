const { override, disableEsLint, setWebpackOptimizationSplitChunks } = require('customize-cra');

module.exports = override(
  // Disable ESLint completely
  disableEsLint(),
  
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
