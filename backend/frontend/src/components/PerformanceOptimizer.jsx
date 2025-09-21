import React, { useEffect, useRef } from 'react';

// Simple Performance Optimizer Component
const PerformanceOptimizer = ({ children }) => {
  const observerRef = useRef(null);
  const imageCache = useRef(new Map());

  useEffect(() => {
    // Simple Intersection Observer for lazy loading
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
            }
          });
        },
        {
          rootMargin: '50px',
          threshold: 0.1
        }
      );
    }

    // Simple scroll optimization
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      document.body.classList.toggle('scrolled', scrollTop > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Simple image lazy loading
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

  // Simple context value
  const contextValue = {
    observeElement: (element) => {
      if (observerRef.current && element) {
        observerRef.current.observe(element);
      }
    },
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

// Simple Lazy Image Component
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

export default PerformanceOptimizer;
