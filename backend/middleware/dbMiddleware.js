// Database connection middleware
const { getLazyConnection } = require('../config/db');

// Middleware to ensure database connection
const ensureDBConnection = async (req, res, next) => {
  try {
    const isConnected = await getLazyConnection();
    if (!isConnected) {
      return res.status(503).json({ 
        message: 'Database connection unavailable',
        error: 'DATABASE_CONNECTION_FAILED'
      });
    }
    next();
  } catch (error) {
    console.error('Database connection check failed:', error);
    res.status(503).json({ 
      message: 'Database connection check failed',
      error: error.message
    });
  }
};

module.exports = {
  ensureDBConnection
};
