// Performance Monitoring Utility
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoads: [],
      apiCalls: [],
      errors: [],
      slowQueries: []
    };
    
    this.thresholds = {
      slowPageLoad: 3000, // 3 seconds
      slowApiCall: 2000,  // 2 seconds
      slowQuery: 1000     // 1 second
    };
    
    this.init();
  }

  init() {
    // Monitor page load performance
    this.monitorPageLoad();
    
    // Monitor API performance
    this.monitorApiCalls();
    
    // Monitor database query performance
    this.monitorDatabaseQueries();
    
    // Monitor memory usage
    this.monitorMemoryUsage();
    
    // Monitor network performance
    this.monitorNetworkPerformance();
  }

  // Monitor page load performance
  monitorPageLoad() {
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
        const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
        
        const metrics = {
          timestamp: Date.now(),
          loadTime,
          domContentLoaded,
          totalTime: navigation.loadEventEnd - navigation.fetchStart,
          url: window.location.href
        };
        
        this.metrics.pageLoads.push(metrics);
        
        // Log slow page loads
        if (loadTime > this.thresholds.slowPageLoad) {
          console.warn(`🐌 Slow page load detected: ${loadTime}ms for ${window.location.href}`);
          this.metrics.slowQueries.push({
            type: 'pageLoad',
            ...metrics
          });
        }
        
        // Send metrics to analytics if available
        this.sendMetrics('pageLoad', metrics);
      });
    }
  }

  // Monitor API call performance
  monitorApiCalls() {
    if (typeof window !== 'undefined') {
      // Override fetch to monitor performance
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const startTime = performance.now();
        const url = args[0];
        
        try {
          const response = await originalFetch(...args);
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          const metrics = {
            timestamp: Date.now(),
            url: typeof url === 'string' ? url : url.url,
            duration,
            status: response.status,
            method: args[1]?.method || 'GET'
          };
          
          this.metrics.apiCalls.push(metrics);
          
          // Log slow API calls
          if (duration > this.thresholds.slowApiCall) {
            console.warn(`🐌 Slow API call detected: ${duration}ms for ${metrics.url}`);
            this.metrics.slowQueries.push({
              type: 'apiCall',
              ...metrics
            });
          }
          
          // Send metrics to analytics if available
          this.sendMetrics('apiCall', metrics);
          
          return response;
        } catch (error) {
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          this.metrics.errors.push({
            timestamp: Date.now(),
            url: typeof url === 'string' ? url : url.url,
            duration,
            error: error.message,
            type: 'apiCall'
          });
          
          throw error;
        }
      };
    }
  }

  // Monitor database query performance (backend)
  monitorDatabaseQueries() {
    // This will be called from backend middleware
    if (typeof window !== 'undefined') {
      // Frontend monitoring for database-related API calls
      window.addEventListener('message', (event) => {
        if (event.data.type === 'dbQueryMetrics') {
          const metrics = event.data.metrics;
          this.metrics.slowQueries.push({
            type: 'databaseQuery',
            ...metrics
          });
          
          if (metrics.duration > this.thresholds.slowQuery) {
            console.warn(`🐌 Slow database query detected: ${metrics.duration}ms for ${metrics.query}`);
          }
        }
      });
    }
  }

  // Monitor memory usage
  monitorMemoryUsage() {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        const usage = {
          timestamp: Date.now(),
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        };
        
        // Log high memory usage
        const usagePercentage = (usage.usedJSHeapSize / usage.jsHeapSizeLimit) * 100;
        if (usagePercentage > 80) {
          console.warn(`⚠️ High memory usage: ${usagePercentage.toFixed(1)}%`);
        }
        
        // Send memory metrics
        this.sendMetrics('memory', usage);
      }, 30000); // Check every 30 seconds
    }
  }

  // Monitor network performance
  monitorNetworkPerformance() {
    if (typeof window !== 'undefined' && 'connection' in navigator) {
      const connection = navigator.connection;
      
      const networkInfo = {
        timestamp: Date.now(),
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };
      
      // Log slow network conditions
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        console.warn('🐌 Slow network detected:', connection.effectiveType);
      }
      
      // Send network metrics
      this.sendMetrics('network', networkInfo);
      
      // Monitor connection changes
      connection.addEventListener('change', () => {
        this.sendMetrics('network', {
          ...networkInfo,
          timestamp: Date.now(),
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        });
      });
    }
  }

  // Send metrics to analytics
  sendMetrics(type, data) {
    // You can integrate with Google Analytics, Sentry, or your own analytics service
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Performance Metric [${type}]:`, data);
    }
    
    // Example: Send to your analytics endpoint
    // this.sendToAnalytics(type, data);
  }

  // Get performance summary
  getPerformanceSummary() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    const recentPageLoads = this.metrics.pageLoads.filter(m => m.timestamp > oneHourAgo);
    const recentApiCalls = this.metrics.apiCalls.filter(m => m.timestamp > oneHourAgo);
    const recentErrors = this.metrics.errors.filter(m => m.timestamp > oneHourAgo);
    
    return {
      pageLoads: {
        total: recentPageLoads.length,
        average: recentPageLoads.length > 0 ? 
          recentPageLoads.reduce((sum, m) => sum + m.loadTime, 0) / recentPageLoads.length : 0,
        slow: recentPageLoads.filter(m => m.loadTime > this.thresholds.slowPageLoad).length
      },
      apiCalls: {
        total: recentApiCalls.length,
        average: recentApiCalls.length > 0 ? 
          recentApiCalls.reduce((sum, m) => sum + m.duration, 0) / recentApiCalls.length : 0,
        slow: recentApiCalls.filter(m => m.duration > this.thresholds.slowApiCall).length
      },
      errors: recentErrors.length,
      slowQueries: this.metrics.slowQueries.filter(m => m.timestamp > oneHourAgo).length
    };
  }

  // Export metrics for debugging
  exportMetrics() {
    return {
      summary: this.getPerformanceSummary(),
      detailed: this.metrics,
      thresholds: this.thresholds
    };
  }

  // Clear old metrics
  clearOldMetrics() {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    this.metrics.pageLoads = this.metrics.pageLoads.filter(m => m.timestamp > oneDayAgo);
    this.metrics.apiCalls = this.metrics.apiCalls.filter(m => m.timestamp > oneDayAgo);
    this.metrics.errors = this.metrics.errors.filter(m => m.timestamp > oneDayAgo);
    this.metrics.slowQueries = this.metrics.slowQueries.filter(m => m.timestamp > oneDayAgo);
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Export for use in components
export default performanceMonitor;

// Export individual functions for specific monitoring needs
export const {
  getPerformanceSummary,
  exportMetrics,
  clearOldMetrics
} = performanceMonitor;
