// frontend/src/components/PrivateRoute.jsx

import React from 'react';
import { Navigate } from 'react-router-dom';

function PrivateRoute({ children, requiredRoles }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role || localStorage.getItem('role');

  if (!user || !user._id) {
    // Not logged in
    return <Navigate to="/login" />;
  }

  if (requiredRoles && !requiredRoles.includes(role)) {
    // Role not authorized
    return <Navigate to="/" />;
  }

  return children;
}

export default PrivateRoute;
