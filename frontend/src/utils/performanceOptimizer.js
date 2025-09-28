// Performance optimization utilities for React frontend

// Image lazy loading optimization
export const optimizeImages = () => {
  // Add intersection observer for lazy loading
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    });

    // Observe all lazy images
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
};

// Debounce function for search inputs
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

// Throttle function for scroll events
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Memoization for expensive calculations
export const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

// Virtual scrolling helper
export const getVisibleRange = (scrollTop, itemHeight, containerHeight, totalItems) => {
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + Math.ceil(containerHeight / itemHeight) + 1, totalItems);
  return { startIndex, endIndex };
};

// Bundle size optimization - dynamic imports
export const lazyLoadComponent = (importFunc) => {
  return React.lazy(importFunc);
};

// Preload critical resources
export const preloadCriticalResources = () => {
  // Preload critical CSS
  const criticalCSS = document.createElement('link');
  criticalCSS.rel = 'preload';
  criticalCSS.as = 'style';
  criticalCSS.href = '/static/css/critical.css';
  document.head.appendChild(criticalCSS);

  // Preload critical fonts
  const criticalFont = document.createElement('link');
  criticalFont.rel = 'preload';
  criticalFont.as = 'font';
  criticalFont.type = 'font/woff2';
  criticalFont.crossOrigin = 'anonymous';
  criticalFont.href = '/static/fonts/critical.woff2';
  document.head.appendChild(criticalFont);
};

// Service Worker registration for caching
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('🚀 Service Worker registered successfully:', registration.scope);
        })
        .catch((error) => {
          console.log('❌ Service Worker registration failed:', error);
        });
    });
  }
};

// Performance monitoring
export const performanceMonitor = {
  // Measure component render time
  measureRender: (componentName, renderFunction) => {
    const start = performance.now();
    const result = renderFunction();
    const end = performance.now();
    console.log(`⚡ ${componentName} render time: ${end - start}ms`);
    return result;
  },

  // Measure API call performance
  measureApiCall: async (apiCall, callName) => {
    const start = performance.now();
    try {
      const result = await apiCall();
      const end = performance.now();
      console.log(`🌐 ${callName} API call time: ${end - start}ms`);
      return result;
    } catch (error) {
      const end = performance.now();
      console.log(`❌ ${callName} API call failed after: ${end - start}ms`);
      throw error;
    }
  },

  // Get Web Vitals
  getWebVitals: () => {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const paintEntries = performance.getEntriesByType('paint');
      const navigationEntries = performance.getEntriesByType('navigation');
      
      const vitals = {
        FCP: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime,
        LCP: performance.getEntriesByType('largest-contentful-paint')[0]?.startTime,
        FID: performance.getEntriesByType('first-input')[0]?.processingStart,
        CLS: performance.getEntriesByType('layout-shift').reduce((sum, entry) => sum + entry.value, 0),
        TTFB: navigationEntries[0]?.responseStart - navigationEntries[0]?.requestStart
      };

      console.log('📊 Web Vitals:', vitals);
      return vitals;
    }
    return null;
  }
};

// Memory usage monitoring
export const memoryMonitor = () => {
  if ('memory' in performance) {
    const memory = performance.memory;
    console.log('💾 Memory Usage:', {
      used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + ' MB',
      total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + ' MB',
      limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + ' MB'
    });
  }
};

// Component optimization helpers
export const componentOptimizations = {
  // Memo wrapper for expensive components
  withMemo: (Component, areEqual) => {
    return React.memo(Component, areEqual);
  },

  // Callback memoization
  withCallback: (callback, deps) => {
    return React.useCallback(callback, deps);
  },

  // Value memoization
  withMemoValue: (value, deps) => {
    return React.useMemo(() => value, deps);
  }
};

// Bundle analyzer helper
export const analyzeBundle = () => {
  if (process.env.NODE_ENV === 'development') {
    // Log component render counts
    const renderCounts = {};
    const originalConsoleLog = console.log;
    
    console.log = (...args) => {
      if (args[0] && args[0].includes && args[0].includes('render')) {
        const componentName = args[0].split(' ')[0];
        renderCounts[componentName] = (renderCounts[componentName] || 0) + 1;
      }
      originalConsoleLog.apply(console, args);
    };

    // Log render counts every 10 seconds
    setInterval(() => {
      console.table(renderCounts);
    }, 10000);
  }
};

// Initialize performance optimizations
export const initPerformanceOptimizations = () => {
  // Register service worker
  registerServiceWorker();

  // Preload critical resources
  preloadCriticalResources();

  // Monitor memory usage every 30 seconds
  setInterval(memoryMonitor, 30000);

  // Get initial Web Vitals
  setTimeout(() => {
    performanceMonitor.getWebVitals();
  }, 1000);

  // Analyze bundle in development
  if (process.env.NODE_ENV === 'development') {
    analyzeBundle();
  }

  console.log('🚀 Performance optimizations initialized');
};

export default {
  optimizeImages,
  debounce,
  throttle,
  memoize,
  getVisibleRange,
  lazyLoadComponent,
  preloadCriticalResources,
  registerServiceWorker,
  performanceMonitor,
  memoryMonitor,
  componentOptimizations,
  analyzeBundle,
  initPerformanceOptimizations
};