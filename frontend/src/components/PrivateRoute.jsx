// frontend/src/components/PrivateRoute.jsx

import React from 'react';
import { Navigate } from 'react-router-dom';

function PrivateRoute({ children, requiredRoles }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role || localStorage.getItem('role');

  // Debug logging
  console.log('🔒 PrivateRoute - Checking access:', {
    path: window.location.pathname,
    user: user,
    role: role,
    requiredRoles: requiredRoles,
    hasUserId: !!user._id,
    isAuthenticated: !!(user && user._id),
    isAuthorized: requiredRoles ? requiredRoles.includes(role) : true
  });

  if (!user || !user._id) {
    // Not logged in
    console.log('❌ PrivateRoute - User not authenticated, redirecting to login');
    return <Navigate to="/login" />;
  }

  if (requiredRoles && !requiredRoles.includes(role)) {
    // Role not authorized
    console.log(`❌ PrivateRoute - User role '${role}' not authorized for roles: ${requiredRoles.join(', ')}`);
    return <Navigate to="/" />;
  }

  console.log('✅ PrivateRoute - Access granted');
  return children;
}

export default PrivateRoute;
