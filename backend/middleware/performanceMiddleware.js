// Performance optimization middleware
const compression = require('compression');
const NodeCache = require('node-cache');

// Create cache instance with ULTRA-FAST settings for maximum speed
const cache = new NodeCache({ 
  stdTTL: 60, // Reduced to 1 minute for instant updates
  checkperiod: 10, // Check every 10 seconds for ultra-fast cleanup
  useClones: false, // No cloning for maximum speed
  deleteOnExpire: true, // Instant cleanup
  maxKeys: 2000 // Increased for more caching
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

// Advanced caching strategies for maximum speed
const advancedCacheMiddleware = (req, res, next) => {
  // Only cache GET requests
  if (req.method !== 'GET') {
    return next();
  }

  const cacheKey = `${req.originalUrl}`;
  
  // Check cache first
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    console.log(`🚀 Advanced Cache HIT for ${cacheKey}`);
    res.setHeader('X-Cache', 'HIT');
    res.setHeader('Cache-Control', 'public, max-age=180');
    return res.json(cachedData);
  }

  // Store original json method
  const originalJson = res.json;
  
  // Override json method to cache response
  res.json = function(data) {
    // Cache successful responses
    if (res.statusCode === 200) {
      cache.set(cacheKey, data, 180); // 3 minutes
      console.log(`💾 Advanced Cache SET for ${cacheKey}`);
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('Cache-Control', 'public, max-age=180');
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

// Request batching middleware for multiple similar requests
const requestBatchingMiddleware = () => {
  const pendingRequests = new Map();
  
  return (req, res, next) => {
    // Only batch GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    const batchKey = `${req.path}`;
    
    // If there's already a pending request for this path, wait for it
    if (pendingRequests.has(batchKey)) {
      console.log(`🔄 Batching request for ${batchKey}`);
      pendingRequests.get(batchKey).push({ req, res });
      return;
    }
    
    // Create new batch
    const batch = [{ req, res }];
    pendingRequests.set(batchKey, batch);
    
    // Process batch after a short delay
    setTimeout(() => {
      const requests = pendingRequests.get(batchKey);
      pendingRequests.delete(batchKey);
      
      if (requests.length > 1) {
        console.log(`📦 Processing batch of ${requests.length} requests for ${batchKey}`);
      }
      
      // Process each request in the batch
      requests.forEach(({ req, res }) => {
        next();
      });
    }, 10); // 10ms delay for batching
  };
};

// Compression middleware with ULTRA-FAST optimization
const compressionMiddleware = compression({
  // Compress responses larger than 256 bytes for maximum speed
  threshold: 256,
  // Maximum compression level for ultimate speed
  level: 9,
  // Filter function optimized for speed
  filter: (req, res) => {
    // Skip compression for already compressed content
    if (req.headers['x-no-compression'] || res.getHeader('content-encoding')) {
      return false;
    }
    
    // Compress everything else for maximum speed
    return compression.filter(req, res);
  }
});

// ULTRA-FAST response time middleware with instant headers
const responseTimeMiddleware = (req, res, next) => {
  const start = process.hrtime.bigint(); // Use high-resolution timer
  
  // Set response time header before sending response
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Number(process.hrtime.bigint() - start) / 1000000; // Convert to milliseconds
    res.setHeader('X-Response-Time', `${Math.round(duration)}ms`);
    
    // Log ultra-fast requests
    if (duration > 100) {
      console.log(`⚡ FAST REQUEST: ${req.method} ${req.path} - ${Math.round(duration)}ms`);
    } else if (duration > 50) {
      console.log(`🚀 ULTRA-FAST REQUEST: ${req.method} ${req.path} - ${Math.round(duration)}ms`);
    } else {
      console.log(`⚡ INSTANT REQUEST: ${req.method} ${req.path} - ${Math.round(duration)}ms`);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Connection pooling optimization
const optimizeMongoose = (mongoose) => {
  // Set connection pool size
  const options = {
    maxPoolSize: 10, // Maximum number of connections in the pool
    serverSelectionTimeoutMS: 5000, // How long to try to connect
    socketTimeoutMS: 45000, // How long to wait for a response
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
  advancedCacheMiddleware,
  requestBatchingMiddleware,
  clearCache,
  clearAllCache,
  getCacheStats,
  compressionMiddleware,
  responseTimeMiddleware,
  optimizeMongoose,
  memoryMonitoring,
  cache
};