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
    // Normalize to req.user.id since controllers expect that field
    req.user = { id: decoded.userId, ...decoded };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = {
  authMiddleware
};