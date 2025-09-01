// Performance Optimization Utilities
// This file contains utilities to improve overall system performance

// Debounce function to limit API calls
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function to limit function execution frequency
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Memoization utility for expensive calculations
export const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
};

// Lazy loading utility for images
export const lazyLoadImage = (imgElement, src) => {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = src;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    });
    imageObserver.observe(imgElement);
  } else {
    // Fallback for older browsers
    imgElement.src = src;
  }
};

// Preload critical resources
export const preloadResource = (href, as = 'fetch') => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
};

// Optimize scroll events
export const optimizeScroll = (callback, options = {}) => {
  const { throttleMs = 16, passive = true } = options;
  
  let ticking = false;
  const throttledCallback = throttle(() => {
    callback();
    ticking = false;
  }, throttleMs);
  
  return (event) => {
    if (!ticking) {
      requestAnimationFrame(throttledCallback);
      ticking = true;
    }
  };
};

// Cache management utility
export class CacheManager {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }
  
  set(key, value, ttl = 300000) { // 5 minutes default TTL
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  clear() {
    this.cache.clear();
  }
  
  size() {
    return this.cache.size;
  }
}

// API request optimization
export const createOptimizedAPI = (baseURL, options = {}) => {
  const {
    timeout = 30000,
    retries = 3,
    retryDelay = 1000,
    cacheEnabled = true,
    cacheTTL = 300000
  } = options;
  
  const cache = cacheEnabled ? new CacheManager() : null;
  
  const makeRequest = async (endpoint, options = {}) => {
    const cacheKey = `${endpoint}-${JSON.stringify(options)}`;
    
    // Check cache first
    if (cache) {
      const cached = cache.get(cacheKey);
      if (cached) return cached;
    }
    
    let lastError;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(`${baseURL}${endpoint}`, {
          ...options,
          signal: AbortSignal.timeout(timeout)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Cache successful response
        if (cache) {
          cache.set(cacheKey, data, cacheTTL);
        }
        
        return data;
      } catch (error) {
        lastError = error;
        
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
      }
    }
    
    throw lastError;
  };
  
  return {
    get: (endpoint) => makeRequest(endpoint, { method: 'GET' }),
    post: (endpoint, data) => makeRequest(endpoint, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
    put: (endpoint, data) => makeRequest(endpoint, { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
    delete: (endpoint) => makeRequest(endpoint, { method: 'DELETE' }),
    clearCache: () => cache?.clear()
  };
};

// Bundle size optimization
export const loadComponentLazy = (importFunc, fallback = null) => {
  const React = require('react');
  const LazyComponent = React.lazy(importFunc);
  
  return (props) => (
    <React.Suspense fallback={fallback || <div>Loading...</div>}>
      <LazyComponent {...props} />
    </React.Suspense>
  );
};

// Memory leak prevention
export const useCleanup = (cleanupFn) => {
  const React = require('react');
  React.useEffect(() => {
    return () => {
      if (typeof cleanupFn === 'function') {
        cleanupFn();
      }
    };
  }, [cleanupFn]);
};

// Export default utilities
export default {
  debounce,
  throttle,
  memoize,
  lazyLoadImage,
  preloadResource,
  optimizeScroll,
  CacheManager,
  createOptimizedAPI,
  loadComponentLazy,
  useCleanup
};
