// SweetAlert utility with theme support
import Swal from 'sweetalert2';

// Function to detect current theme
const detectTheme = () => {
  // Check for data-theme attribute (most reliable)
  const dataTheme = document.documentElement.getAttribute('data-theme');
  if (dataTheme === 'dark') return true;
  if (dataTheme === 'light') return false;
  
  // Check for dark class
  const hasDarkClass = document.documentElement.classList.contains('dark');
  if (hasDarkClass) return true;
  
  // Check for light class
  const hasLightClass = document.documentElement.classList.contains('light');
  if (hasLightClass) return false;
  
  // Check system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  
  if (prefersDark && !prefersLight) return true;
  if (prefersLight && !prefersDark) return false;
  
  // Check body background color as fallback
  const bodyBg = getComputedStyle(document.body).backgroundColor;
  const isDarkBg = bodyBg.includes('rgb(31, 41, 55)') || bodyBg.includes('rgb(17, 24, 39)') || 
                   bodyBg.includes('rgb(15, 23, 42)') || bodyBg.includes('rgb(12, 19, 33)') ||
                   bodyBg.includes('rgb(15, 23, 42)') || bodyBg.includes('rgb(30, 41, 59)');
  
  return isDarkBg;
};

// Function to get theme-appropriate colors
const getThemeColors = () => {
  const isDark = detectTheme();
  
  return {
    background: isDark ? '#1e293b' : '#ffffff', // --bg-card
    text: isDark ? '#ffffff' : '#0f172a', // --text-primary
    confirmButton: isDark ? '#3b82f6' : '#2563eb', // --primary
    cancelButton: isDark ? '#94a3b8' : '#64748b', // --text-tertiary
    error: isDark ? '#f87171' : '#ef4444', // --error
    warning: isDark ? '#fbbf24' : '#f59e0b', // --warning
    success: isDark ? '#34d399' : '#10b981', // --success
    info: isDark ? '#22d3ee' : '#06b6d4' // --info
  };
};

// Enhanced SweetAlert with theme support
export const showAlert = (options) => {
  const colors = getThemeColors();
  
  const defaultOptions = {
    background: colors.background,
    color: colors.text,
    confirmButtonColor: colors.confirmButton,
    cancelButtonColor: colors.cancelButton,
    customClass: {
      popup: 'swal-theme-popup',
      title: 'swal-theme-title',
      content: 'swal-theme-content',
      confirmButton: 'swal-theme-confirm',
      cancelButton: 'swal-theme-cancel'
    }
  };

  // Merge user options with theme defaults
  const finalOptions = { ...defaultOptions, ...options };
  
  return Swal.fire(finalOptions);
};

// Predefined alert types with theme support
export const showSuccess = (title, text = '', options = {}) => {
  const colors = getThemeColors();
  
  return showAlert({
    icon: 'success',
    title,
    text,
    confirmButtonColor: colors.success,
    ...options
  });
};

export const showError = (title, text = '', options = {}) => {
  const colors = getThemeColors();
  
  return showAlert({
    icon: 'error',
    title,
    text,
    confirmButtonColor: colors.error,
    ...options
  });
};

export const showWarning = (title, text = '', options = {}) => {
  const colors = getThemeColors();
  
  return showAlert({
    icon: 'warning',
    title,
    text,
    confirmButtonColor: colors.warning,
    ...options
  });
};

export const showInfo = (title, text = '', options = {}) => {
  const colors = getThemeColors();
  
  return showAlert({
    icon: 'info',
    title,
    text,
    confirmButtonColor: colors.info,
    ...options
  });
};

export const showQuestion = (title, text = '', options = {}) => {
  const colors = getThemeColors();
  
  return showAlert({
    icon: 'question',
    title,
    text,
    confirmButtonColor: colors.confirmButton,
    cancelButtonColor: colors.cancelButton,
    showCancelButton: true,
    confirmButtonText: 'Yes',
    cancelButtonText: 'Cancel',
    ...options
  });
};

export const showConfirm = (title, text = '', options = {}) => {
  const colors = getThemeColors();
  
  return showAlert({
    icon: 'question',
    title,
    text,
    confirmButtonColor: colors.confirmButton,
    cancelButtonColor: colors.cancelButton,
    showCancelButton: true,
    confirmButtonText: 'Confirm',
    cancelButtonText: 'Cancel',
    ...options
  });
};

// Toast notifications with theme support
export const showToast = (icon, title, options = {}) => {
  const colors = getThemeColors();
  
  return Swal.fire({
    icon,
    title,
    background: colors.background,
    color: colors.text,
    confirmButtonColor: colors.confirmButton,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    ...options
  });
};

// Success toast
export const showSuccessToast = (title, options = {}) => {
  const colors = getThemeColors();
  
  return showToast('success', title, {
    confirmButtonColor: colors.success,
    ...options
  });
};

// Error toast
export const showErrorToast = (title, options = {}) => {
  const colors = getThemeColors();
  
  return showToast('error', title, {
    confirmButtonColor: colors.error,
    ...options
  });
};

// Warning toast
export const showWarningToast = (title, options = {}) => {
  const colors = getThemeColors();
  
  return showToast('warning', title, {
    confirmButtonColor: colors.warning,
    ...options
  });
};

// Info toast
export const showInfoToast = (title, options = {}) => {
  const colors = getThemeColors();
  
  return showToast('info', title, {
    confirmButtonColor: colors.info,
    ...options
  });
};

// Loading alert with theme support
export const showLoading = (title = 'Loading...', text = 'Please wait') => {
  const colors = getThemeColors();
  
  return Swal.fire({
    title,
    text,
    background: colors.background,
    color: colors.text,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
};

// Close loading alert
export const closeLoading = () => {
  Swal.close();
};

// Update existing SweetAlert calls to use theme-aware colors
export const updateSwalTheme = () => {
  const colors = getThemeColors();
  
  // Update global SweetAlert defaults
  Swal.mixin({
    background: colors.background,
    color: colors.text,
    confirmButtonColor: colors.confirmButton,
    cancelButtonColor: colors.cancelButton
  });
};

// Initialize theme support
export const initSweetAlertTheme = () => {
  // Listen for theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', updateSwalTheme);
  
  // Listen for custom theme changes (if using a theme toggle)
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && 
          (mutation.attributeName === 'data-theme' || 
           mutation.attributeName === 'class')) {
        updateSwalTheme();
      }
    });
  });
  
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'class']
  });
  
  // Initial theme setup
  updateSwalTheme();
  
  return () => {
    mediaQuery.removeEventListener('change', updateSwalTheme);
    observer.disconnect();
  };
};
