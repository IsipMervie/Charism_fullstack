// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

// Use the same fallback as controllers to avoid secret mismatches in development
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

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
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Role-based access control middleware
const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    if (allowedRoles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
  };
};

module.exports = {
  authMiddleware,
  roleMiddleware
};