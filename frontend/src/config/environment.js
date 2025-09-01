// Environment configuration for different deployment environments
const config = {
  development: {
    API_URL: 'http://localhost:5000/api',
    FRONTEND_URL: 'http://localhost:3000',
    NODE_ENV: 'development'
  },
  production: {
    API_URL: process.env.REACT_APP_API_URL || 'https://charism-server-ua-backend.vercel.app/api',
    FRONTEND_URL: 'https://charism.vercel.app',
    NODE_ENV: 'production'
  }
};

// Detect current environment
const currentEnv = process.env.NODE_ENV || 'development';
const currentConfig = config[currentEnv];

// Export configuration
export const {
  API_URL,
  FRONTEND_URL,
  NODE_ENV
} = currentConfig;

// Export full config for debugging
export const fullConfig = currentConfig;

// Log configuration (only in development)
if (currentEnv === 'development') {
  console.log('🔧 Environment Configuration:', currentConfig);
} else {
  console.log('🌐 Production API URL:', currentConfig.API_URL);
}
