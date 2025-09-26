// Simplified validation utility to fix validation errors
export const validateField = (field, value, type = 'text') => {
  if (!value || value.trim() === '') {
    return `${field} is required`;
  }
  
  switch (type) {
    case 'email':
      if (!value.includes('@') || !value.includes('.')) {
        return 'Please enter a valid email address';
      }
      break;
    case 'password':
      if (value.length < 6) {
        return 'Password must be at least 6 characters';
      }
      break;
    case 'message':
      if (value.trim().length < 5) {
        return 'Message must be at least 5 characters';
      }
      break;
    default:
      if (value.trim().length < 2) {
        return `${field} must be at least 2 characters`;
      }
  }
  
  return null; // No error
};

export const validateForm = (formData, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const rule = rules[field];
    const value = formData[field];
    const error = validateField(field, value, rule.type);
    
    if (error) {
      errors[field] = error;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
