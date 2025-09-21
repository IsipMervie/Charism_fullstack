// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

// Use environment variable for JWT secret, with fallback for development only
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'your_jwt_secret');

// Validate JWT secret is available
if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET environment variable is required in production!');
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    
    console.log('🔍 Auth middleware - Request URL:', req.originalUrl);
    console.log('🔍 Auth middleware - Method:', req.method);
    console.log('🔍 Auth middleware - Auth header present:', !!authHeader);
    
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ 
        message: 'No token provided',
        error: 'NO_TOKEN',
        path: req.originalUrl
      });
    }

    console.log('🔍 Token found, verifying...');
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ JWT decoded successfully:', {
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email,
      exp: new Date(decoded.exp * 1000)
    });
    
    // Set both id and userId for compatibility with different controllers
    req.user = { 
      id: decoded.userId || decoded.id || decoded._id, 
      userId: decoded.userId || decoded.id || decoded._id,
      _id: decoded.userId || decoded.id || decoded._id,
      role: decoded.role, // Make sure role is available
      email: decoded.email,
      ...decoded 
    };
    
    console.log('✅ req.user set successfully:', {
      id: req.user.id,
      userId: req.user.userId,
      role: req.user.role
    });
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired - please login again',
        error: 'TOKEN_EXPIRED',
        path: req.originalUrl
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token - please login again',
        error: 'INVALID_TOKEN',
        path: req.originalUrl
      });
    } else {
      return res.status(401).json({ 
        message: 'Authentication failed',
        error: 'AUTH_FAILED',
        path: req.originalUrl
      });
    }
  }
};

module.exports = {
  authMiddleware
};