const User = require('../models/User');

// Usage: roleMiddleware('Admin'), roleMiddleware('Staff', 'Admin'), etc.
const roleMiddleware = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      console.log('roleMiddleware called with allowed roles:', allowedRoles);
      console.log('req.user:', req.user);
      
      // Check if user is authenticated
      if (!req.user) {
        console.log('No user found in request');
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Get user ID from req.user (could be userId, _id, or id)
      const userId = req.user.userId || req.user._id || req.user.id;
      
      if (!userId) {
        console.log('No user ID found in request');
        return res.status(401).json({ message: 'User ID not found in token' });
      }

      console.log('User ID:', userId);
      
      // Check if role is in the token (faster than database lookup)
      if (req.user.role && allowedRoles.includes(req.user.role)) {
        console.log('User role from token:', req.user.role);
        console.log('User authorized, proceeding...');
        // Ensure req.user.id is properly set for controllers
        if (!req.user.id && req.user.userId) {
          req.user.id = req.user.userId;
        }
        if (!req.user.id && req.user._id) {
          req.user.id = req.user._id;
        }
        next();
        return;
      }
      
      // Fallback to database lookup if role not in token
      console.log('Role not in token, checking database...');
      const user = await User.findById(userId);
      if (!user) {
        console.log('User not found in database');
        return res.status(401).json({ message: 'User not found' });
      }

      console.log('User role from database:', user.role);
      
      // Check if user role is allowed
      if (!allowedRoles.includes(user.role)) {
        console.log('User role not allowed:', user.role, 'Allowed:', allowedRoles);
        return res.status(403).json({ 
          message: `Access denied: insufficient permissions. Required roles: ${allowedRoles.join(', ')}. Your role: ${user.role}` 
        });
      }

      console.log('User authorized, proceeding...');
      
      // Ensure req.user.id is properly set for controllers
      if (!req.user.id) {
        req.user.id = user._id;
      }
      
      // Add user info to request for use in controllers
      req.userInfo = {
        _id: user._id,
        role: user.role,
        name: user.name,
        email: user.email
      };

      next();
    } catch (err) {
      console.error('Role middleware error:', err);
      return res.status(500).json({ message: 'Authorization error', error: err.message });
    }
  };
};

module.exports = roleMiddleware;