// Performance optimization middleware
const compression = require('compression');
const NodeCache = require('node-cache');

// Create cache instance with 5 minute TTL
const cache = new NodeCache({ 
  stdTTL: 300, // 5 minutes
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false // Don't clone objects for better performance
});

// Cache middleware
const cacheMiddleware = (ttl = 300) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Create cache key from URL and query parameters
    const cacheKey = `${req.originalUrl}`;
    
    // Check if data is in cache
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log(`🚀 Cache HIT for ${cacheKey}`);
      return res.json(cachedData);
    }

    // Store original json method
    const originalJson = res.json;
    
    // Override json method to cache response
    res.json = function(data) {
      // Cache the response data
      cache.set(cacheKey, data, ttl);
      console.log(`💾 Cached response for ${cacheKey} (TTL: ${ttl}s)`);
      
      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
};

// Clear cache for specific patterns
const clearCache = (pattern) => {
  const keys = cache.keys();
  const regex = new RegExp(pattern);
  
  keys.forEach(key => {
    if (regex.test(key)) {
      cache.del(key);
      console.log(`🗑️ Cleared cache for ${key}`);
    }
  });
};

// Clear all cache
const clearAllCache = () => {
  cache.flushAll();
  console.log('🗑️ Cleared all cache');
};

// Get cache stats
const getCacheStats = () => {
  return cache.getStats();
};

// Compression middleware with optimization
const compressionMiddleware = compression({
  // Only compress responses larger than 1KB
  threshold: 1024,
  // Compression level (1-9, 6 is good balance)
  level: 6,
  // Filter function to decide what to compress
  filter: (req, res) => {
    // Don't compress if already compressed
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression for all other requests
    return compression.filter(req, res);
  }
});

// Response time middleware
const responseTimeMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    res.setHeader('X-Response-Time', `${duration}ms`);
    
    // Log slow requests
    if (duration > 1000) {
      console.log(`🐌 SLOW REQUEST: ${req.method} ${req.path} - ${duration}ms`);
    } else if (duration > 500) {
      console.log(`⚠️ MEDIUM REQUEST: ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  
  next();
};

// Connection pooling optimization
const optimizeMongoose = (mongoose) => {
  // Set connection pool size
  const options = {
    maxPoolSize: 10, // Maximum number of connections in the pool
    serverSelectionTimeoutMS: 5000, // How long to try to connect
    socketTimeoutMS: 45000, // How long to wait for a response
    bufferMaxEntries: 0, // Disable mongoose buffering
    bufferCommands: false, // Disable mongoose buffering
  };

  return options;
};

// Memory usage monitoring
const memoryMonitoring = () => {
  const used = process.memoryUsage();
  const formatBytes = (bytes) => {
    return Math.round(bytes / 1024 / 1024 * 100) / 100 + ' MB';
  };

  console.log('💾 Memory Usage:', {
    rss: formatBytes(used.rss), // Resident Set Size
    heapTotal: formatBytes(used.heapTotal),
    heapUsed: formatBytes(used.heapUsed),
    external: formatBytes(used.external),
    arrayBuffers: formatBytes(used.arrayBuffers)
  });
};

// Log memory usage every 5 minutes
setInterval(memoryMonitoring, 5 * 60 * 1000);

module.exports = {
  cacheMiddleware,
  clearCache,
  clearAllCache,
  getCacheStats,
  compressionMiddleware,
  responseTimeMiddleware,
  optimizeMongoose,
  memoryMonitoring,
  cache
};