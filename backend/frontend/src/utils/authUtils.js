// Utility function to get the correct user ID from multiple sources
export const getCurrentUserId = () => {
  // Try to get user ID from localStorage user object
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  let userId = currentUser._id || currentUser.userId || currentUser.id;
  
  // If no user ID found, try to get it from the JWT token
  if (!userId) {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Decode JWT token to get user ID
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        userId = tokenPayload.userId;
        console.log('Got user ID from token:', userId);
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }
  
  return userId;
};

// Utility function to check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const userId = getCurrentUserId();
  return !!(token && userId);
};

// Utility function to get user info
export const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
    return {};
  }
};
