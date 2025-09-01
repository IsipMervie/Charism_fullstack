// Network utilities for handling connectivity issues

// Check if the device is online
export const isOnline = () => {
  return navigator.onLine;
};

// Check if the backend server is reachable
export const checkServerHealth = async () => {
  try {
    const response = await fetch('/api/health', {
      method: 'GET',
      timeout: 5000,
    });
    return response.ok;
  } catch (error) {
    console.error('Server health check failed:', error);
    return false;
  }
};

// Monitor network connectivity
export const setupNetworkMonitoring = (onOnline, onOffline) => {
  const handleOnline = () => {
    console.log('🌐 Network connection restored');
    if (onOnline) onOnline();
  };

  const handleOffline = () => {
    console.log('📡 Network connection lost');
    if (onOffline) onOffline();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

// Retry function with exponential backoff
export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, i);
      console.log(`Retry ${i + 1}/${maxRetries} in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Show network status notification
export const showNetworkStatus = (isOnline) => {
  if (typeof window !== 'undefined' && window.Swal) {
    const Swal = window.Swal;
    
    if (isOnline) {
      Swal.fire({
        icon: 'success',
        title: 'Connection Restored',
        text: 'You are back online!',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Connection Lost',
        text: 'Please check your internet connection.',
        timer: 3000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    }
  }
};

// Debounce function for network requests
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

// Throttle function for network requests
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
