// Image URL utility for consistent image handling
const getBackendUrl = () => {
  let apiUrl;
  
  // If environment variable is set, use it
  if (process.env.REACT_APP_API_URL) {
    apiUrl = process.env.REACT_APP_API_URL;
  } else {
    // Detect environment based on hostname
    const hostname = window.location.hostname;
    
    // Production environment
    if (hostname === 'charism-ucb4.onrender.com' || hostname === 'charism.onrender.com') {
      apiUrl = 'https://charism-api-xtw9.onrender.com/api';
    }
    // Local development
    else if (hostname === 'localhost' || hostname === '127.0.0.1') {
      apiUrl = 'http://localhost:10000/api';
    }
    // Default to production for any other case
    else {
      apiUrl = 'https://charism-api-xtw9.onrender.com/api';
    }
  }
  
  // Ensure API URL always ends with /api
  if (!apiUrl.endsWith('/api')) {
    apiUrl = apiUrl.endsWith('/') ? `${apiUrl}api` : `${apiUrl}/api`;
  }
  
  return apiUrl;
};

const BACKEND_URL = getBackendUrl();
const STATIC_URL = BACKEND_URL.replace('/api', '');


export const getImageUrl = (imageData, type = 'general') => {
  if (!imageData) return null;
  
    // Handle MongoDB binary data (new system)
    if (imageData.data && imageData.contentType) {
      // This is a MongoDB-stored image, use the file API endpoint
      // Use the full backend URL for file serving
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
  // Handle MongoDB binary data with user ID
  if (imageData && imageData.data && imageData.contentType && userId) {
    // Use the full backend URL for file serving
    return `${BACKEND_URL}/files/profile-picture/${userId}`;
  }
  
  // Return default profile picture URL if no image data
  return `${BACKEND_URL}/files/profile-picture/default`;
};

export const getEventImageUrl = (imageData, eventId = null) => {
  // Debug logging
  console.log('🖼️ getEventImageUrl called:', {
    eventId,
    imageData,
    hasImageData: !!imageData,
    hasData: !!(imageData && imageData.data),
    hasContentType: !!(imageData && imageData.contentType),
    imageDataType: typeof imageData,
    imageDataKeys: imageData ? Object.keys(imageData) : [],
    BACKEND_URL,
    STATIC_URL
  });
  
  // Handle MongoDB binary data with event ID
  if (imageData && imageData.data && imageData.contentType && eventId) {
    // Try multiple backend URLs for image serving
    const urls = [
      `${BACKEND_URL}/files/event-image/${eventId}`,
      `${STATIC_URL}/files/event-image/${eventId}`,
      `${STATIC_URL}/uploads/events/${eventId}`,
      `${STATIC_URL}/uploads/${eventId}`
    ];
    console.log('✅ Constructed MongoDB image URLs:', urls);
    return urls[0]; // Return the primary URL
  }
  
  // Handle legacy format with URL field
  if (imageData && imageData.url && typeof imageData.url === 'string') {
    const cleanPath = imageData.url.startsWith('/') ? imageData.url.slice(1) : imageData.url;
    const urls = [
      `${STATIC_URL}/uploads/${cleanPath}`,
      `${BACKEND_URL}/uploads/${cleanPath}`,
      cleanPath // Direct path
    ];
    console.log('✅ Constructed legacy URL image URLs:', urls);
    return urls[0];
  }
  
  // If we have an eventId but no imageData, still try to serve from backend
  if (eventId && !imageData) {
    const urls = [
      `${BACKEND_URL}/files/event-image/${eventId}`,
      `${STATIC_URL}/files/event-image/${eventId}`,
      `${STATIC_URL}/uploads/events/${eventId}`,
      `${STATIC_URL}/uploads/${eventId}`
    ];
    console.log('⚠️ No image data, trying fallback URLs:', urls);
    return urls[0];
  }
  
  // Handle string image data (filename)
  if (typeof imageData === 'string' && imageData.length > 0) {
    const cleanPath = imageData.startsWith('/') ? imageData.slice(1) : imageData;
    const urls = [
      `${STATIC_URL}/uploads/${cleanPath}`,
      `${BACKEND_URL}/uploads/${cleanPath}`,
      cleanPath // Direct path
    ];
    console.log('✅ Constructed string image URLs:', urls);
    return urls[0];
  }
  
  // Always return a default image URL for events
  const defaultUrl = '/images/default-event.jpg';
  console.log('⚠️ Using default event image URL:', defaultUrl);
  return defaultUrl;
};

// Enhanced image loading with better error handling
export const getImageUrlWithFallback = async (imageData, eventId = null, type = 'event') => {
  const primaryUrl = type === 'event' ? getEventImageUrl(imageData, eventId) : getProfilePictureUrl(imageData, eventId);
  
  try {
    // Check if image exists before returning URL
    const response = await fetch(primaryUrl, { method: 'HEAD' });
    if (response.ok) {
      return primaryUrl;
    }
  } catch (error) {
    console.warn('Primary image URL failed:', primaryUrl, error);
  }
  
  // Return fallback URL
  return '/logo.png';
};

export const getLogoUrl = (imageData) => {
  const baseUrl = getImageUrl(imageData, 'logo');
  if (!baseUrl) return null;
  
  // Add timestamp to prevent caching issues when logo is updated
  const timestamp = new Date().getTime();
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}t=${timestamp}`;
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
