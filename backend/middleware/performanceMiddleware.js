// Performance Optimization Middleware
const performanceMiddleware = (req, res, next) => {
  // Add performance headers
  res.setHeader('X-Response-Time', '0ms');
  res.setHeader('X-Cache-Control', 'no-cache');
  
  // Start timing
  const start = Date.now();
  
  // Override res.end to calculate response time
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const responseTime = Date.now() - start;
    res.setHeader('X-Response-Time', `${responseTime}ms`);
    
    // Log slow responses
    if (responseTime > 1000) {
      console.warn(`🐌 Slow response detected: ${req.method} ${req.path} took ${responseTime}ms`);
    }
    
    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };
  
  // Add compression for large responses
  if (req.headers['accept-encoding'] && req.headers['accept-encoding'].includes('gzip')) {
    res.setHeader('Content-Encoding', 'gzip');
  }
  
  // Add cache headers for static resources
  if (req.path.startsWith('/uploads/') || req.path.startsWith('/api/health')) {
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
  }
  
  next();
};

// Request deduplication middleware
const requestDeduplication = (req, res, next) => {
  const requestKey = `${req.method}-${req.path}-${JSON.stringify(req.query)}`;
  
  // Check if this request is already being processed
  if (global.pendingRequests && global.pendingRequests.has(requestKey)) {
    console.log(`🔄 Duplicate request detected: ${requestKey}`);
    return res.status(429).json({ 
      error: 'Request already in progress',
      message: 'Please wait for the previous request to complete'
    });
  }
  
  // Initialize global pending requests if not exists
  if (!global.pendingRequests) {
    global.pendingRequests = new Map();
  }
  
  // Mark request as pending
  global.pendingRequests.set(requestKey, true);
  
  // Clean up when request completes
  res.on('finish', () => {
    global.pendingRequests.delete(requestKey);
  });
  
  next();
};

// Database query optimization middleware
const dbOptimization = (req, res, next) => {
  // Add query timeout
  req.queryTimeout = setTimeout(() => {
    console.warn(`⏰ Query timeout for: ${req.method} ${req.path}`);
  }, 10000); // 10 second timeout
  
  // Clean up timeout on response
  res.on('finish', () => {
    if (req.queryTimeout) {
      clearTimeout(req.queryTimeout);
    }
  });
  
  next();
};

// Response compression middleware
const compression = (req, res, next) => {
  // Check if response should be compressed
  const shouldCompress = req.headers['accept-encoding'] && 
                        (req.headers['accept-encoding'].includes('gzip') || 
                         req.headers['accept-encoding'].includes('deflate'));
  
  if (shouldCompress && req.path.startsWith('/api/')) {
    // Set compression headers
    res.setHeader('Content-Encoding', 'gzip');
    res.setHeader('Vary', 'Accept-Encoding');
  }
  
  next();
};

// Rate limiting middleware
const rateLimit = (() => {
  const requests = new Map();
  const windowMs = 60000; // 1 minute
  const maxRequests = 100; // Max requests per minute per IP
  
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!requests.has(ip)) {
      requests.set(ip, { count: 1, resetTime: now + windowMs });
    } else {
      const record = requests.get(ip);
      
      if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + windowMs;
      } else {
        record.count++;
      }
      
      if (record.count > maxRequests) {
        return res.status(429).json({
          error: 'Too many requests',
          message: 'Please try again later'
        });
      }
    }
    
    next();
  };
})();

module.exports = {
  performanceMiddleware,
  requestDeduplication,
  dbOptimization,
  compression,
  rateLimit
};
