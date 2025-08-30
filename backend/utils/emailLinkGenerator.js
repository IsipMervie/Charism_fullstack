// Email link generator utility
// This ensures email links work correctly in both development and production

const getFrontendUrl = () => {
  // Priority order for frontend URL
  const urls = [
    process.env.FRONTEND_URL_PRODUCTION,
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URL_VERCEL,
    'https://charism.vercel.app', // Fallback for production
    'http://localhost:3000' // Fallback for development
  ];
  
  // Find the first defined URL
  const frontendUrl = urls.find(url => url && url.trim() !== '');
  
  if (!frontendUrl) {
    console.warn('⚠️ No frontend URL configured, using localhost fallback');
    return 'http://localhost:3000';
  }
  
  // Ensure URL doesn't end with trailing slash
  return frontendUrl.replace(/\/$/, '');
};

const generateEmailLink = (path, token = null) => {
  const baseUrl = getFrontendUrl();
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  if (token) {
    return `${baseUrl}/#/${cleanPath}/${token}`;
  }
  
  return `${baseUrl}/#/${cleanPath}`;
};

// Specific link generators
const generateVerificationLink = (token) => {
  return generateEmailLink('verify-email', token);
};

const generatePasswordResetLink = (token) => {
  return generateEmailLink('reset-password', token);
};

const generateEventRegistrationLink = (token) => {
  return generateEmailLink('events/register', token);
};

// Debug function to check current configuration
const debugEmailConfig = () => {
  console.log('🔍 Email Link Generator Debug Info:');
  console.log('FRONTEND_URL_PRODUCTION:', process.env.FRONTEND_URL_PRODUCTION);
  console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
  console.log('FRONTEND_URL_VERCEL:', process.env.FRONTEND_URL_VERCEL);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('Selected Frontend URL:', getFrontendUrl());
  
  return {
    FRONTEND_URL_PRODUCTION: process.env.FRONTEND_URL_PRODUCTION,
    FRONTEND_URL: process.env.FRONTEND_URL,
    FRONTEND_URL_VERCEL: process.env.FRONTEND_URL_VERCEL,
    NODE_ENV: process.env.NODE_ENV,
    selectedUrl: getFrontendUrl()
  };
};

module.exports = {
  getFrontendUrl,
  generateEmailLink,
  generateVerificationLink,
  generatePasswordResetLink,
  generateEventRegistrationLink,
  debugEmailConfig
};
