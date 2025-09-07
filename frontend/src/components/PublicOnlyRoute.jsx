// frontend/src/components/PublicOnlyRoute.jsx

import React from 'react';
import { Navigate } from 'react-router-dom';

function PublicOnlyRoute({ children }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Debug logging
  console.log('🌐 PublicOnlyRoute - Checking access:', {
    path: window.location.pathname,
    user: user,
    hasUserId: !!user._id,
    isAuthenticated: !!(user && user._id)
  });

  if (user && user._id) {
    // User is logged in, redirect to home
    console.log('❌ PublicOnlyRoute - User is authenticated, redirecting to home');
    return <Navigate to="/" />;
  }

  console.log('✅ PublicOnlyRoute - Access granted to public user');
  return children;
}

export default PublicOnlyRoute;
