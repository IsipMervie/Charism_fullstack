import React, { useEffect, useRef } from 'react';
import { debounce, throttle } from '../utils/performanceOptimizer';

// Performance Optimizer Component
const PerformanceOptimizer = ({ children }) => {
  const observerRef = useRef(null);
  const imageCache = useRef(new Map());

  useEffect(() => {
    // Initialize Intersection Observer for lazy loading
    if ('IntersectionObserver' in window) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const target = entry.target;
              
              // Handle lazy loading for images
              if (target.tagName === 'IMG' && target.dataset.src) {
                loadImage(target);
              }
              
              // Handle lazy loading for components
              if (target.dataset.lazyComponent) {
                loadLazyComponent(target);
              }
            }
          });
        },
        {
          rootMargin: '50px', // Start loading 50px before element is visible
          threshold: 0.1
        }
      );
    }

    // Preload critical resources
    preloadCriticalResources();

    // Optimize scroll events
    optimizeScrollEvents();

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Lazy load images
  const loadImage = (imgElement) => {
    const src = imgElement.dataset.src;
    if (!src || imageCache.current.has(src)) return;

    const img = new Image();
    img.onload = () => {
      imgElement.src = src;
      imgElement.classList.remove('lazy');
      imageCache.current.set(src, true);
      observerRef.current?.unobserve(imgElement);
    };
    img.onerror = () => {
      console.warn('Failed to load image:', src);
      imgElement.classList.add('error');
    };
    img.src = src;
  };

  // Lazy load components
  const loadLazyComponent = (element) => {
    const componentName = element.dataset.lazyComponent;
    if (!componentName) return;

    // Dynamic import for component
    import(`../components/${componentName}`).then((module) => {
      const Component = module.default;
      // Render component or trigger loading state
      element.classList.add('loaded');
      observerRef.current?.unobserve(element);
    }).catch((error) => {
      console.error('Failed to load lazy component:', componentName, error);
      element.classList.add('error');
    });
  };

  // Preload critical resources
  const preloadCriticalResources = () => {
    const criticalResources = [
      '/logo.png',
      '/favicon.ico',
      '/manifest.json'
    ];

    criticalResources.forEach((resource) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      link.as = resource.endsWith('.json') ? 'fetch' : 'image';
      document.head.appendChild(link);
    });
  };

  // Optimize scroll events
  const optimizeScrollEvents = () => {
    const scrollHandler = throttle(() => {
      // Handle scroll-based optimizations
      const scrollTop = window.pageYOffset;
      const windowHeight = window.innerHeight;
      
      // Add scroll-based classes for animations
      document.body.classList.toggle('scrolled', scrollTop > 100);
      document.body.classList.toggle('near-bottom', scrollTop + windowHeight > document.documentElement.scrollHeight - 200);
    }, 16); // ~60fps

    window.addEventListener('scroll', scrollHandler, { passive: true });
  };

  // Observe elements for lazy loading
  const observeElement = (element) => {
    if (observerRef.current && element) {
      observerRef.current.observe(element);
    }
  };

  // Expose observe function to children
  const contextValue = {
    observeElement,
    imageCache: imageCache.current
  };

  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
    </PerformanceContext.Provider>
  );
};

// Performance Context
const PerformanceContext = React.createContext();

// Custom hook to use performance optimizations
export const usePerformance = () => {
  const context = React.useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within PerformanceOptimizer');
  }
  return context;
};

// Lazy Image Component
export const LazyImage = ({ src, alt, className = '', placeholder = null, ...props }) => {
  const { observeElement } = usePerformance();
  const imgRef = useRef(null);

  useEffect(() => {
    if (imgRef.current) {
      observeElement(imgRef.current);
    }
  }, [observeElement]);

  return (
    <img
      ref={imgRef}
      data-src={src}
      alt={alt}
      className={`lazy ${className}`}
      src={placeholder || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YwZjBmMCIvPjwvc3ZnPg=='}
      {...props}
    />
  );
};

// Lazy Component Wrapper
export const LazyComponent = ({ componentName, fallback = null, ...props }) => {
  const { observeElement } = usePerformance();
  const elementRef = useRef(null);

  useEffect(() => {
    if (elementRef.current) {
      observeElement(elementRef.current);
    }
  }, [observeElement]);

  return (
    <div
      ref={elementRef}
      data-lazy-component={componentName}
      className="lazy-component"
      {...props}
    >
      {fallback}
    </div>
  );
};

export default PerformanceOptimizer;
