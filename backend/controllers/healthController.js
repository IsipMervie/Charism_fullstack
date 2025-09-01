// Health check controller for system diagnostics
const mongoose = require('mongoose');

// Basic health check
exports.healthCheck = async (req, res) => {
  try {
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Check environment variables
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      MONGO_URI: process.env.MONGO_URI ? 'set' : 'not set',
      JWT_SECRET: process.env.JWT_SECRET ? 'set' : 'not set',
      EMAIL_USER: process.env.EMAIL_USER ? 'set' : 'not set',
      EMAIL_PASS: process.env.EMAIL_PASS ? 'set' : 'not set'
    };

    // Check system resources
    const systemInfo = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform
    };

    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      environment: envCheck,
      system: systemInfo
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      error: error.message
    });
  }
};

// Quick health check for frontend
exports.quickHealth = async (req, res) => {
  try {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      message: 'System is running'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Quick health check failed'
    });
  }
};

// Detailed system diagnostics
exports.systemDiagnostics = async (req, res) => {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      database: {
        status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host || 'unknown',
        name: mongoose.connection.name || 'unknown'
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        API_URL: process.env.API_URL,
        FRONTEND_URL: process.env.FRONTEND_URL
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      services: {
        email: process.env.EMAIL_USER ? 'configured' : 'not configured',
        jwt: process.env.JWT_SECRET ? 'configured' : 'not configured',
        database: process.env.MONGO_URI ? 'configured' : 'not configured'
      }
    };

    res.json(diagnostics);
  } catch (error) {
    console.error('System diagnostics error:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'System diagnostics failed',
      error: error.message
    });
  }
};

// Test database connection
exports.testDatabase = async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState;
    let message = '';
    
    switch (dbStatus) {
      case 0:
        message = 'disconnected';
        break;
      case 1:
        message = 'connected';
        break;
      case 2:
        message = 'connecting';
        break;
      case 3:
        message = 'disconnecting';
        break;
      default:
        message = 'unknown';
    }

    // Try to ping the database
    let pingResult = 'unknown';
    if (dbStatus === 1) {
      try {
        await mongoose.connection.db.admin().ping();
        pingResult = 'success';
      } catch (pingError) {
        pingResult = 'failed';
        console.error('Database ping failed:', pingError);
      }
    }

    res.json({
      status: 'OK',
      database: {
        readyState: dbStatus,
        status: message,
        ping: pingResult,
        host: mongoose.connection.host || 'unknown',
        name: mongoose.connection.name || 'unknown'
      }
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Database test failed',
      error: error.message
    });
  }
};
