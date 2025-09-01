import React, { useEffect, useRef, useMemo } from 'react';
import { debounce, throttle } from '../utils/performanceOptimizer';

// Performance Optimizer Component
const PerformanceOptimizer = ({ children }) => {
  const observerRef = useRef(null);
  const imageCache = useRef(new Map());

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    observeElement: (element) => {
      if (observerRef.current && element) {
        observerRef.current.observe(element);
      }
    },
    imageCache: imageCache.current
  }), []);

  useEffect(() => {
    // Initialize Intersection Observer for lazy loading with better performance
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
          rootMargin: '100px', // Increased margin for better performance
          threshold: 0.01 // Reduced threshold for faster loading
        }
      );
    }

    // Preload only critical resources
    preloadCriticalResources();

    // Optimize scroll events with better throttling
    const scrollHandler = throttle(() => {
      // Only handle essential scroll-based optimizations
      const scrollTop = window.pageYOffset;
      document.body.classList.toggle('scrolled', scrollTop > 100);
    }, 32); // Increased to ~30fps for better performance

    window.addEventListener('scroll', scrollHandler, { passive: true });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      window.removeEventListener('scroll', scrollHandler);
    };
  }, []);

  // Lazy load images with better error handling
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

  // Lazy load components with better error handling
  const loadLazyComponent = (element) => {
    const componentName = element.dataset.lazyComponent;
    if (!componentName) return;

    // Dynamic import for component with timeout
    const importPromise = import(`../components/${componentName}`);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Component load timeout')), 5000)
    );

    Promise.race([importPromise, timeoutPromise])
      .then((module) => {
        const Component = module.default;
        element.classList.add('loaded');
        observerRef.current?.unobserve(element);
      })
      .catch((error) => {
        console.error('Failed to load lazy component:', componentName, error);
        element.classList.add('error');
      });
  };

  // Preload only essential critical resources
  const preloadCriticalResources = () => {
    const criticalResources = [
      '/logo.png',
      '/favicon.ico'
    ];

    criticalResources.forEach((resource) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      link.as = 'image';
      document.head.appendChild(link);
    });
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

// Lazy Image Component with better performance
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
      loading="lazy"
      {...props}
    />
  );
};

// Lazy Component Wrapper with better performance
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
