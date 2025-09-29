// Comprehensive error handling utility for the CommunityLink system
// This ensures all errors are handled consistently and securely

// Custom error classes
class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.statusCode = 400;
  }
}

class AuthenticationError extends Error {
  constructor(message = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
  }
}

class AuthorizationError extends Error {
  constructor(message = 'Access denied') {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = 403;
  }
}

class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

class ConflictError extends Error {
  constructor(message = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = 409;
  }
}

class RateLimitError extends Error {
  constructor(message = 'Too many requests') {
    super(message);
    this.name = 'RateLimitError';
    this.statusCode = 429;
  }
}

// Error response formatter
const formatErrorResponse = (error, req) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Base error response
  const errorResponse = {
    message: error.message || 'Internal server error',
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };
  
  // Add error code if available
  if (error.statusCode) {
    errorResponse.statusCode = error.statusCode;
  }
  
  // Add field information for validation errors
  if (error.field) {
    errorResponse.field = error.field;
  }
  
  // Add stack trace in development
  if (isDevelopment && error.stack) {
    errorResponse.stack = error.stack;
  }
  
  // Add additional details for specific error types
  if (error.name === 'ValidationError' && error.errors) {
    errorResponse.validationErrors = error.errors;
  }
  
  // Add request ID for tracking (if available)
  if (req.id) {
    errorResponse.requestId = req.id;
  }
  
  // Sanitize error message in production
  if (isProduction) {
    if (error.name === 'ValidationError') {
      errorResponse.message = 'Validation failed';
    } else if (error.name === 'MongoError' && error.code === 11000) {
      errorResponse.message = 'Duplicate entry';
    } else if (error.name === 'CastError') {
      errorResponse.message = 'Invalid ID format';
    } else if (error.name === 'JsonWebTokenError') {
      errorResponse.message = 'Invalid token';
    } else if (error.name === 'TokenExpiredError') {
      errorResponse.message = 'Token expired';
    } else {
      errorResponse.message = 'Internal server error';
    }
  }
  
  return errorResponse;
};

// HTTP status code mapper
const getHttpStatusCode = (error) => {
  if (error.statusCode) {
    return error.statusCode;
  }
  
  switch (error.name) {
    case 'ValidationError':
      return 400;
    case 'AuthenticationError':
      return 401;
    case 'AuthorizationError':
      return 403;
    case 'NotFoundError':
      return 404;
    case 'ConflictError':
      return 409;
    case 'RateLimitError':
      return 429;
    case 'MongoError':
      if (error.code === 11000) return 409; // Duplicate key
      return 500;
    case 'CastError':
      return 400; // Invalid ObjectId
    case 'JsonWebTokenError':
    case 'TokenExpiredError':
      return 401;
    default:
      return 500;
  }
};

// Error logger
const logError = (error, req) => {
  const errorInfo = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    userId: req.user?.id || 'anonymous'
  };
  
  // Log based on error severity
  if (error.statusCode >= 500) {
    console.error('🚨 SERVER ERROR:', errorInfo);
  } else if (error.statusCode >= 400) {
    console.warn('⚠️ CLIENT ERROR:', errorInfo);
  } else {
    console.log('ℹ️ INFO:', errorInfo);
  }
  
  // In production, you might want to send to external logging service
  if (process.env.NODE_ENV === 'production') {
    // Production error logging handled by global error handler
  }
};

// Global error handler middleware
const globalErrorHandler = (error, req, res, next) => {
  // Log the error
  logError(error, req);
  
  // Format error response
  const errorResponse = formatErrorResponse(error, req);
  
  // Get HTTP status code
  const statusCode = getHttpStatusCode(error);
  
  // Send error response
  res.status(statusCode).json(errorResponse);
};

// Async error wrapper (for controllers)
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validation error handler
const handleValidationError = (error) => {
  const errors = [];
  
  if (error.name === 'ValidationError') {
    for (const field in error.errors) {
      errors.push({
        field,
        message: error.errors[field].message,
        value: error.errors[field].value
      });
    }
  }
  
  return new ValidationError('Validation failed', errors);
};

// MongoDB error handler
const handleMongoError = (error) => {
  if (error.name === 'MongoError') {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return new ConflictError(`${field} already exists`);
    }
  }
  
  if (error.name === 'CastError') {
    return new ValidationError('Invalid ID format');
  }
  
  return error;
};

// JWT error handler
const handleJWTError = (error) => {
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid token');
  }
  
  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Token expired');
  }
  
  return error;
};

// Rate limiting error handler
const createRateLimitError = (message = 'Too many requests') => {
  return new RateLimitError(message);
};

// Database connection error handler
const handleDatabaseError = (error) => {
  console.error('🚨 Database Error:', error);
  
  if (error.name === 'MongoNetworkError') {
    return new Error('Database connection failed');
  }
  
  if (error.name === 'MongoTimeoutError') {
    return new Error('Database operation timed out');
  }
  
  return error;
};

// File upload error handler
const handleFileUploadError = (error) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return new ValidationError('File too large');
  }
  
  if (error.code === 'LIMIT_FILE_COUNT') {
    return new ValidationError('Too many files');
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return new ValidationError('Unexpected file field');
  }
  
  return error;
};

// Error response helper for controllers
const sendErrorResponse = (res, error, statusCode = null) => {
  const code = statusCode || getHttpStatusCode(error);
  const response = formatErrorResponse(error, { originalUrl: '/api', method: 'GET' });
  
  res.status(code).json(response);
};

// Success response helper for controllers
const sendSuccessResponse = (res, data, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  // Error classes
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  
  // Error handlers
  globalErrorHandler,
  asyncHandler,
  handleValidationError,
  handleMongoError,
  handleJWTError,
  handleDatabaseError,
  handleFileUploadError,
  
  // Response helpers
  sendErrorResponse,
  sendSuccessResponse,
  
  // Utilities
  formatErrorResponse,
  getHttpStatusCode,
  logError,
  createRateLimitError
};
