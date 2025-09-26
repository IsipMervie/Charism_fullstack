// User-friendly validation messages
export const validationMessages = {
  required: (field) => `Please enter your ${field}`,
  email: 'Please enter a valid email address',
  password: 'Password must be at least 6 characters long',
  passwordMatch: 'Passwords do not match',
  message: 'Please enter a message (at least 5 characters)',
  name: 'Please enter your name (at least 2 characters)',
  serverError: 'Server is temporarily unavailable. Please try again in a moment.',
  networkError: 'Network connection issue. Please check your internet and try again.',
  timeout: 'Request is taking longer than usual. Please try again.'
};

export const getValidationMessage = (error) => {
  if (error.includes('required')) return 'This field is required';
  if (error.includes('email')) return 'Please enter a valid email';
  if (error.includes('password')) return 'Password must be at least 6 characters';
  if (error.includes('message')) return 'Message must be at least 5 characters';
  if (error.includes('timeout')) return 'Server is slow. Please try again.';
  return error;
};
