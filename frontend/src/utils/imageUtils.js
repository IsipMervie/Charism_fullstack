// Image URL utility for consistent image handling
const BACKEND_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const STATIC_URL = BACKEND_URL.replace('/api', '');

export const getImageUrl = (imagePath, type = 'general') => {
  if (!imagePath) return null;
  
  // Remove leading slash if present
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  
  // Handle different image types
  switch (type) {
    case 'profile':
      return `${STATIC_URL}/uploads/profile-pictures/${cleanPath}`;
    case 'event':
      return `${STATIC_URL}/uploads/${cleanPath}`;
    case 'logo':
      return `${STATIC_URL}/uploads/${cleanPath}`;
    case 'documentation':
      return `${STATIC_URL}/uploads/documentation/${cleanPath}`;
    default:
      return `${STATIC_URL}/uploads/${cleanPath}`;
  }
};

export const getProfilePictureUrl = (filename) => {
  return getImageUrl(filename, 'profile');
};

export const getEventImageUrl = (filename) => {
  return getImageUrl(filename, 'event');
};

export const getLogoUrl = (filename) => {
  return getImageUrl(filename, 'logo');
};

export const getDocumentationUrl = (filename) => {
  return getImageUrl(filename, 'documentation');
};

// Add timestamp to prevent caching issues
export const getImageUrlWithTimestamp = (imagePath, type = 'general') => {
  const baseUrl = getImageUrl(imagePath, type);
  if (!baseUrl) return null;
  
  const timestamp = new Date().getTime();
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}t=${timestamp}`;
};

// Debug function to check current configuration
export const debugImageConfig = () => {
  console.log('🔍 Image Utils Debug Info:');
  console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
  console.log('BACKEND_URL:', BACKEND_URL);
  console.log('STATIC_URL:', STATIC_URL);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  return {
    REACT_APP_API_URL: process.env.REACT_APP_API_URL,
    BACKEND_URL,
    STATIC_URL,
    NODE_ENV: process.env.NODE_ENV
  };
};
