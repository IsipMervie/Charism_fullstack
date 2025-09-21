// frontend/src/utils/themeUtils.js
// Utility functions for theme management

export const getThemeColors = (theme) => {
  const colors = {
    light: {
      primary: '#2563eb',
      secondary: '#64748b',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#06b6d4',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#1e293b',
      textSecondary: '#64748b',
      border: '#e2e8f0',
      shadow: 'rgba(0, 0, 0, 0.1)'
    },
    dark: {
      primary: '#3b82f6',
      secondary: '#94a3b8',
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#22d3ee',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f8fafc',
      textSecondary: '#cbd5e1',
      border: '#334155',
      shadow: 'rgba(0, 0, 0, 0.4)'
    }
  };
  
  return colors[theme] || colors.light;
};

export const getThemeVariable = (variableName, theme = 'light') => {
  const root = document.documentElement;
  const value = getComputedStyle(root).getPropertyValue(`--${variableName}`).trim();
  return value || getThemeColors(theme)[variableName];
};

export const applyThemeToElement = (element, theme) => {
  if (!element) return;
  
  const colors = getThemeColors(theme);
  
  // Apply common theme properties
  element.style.setProperty('--theme-primary', colors.primary);
  element.style.setProperty('--theme-secondary', colors.secondary);
  element.style.setProperty('--theme-background', colors.background);
  element.style.setProperty('--theme-surface', colors.surface);
  element.style.setProperty('--theme-text', colors.text);
  element.style.setProperty('--theme-text-secondary', colors.textSecondary);
  element.style.setProperty('--theme-border', colors.border);
  element.style.setProperty('--theme-shadow', colors.shadow);
};

export const createThemeAwareStyle = (styles, theme) => {
  const colors = getThemeColors(theme);
  
  return Object.keys(styles).reduce((acc, key) => {
    const value = styles[key];
    
    // Replace theme color placeholders
    if (typeof value === 'string') {
      acc[key] = value
        .replace('{{primary}}', colors.primary)
        .replace('{{secondary}}', colors.secondary)
        .replace('{{background}}', colors.background)
        .replace('{{surface}}', colors.surface)
        .replace('{{text}}', colors.text)
        .replace('{{textSecondary}}', colors.textSecondary)
        .replace('{{border}}', colors.border)
        .replace('{{shadow}}', colors.shadow);
    } else {
      acc[key] = value;
    }
    
    return acc;
  }, {});
};

export const getContrastColor = (backgroundColor, theme = 'light') => {
  const colors = getThemeColors(theme);
  
  // Simple contrast calculation
  const isLight = backgroundColor === colors.background || backgroundColor === colors.surface;
  return isLight ? colors.text : colors.textSecondary;
};

export const getThemeTransition = (properties = ['background-color', 'color', 'border-color']) => {
  return properties.map(prop => `${prop} 0.3s ease`).join(', ');
};

export const isSystemDarkMode = () => {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
};

export const watchSystemTheme = (callback) => {
  if (!window.matchMedia) return null;
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', callback);
  
  return () => mediaQuery.removeEventListener('change', callback);
};

export const getThemeFromStorage = () => {
  try {
    return localStorage.getItem('theme') || 'light';
  } catch {
    return 'light';
  }
};

export const saveThemeToStorage = (theme) => {
  try {
    localStorage.setItem('theme', theme);
  } catch (error) {
    console.warn('Failed to save theme to localStorage:', error);
  }
};

export const initializeTheme = () => {
  const savedTheme = getThemeFromStorage();
  const systemTheme = isSystemDarkMode() ? 'dark' : 'light';
  const theme = savedTheme || systemTheme;
  
  document.documentElement.setAttribute('data-theme', theme);
  return theme;
};
