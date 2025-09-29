const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

// Rate limiting for different endpoints
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: message,
        retryAfter: Math.round(windowMs / 1000)
      });
    }
  });
};

// General API rate limiting
const generalLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests per window
  'Too many requests from this IP, please try again later.'
);

// Strict rate limiting for auth endpoints
const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 requests per window
  'Too many authentication attempts, please try again later.'
);

// Contact form rate limiting (temporarily relaxed for deadline)
const contactLimiter = createRateLimit(
  5 * 60 * 1000, // 5 minutes
  20, // 20 requests per 5 minutes
  'Too many contact form submissions, please try again later.'
);

// Registration rate limiting (temporarily relaxed for deadline)
const registerLimiter = createRateLimit(
  5 * 60 * 1000, // 5 minutes
  20, // 20 registrations per 5 minutes
  'Too many registration attempts, please try again later.'
);

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://charism-ucb4.onrender.com',
      'https://charism-api-xtw9.onrender.com',
      'http://localhost:3000',
      'http://localhost:10000',
      'https://charism.onrender.com'
    ];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    // Allow any Render subdomain
    if (origin && origin.includes('onrender.com')) {
      return callback(null, true);
    }
    
    // Allow localhost in development
    if (origin && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('🚨 CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin', 
    'X-Requested-With', 
    'Content-Type', 
    'Accept', 
    'Authorization',
    'Cache-Control',
    'Pragma',
    'Expires',
    'cache-control',
    'x-cache-control',
    'X-Cache-Control',
    'Content-Length',
    'X-HTTP-Method-Override',
    'X-Requested-With',
    'If-Modified-Since',
    'Cache-Control',
    'Origin',
    'X-File-Name'
  ],
  optionsSuccessStatus: 200
};

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Remove any potentially dangerous characters
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  };

  // Sanitize body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    });
  }

  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key]);
      }
    });
  }

  next();
};

// Request logging for security monitoring
const securityLogger = (req, res, next) => {
  const suspiciousPatterns = [
    /\.\./,  // Directory traversal
    /<script/i,  // XSS attempts
    /union.*select/i,  // SQL injection
    /eval\(/i,  // Code injection
    /javascript:/i  // JavaScript injection
  ];

  const userAgent = req.get('User-Agent') || '';
  const suspicious = suspiciousPatterns.some(pattern => 
    pattern.test(req.url) || pattern.test(req.body) || pattern.test(userAgent)
  );

  if (suspicious) {
    console.log('🚨 Suspicious request detected:', {
      ip: req.ip,
      method: req.method,
      url: req.url,
      userAgent,
      timestamp: new Date().toISOString()
    });
  }

  next();
};

module.exports = {
  generalLimiter,
  authLimiter,
  contactLimiter,
  registerLimiter,
  securityHeaders,
  corsOptions,
  sanitizeInput,
  securityLogger
};
