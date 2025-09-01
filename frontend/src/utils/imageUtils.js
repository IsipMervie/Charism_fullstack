// Image URL utility for consistent image handling
const getBackendUrl = () => {
  // If environment variable is set, use it
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Detect production environment
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // Vercel production - use backend URL, not frontend
  if (hostname === 'charism.vercel.app') {
    return 'https://charism-server-ua-backend.vercel.app/api';
  }
  
  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  
  // Fallback to current domain
  return `${protocol}//${hostname}/api`;
};

const BACKEND_URL = getBackendUrl();
const STATIC_URL = BACKEND_URL.replace('/api', '');

console.log('🖼️ Image Utils - BACKEND_URL:', BACKEND_URL);
console.log('🖼️ Image Utils - STATIC_URL:', STATIC_URL);

export const getImageUrl = (imageData, type = 'general') => {
  if (!imageData) return null;
  
  // Handle MongoDB binary data (new system)
  if (imageData.data && imageData.contentType) {
    // This is a MongoDB-stored image, use the file API endpoint
    switch (type) {
      case 'logo':
        return `${BACKEND_URL}/files/school-logo`;
      case 'profile':
        // For profile pictures, we need the user ID, not the image ID
        // The imageData should contain the user ID or we need to pass it separately
        return `${BACKEND_URL}/files/profile-picture/default`;
      case 'event':
        // For event images, we need the event ID, not the image ID
        // The imageData should contain the event ID or we need to pass it separately
        return `${BACKEND_URL}/files/event-image/default`;
      default:
        return `${BACKEND_URL}/files/${type}-image/default`;
    }
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

export const getProfilePictureUrl = (imageData, userId = null) => {
  if (!imageData) return null;
  
  // Handle MongoDB binary data with user ID
  if (imageData.data && imageData.contentType && userId) {
    return `${BACKEND_URL}/files/profile-picture/${userId}`;
  }
  
  // Fallback to general image handling
  return getImageUrl(imageData, 'profile');
};

export const getEventImageUrl = (imageData, eventId = null) => {
  if (!imageData) return null;
  
  // Handle MongoDB binary data with event ID
  if (imageData.data && imageData.contentType && eventId) {
    return `${BACKEND_URL}/files/event-image/${eventId}`;
  }
  
  // Fallback to general image handling
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

// Enhanced image loading with error handling
export const loadImageWithFallback = (imageUrl, fallbackUrl = null, onError = null) => {
  return new Promise((resolve, reject) => {
    if (!imageUrl) {
      if (fallbackUrl) {
        resolve(fallbackUrl);
      } else {
        reject(new Error('No image URL provided'));
      }
      return;
    }

    const img = new Image();
    
    img.onload = () => {
      resolve(imageUrl);
    };
    
    img.onerror = () => {
      console.warn('Failed to load image:', imageUrl);
      if (fallbackUrl) {
        resolve(fallbackUrl);
      } else if (onError) {
        onError(imageUrl);
        resolve(null);
      } else {
        reject(new Error(`Failed to load image: ${imageUrl}`));
      }
    };
    
    img.src = imageUrl;
  });
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
