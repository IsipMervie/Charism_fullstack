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
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('JWT decoded:', decoded);
    console.log('JWT decoded.userId:', decoded.userId);
    console.log('JWT decoded.id:', decoded.id);
    console.log('JWT decoded._id:', decoded._id);
    console.log('JWT decoded.role:', decoded.role);
    
    // Set both id and userId for compatibility with different controllers
    req.user = { 
      id: decoded.userId || decoded.id || decoded._id, 
      userId: decoded.userId || decoded.id || decoded._id,
      _id: decoded.userId || decoded.id || decoded._id,
      role: decoded.role, // Make sure role is available
      email: decoded.email,
      ...decoded 
    };
    
    console.log('req.user set to:', req.user);
    console.log('req.user.id:', req.user.id);
    console.log('req.user.userId:', req.user.userId);
    console.log('req.user._id:', req.user._id);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    } else {
      return res.status(401).json({ message: 'Authentication failed' });
    }
  }
};

module.exports = {
  authMiddleware
};