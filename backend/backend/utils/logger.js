// Production-ready logger utility
const isProduction = process.env.NODE_ENV === 'production';

const logger = {
  info: (message, ...args) => {
    if (!isProduction) {
      console.log(`ℹ️ ${message}`, ...args);
    }
  },
  
  success: (message, ...args) => {
    if (!isProduction) {
      console.log(`✅ ${message}`, ...args);
    }
  },
  
  warning: (message, ...args) => {
    if (!isProduction) {
      console.log(`⚠️ ${message}`, ...args);
    }
  },
  
  error: (message, ...args) => {
    // Always log errors, even in production
    console.error(`❌ ${message}`, ...args);
  },
  
  debug: (message, ...args) => {
    if (!isProduction) {
      console.log(`🔍 ${message}`, ...args);
    }
  },
  
  // Production-safe logging (always logged)
  production: (message, ...args) => {
    console.log(message, ...args);
  }
};

module.exports = logger;
