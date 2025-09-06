# Theme System Guide

## Overview
The application now supports both Light and Dark themes with automatic system preference detection and manual theme switching.

## Features

### ✅ **Implemented Features**
- **Light & Dark Theme Support**: Complete theme system with CSS variables
- **Theme Toggle**: Accessible toggle button in navigation bar
- **System Preference Detection**: Automatically detects user's system theme preference
- **Persistent Storage**: Theme preference is saved in localStorage
- **Smooth Transitions**: All theme changes include smooth transitions
- **Mobile Support**: Theme toggle adapts to mobile screens
- **Accessibility**: Proper ARIA labels and focus management
- **Meta Theme Color**: Updates browser theme color for mobile devices

### 🎨 **Theme Colors**

#### Light Theme
- **Primary Background**: `#ffffff`
- **Secondary Background**: `#f8fafc`
- **Primary Text**: `#1e293b`
- **Secondary Text**: `#64748b`
- **Primary Color**: `#2563eb`
- **Borders**: `#e2e8f0`

#### Dark Theme
- **Primary Background**: `#0f172a`
- **Secondary Background**: `#1e293b`
- **Primary Text**: `#f8fafc`
- **Secondary Text**: `#cbd5e1`
- **Primary Color**: `#3b82f6`
- **Borders**: `#334155`

## File Structure

```
frontend/src/
├── contexts/
│   └── ThemeContext.js          # Theme context and provider
├── components/
│   ├── ThemeToggle.jsx          # Theme toggle component
│   └── ThemeToggle.css          # Theme toggle styling
├── styles/
│   └── themes.css               # CSS variables for both themes
├── utils/
│   └── themeUtils.js            # Theme utility functions
└── App.css                      # Updated with theme variables
```

## Usage

### Using Theme Context
```jsx
import { useTheme } from '../contexts/ThemeContext';

function MyComponent() {
  const { theme, toggleTheme, isDark, isLight } = useTheme();
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={toggleTheme}>
        Switch to {isDark ? 'Light' : 'Dark'} mode
      </button>
    </div>
  );
}
```

### Using CSS Variables
```css
.my-component {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  box-shadow: var(--shadow-md);
}
```

### Using Theme Utilities
```jsx
import { getThemeColors, createThemeAwareStyle } from '../utils/themeUtils';

const colors = getThemeColors('dark');
const styles = createThemeAwareStyle({
  backgroundColor: '{{background}}',
  color: '{{text}}'
}, 'dark');
```

## Components Updated

### ✅ **Fully Updated**
- **App.css**: Global theme variables and body styling
- **NavigationBar**: Theme-aware styling and theme toggle
- **CreateEventPage**: Background and card styling
- **LoginPage**: Background and card styling
- **EventListPage**: Background and card styling
- **ThemeToggle**: Complete theme toggle component

### 🔄 **Partially Updated**
- **Other Components**: Will automatically inherit theme colors through CSS variables

## CSS Variables Available

### Background Colors
- `--bg-primary`: Main background color
- `--bg-secondary`: Secondary background color
- `--bg-tertiary`: Tertiary background color
- `--bg-card`: Card background color
- `--bg-hover`: Hover state background
- `--bg-input`: Input background color
- `--bg-modal`: Modal background color

### Text Colors
- `--text-primary`: Primary text color
- `--text-secondary`: Secondary text color
- `--text-tertiary`: Tertiary text color
- `--text-inverse`: Inverse text color

### Border Colors
- `--border-primary`: Primary border color
- `--border-secondary`: Secondary border color
- `--border-focus`: Focus border color

### Brand Colors
- `--primary`: Primary brand color
- `--secondary`: Secondary brand color
- `--success`: Success color
- `--warning`: Warning color
- `--error`: Error color
- `--info`: Info color

### Shadows
- `--shadow-sm`: Small shadow
- `--shadow-md`: Medium shadow
- `--shadow-lg`: Large shadow
- `--shadow-xl`: Extra large shadow

### Transitions
- `--transition-fast`: Fast transition (0.15s)
- `--transition-normal`: Normal transition (0.3s)
- `--transition-slow`: Slow transition (0.5s)

## Browser Support

- **Chrome**: ✅ Full support
- **Firefox**: ✅ Full support
- **Safari**: ✅ Full support
- **Edge**: ✅ Full support
- **Mobile Browsers**: ✅ Full support with theme-color meta tag

## Accessibility Features

- **Reduced Motion Support**: Respects `prefers-reduced-motion` setting
- **High Contrast**: Proper contrast ratios in both themes
- **Focus Management**: Visible focus indicators
- **ARIA Labels**: Proper labeling for screen readers
- **Keyboard Navigation**: Full keyboard support

## Performance Considerations

- **CSS Variables**: Efficient theme switching without JavaScript
- **Smooth Transitions**: Hardware-accelerated transitions
- **Minimal Re-renders**: Context only updates when theme changes
- **Cached Preferences**: localStorage for instant theme loading

## Future Enhancements

### 🚀 **Planned Features**
- **Custom Theme Colors**: Allow users to customize theme colors
- **Theme Presets**: Multiple dark/light theme variations
- **Auto Theme**: Time-based theme switching (day/night)
- **Component-Level Themes**: Individual component theme overrides
- **Theme Animations**: More sophisticated theme transition animations

## Troubleshooting

### Common Issues

1. **Theme not persisting**: Check localStorage permissions
2. **Slow theme switching**: Ensure CSS variables are properly defined
3. **Mobile theme color not updating**: Verify meta theme-color tag
4. **Inconsistent colors**: Check CSS variable definitions in themes.css

### Debug Mode
```jsx
// Add to ThemeContext for debugging
console.log('Current theme:', theme);
console.log('Theme variables:', getComputedStyle(document.documentElement));
```

## Migration Guide

### For Existing Components

1. **Replace hardcoded colors** with CSS variables:
   ```css
   /* Before */
   background-color: #ffffff;
   
   /* After */
   background-color: var(--bg-primary);
   ```

2. **Update component imports** to include ThemeContext if needed:
   ```jsx
   import { useTheme } from '../contexts/ThemeContext';
   ```

3. **Test both themes** to ensure proper contrast and readability.

## Contributing

When adding new components or updating existing ones:

1. **Use CSS variables** instead of hardcoded colors
2. **Test both themes** during development
3. **Follow accessibility guidelines** for contrast ratios
4. **Add theme-aware transitions** for smooth user experience
5. **Update this documentation** if adding new theme features

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Maintainer**: Development Team
