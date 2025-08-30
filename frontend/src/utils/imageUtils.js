// Image URL utility for consistent image handling
const BACKEND_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const STATIC_URL = BACKEND_URL.replace('/api', '');

export const getImageUrl = (imageData, type = 'general') => {
  if (!imageData) return null;
  
  // Handle MongoDB binary data (new system)
  if (imageData.data && imageData.contentType) {
    // This is a MongoDB-stored image, use the file API endpoint
    return `${BACKEND_URL}/files/${type}-image/${imageData._id || 'temp'}`;
  }
  
  // Handle static file paths (legacy system)
  if (typeof imageData === 'string') {
    const cleanPath = imageData.startsWith('/') ? imageData.slice(1) : imageData;
    
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
  }
  
  return null;
};

export const getProfilePictureUrl = (imageData) => {
  return getImageUrl(imageData, 'profile');
};

export const getEventImageUrl = (imageData) => {
  return getImageUrl(imageData, 'event');
};

export const getLogoUrl = (imageData) => {
  return getImageUrl(imageData, 'logo');
};

export const getDocumentationUrl = (imageData) => {
  return getImageUrl(imageData, 'documentation');
};

// Add timestamp to prevent caching issues
export const getImageUrlWithTimestamp = (imageData, type = 'general') => {
  const baseUrl = getImageUrl(imageData, type);
  if (!baseUrl) return null;
  
  const timestamp = new Date().getTime();
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}t=${timestamp}`;
};

// Helper function to check if image data is valid
export const isValidImage = (imageData) => {
  if (!imageData) return false;
  
  // Check if it's MongoDB binary data
  if (imageData.data && imageData.contentType) {
    return imageData.data.length > 0 && imageData.contentType.startsWith('image/');
  }
  
  // Check if it's a static file path
  if (typeof imageData === 'string') {
    return imageData.length > 0;
  }
  
  return false;
};

// Helper function to get image type from content type
export const getImageTypeFromContentType = (contentType) => {
  if (!contentType) return 'unknown';
  
  if (contentType.startsWith('image/')) {
    return contentType.split('/')[1]; // e.g., 'jpeg', 'png'
  }
  
  return 'unknown';
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
