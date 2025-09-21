// API Error Handler for better error management
export const handleApiError = (error, context = '') => {
  console.error(`API Error ${context}:`, error);
  
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const message = error.response.data?.message || error.message;
    
    switch (status) {
      case 404:
        console.warn(`Resource not found ${context}:`, message);
        return { type: 'not_found', message: 'Resource not found', status };
      case 500:
        console.error(`Server error ${context}:`, message);
        return { type: 'server_error', message: 'Server error occurred', status };
      case 403:
        console.warn(`Access forbidden ${context}:`, message);
        return { type: 'forbidden', message: 'Access denied', status };
      default:
        return { type: 'api_error', message: message || 'API error occurred', status };
    }
  } else if (error.request) {
    // Request was made but no response received
    console.error(`Network error ${context}:`, error.request);
    return { type: 'network_error', message: 'Network connection failed', status: 0 };
  } else {
    // Something else happened
    console.error(`Unknown error ${context}:`, error.message);
    return { type: 'unknown_error', message: error.message || 'Unknown error occurred', status: 0 };
  }
};

// Image loading error handler
export const handleImageError = (imageUrl, fallbackUrl = '/logo.png') => {
  console.warn('Image failed to load:', imageUrl);
  return fallbackUrl;
};

// Retry mechanism for failed requests
export const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      console.warn(`Request attempt ${i + 1} failed:`, error);
      
      if (i === maxRetries - 1) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
};

// Setup global error handler for unhandled errors
export const setupGlobalErrorHandler = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Handle API errors specifically
    if (event.reason?.response) {
      const errorInfo = handleApiError(event.reason, 'Global Handler');
      console.error('Global API Error:', errorInfo);
    }
    
    // Prevent the default handler (which would log to console)
    event.preventDefault();
  });

  // Handle general errors
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
  });

  console.log('Global error handler initialized');
};