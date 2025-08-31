// API Error Handler for consistent error handling across the application

export class ApiError extends Error {
  constructor(message, status, code, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.timestamp = new Date();
  }
}

// Error codes for different types of failures
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMIT: 'RATE_LIMIT',
  DATABASE_ERROR: 'DATABASE_CONNECTION_FAILED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

// HTTP status code mappings
export const STATUS_MAPPINGS = {
  400: ERROR_CODES.VALIDATION_ERROR,
  401: ERROR_CODES.AUTH_ERROR,
  403: ERROR_CODES.AUTH_ERROR,
  404: ERROR_CODES.NOT_FOUND,
  408: ERROR_CODES.TIMEOUT_ERROR,
  429: ERROR_CODES.RATE_LIMIT,
  500: ERROR_CODES.SERVER_ERROR,
  502: ERROR_CODES.SERVER_ERROR,
  503: ERROR_CODES.DATABASE_ERROR,
  504: ERROR_CODES.TIMEOUT_ERROR
};

// Parse error response from API
export const parseApiError = (error, response = null) => {
  // Handle network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return new ApiError(
      'Network connection failed. Please check your internet connection.',
      0,
      ERROR_CODES.NETWORK_ERROR,
      { originalError: error.message }
    );
  }

  // Handle timeout errors
  if (error.name === 'AbortError') {
    return new ApiError(
      'Request timed out. Please try again.',
      408,
      ERROR_CODES.TIMEOUT_ERROR,
      { originalError: error.message }
    );
  }

  // Handle API response errors
  if (response) {
    const status = response.status;
    const errorCode = STATUS_MAPPINGS[status] || ERROR_CODES.UNKNOWN_ERROR;
    
    let message = 'An error occurred while processing your request.';
    let details = null;

    try {
      // Try to parse error response body
      if (response.body) {
        const errorBody = typeof response.body === 'string' 
          ? JSON.parse(response.body) 
          : response.body;
        
        message = errorBody.message || message;
        details = errorBody.details || errorBody.error || null;
      }
    } catch (parseError) {
      // If parsing fails, use default message
      console.warn('Failed to parse error response:', parseError);
    }

    // Customize messages for specific error codes
    switch (errorCode) {
      case ERROR_CODES.DATABASE_ERROR:
        message = 'Database connection is temporarily unavailable. Please try again in a few moments.';
        break;
      case ERROR_CODES.AUTH_ERROR:
        message = 'Authentication failed. Please log in again.';
        break;
      case ERROR_CODES.NOT_FOUND:
        message = 'The requested resource was not found.';
        break;
      case ERROR_CODES.RATE_LIMIT:
        message = 'Too many requests. Please wait a moment before trying again.';
        break;
      case ERROR_CODES.TIMEOUT_ERROR:
        message = 'Request timed out. Please try again.';
        break;
      default:
        // Keep the parsed message or default
        break;
    }

    return new ApiError(message, status, errorCode, details);
  }

  // Handle unknown errors
  return new ApiError(
    error.message || 'An unexpected error occurred.',
    0,
    ERROR_CODES.UNKNOWN_ERROR,
    { originalError: error }
  );
};

// Handle API errors with user-friendly messages
export const handleApiError = (error, context = '') => {
  const apiError = parseApiError(error);
  
  // Log error for debugging
  console.error(`API Error in ${context}:`, {
    message: apiError.message,
    status: apiError.status,
    code: apiError.code,
    details: apiError.details,
    timestamp: apiError.timestamp
  });

  // Return user-friendly error object
  return {
    message: apiError.message,
    code: apiError.code,
    status: apiError.status,
    isRetryable: isRetryableError(apiError),
    retryAfter: getRetryDelay(apiError),
    context
  };
};

// Check if an error is retryable
export const isRetryableError = (error) => {
  const retryableCodes = [
    ERROR_CODES.NETWORK_ERROR,
    ERROR_CODES.TIMEOUT_ERROR,
    ERROR_CODES.SERVER_ERROR,
    ERROR_CODES.DATABASE_ERROR
  ];
  
  return retryableCodes.includes(error.code);
};

// Get retry delay for rate limiting
export const getRetryDelay = (error) => {
  if (error.code === ERROR_CODES.RATE_LIMIT) {
    // Default to 1 minute for rate limiting
    return 60000;
  }
  
  if (error.code === ERROR_CODES.DATABASE_ERROR) {
    // Default to 5 seconds for database errors
    return 5000;
  }
  
  // Default retry delay
  return 1000;
};

// Retry function for failed API calls
export const retryApiCall = async (apiCall, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      const apiError = parseApiError(error);
      
      // Don't retry non-retryable errors
      if (!isRetryableError(apiError)) {
        throw apiError;
      }
      
      // Don't retry if we've reached max attempts
      if (attempt === maxRetries) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const retryDelay = delay * Math.pow(2, attempt - 1);
      console.log(`API call failed (attempt ${attempt}/${maxRetries}), retrying in ${retryDelay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  throw lastError;
};

// Global error handler for unhandled API errors
export const setupGlobalErrorHandler = () => {
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    
    // Check if it's an API error
    if (error && (error.name === 'ApiError' || error.message.includes('fetch'))) {
      console.error('Unhandled API error:', error);
      
      // Show user-friendly error message
      const apiError = parseApiError(error);
      showUserError(apiError.message);
      
      // Prevent default error handling
      event.preventDefault();
    }
  });
};

// Show user-friendly error message
export const showUserError = (message, duration = 5000) => {
  // Create a simple toast notification
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #dc3545;
    color: white;
    padding: 15px 20px;
    border-radius: 5px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    max-width: 300px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // Auto-remove after duration
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, duration);
  
  // Allow manual dismissal
  toast.addEventListener('click', () => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  });
};

// Export default error handler
export default {
  ApiError,
  ERROR_CODES,
  parseApiError,
  handleApiError,
  isRetryableError,
  getRetryDelay,
  retryApiCall,
  setupGlobalErrorHandler,
  showUserError
};
