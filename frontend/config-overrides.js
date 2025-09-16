const path = require('path');

module.exports = function override(config, env) {
  // Optimize build performance
  if (env === 'production') {
    // Enable source maps only in development
    config.devtool = false;

    // Optimize chunks
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    };
  }

  // Add path aliases for cleaner imports
  config.resolve.alias = {
    ...config.resolve.alias,
    '@': path.resolve(__dirname, 'src'),
    '@components': path.resolve(__dirname, 'src/components'),
    '@pages': path.resolve(__dirname, 'src/pages'),
    '@services': path.resolve(__dirname, 'src/services'),
    '@types': path.resolve(__dirname, 'src/types'),
    '@contexts': path.resolve(__dirname, 'src/contexts'),
  };

  return config;
};