import React from 'react';
import { useLocation } from 'react-router-dom';

function DebugInfo() {
  const location = useLocation();
  
  // Get user info from localStorage
  const getUserInfo = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const role = localStorage.getItem('role');
      const token = localStorage.getItem('token');
      
      return {
        user,
        role,
        token: token ? `${token.substring(0, 20)}...` : 'None',
        hasUserId: !!user._id,
        userRole: user.role
      };
    } catch (error) {
      return { error: error.message };
    }
  };

  const userInfo = getUserInfo();

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <div><strong>🔍 Debug Info</strong></div>
      <div>Path: {location.pathname}</div>
      <div>User ID: {userInfo.hasUserId ? '✅' : '❌'}</div>
      <div>Role: {userInfo.role || 'None'}</div>
      <div>User Role: {userInfo.userRole || 'None'}</div>
      <div>Token: {userInfo.token}</div>
      {userInfo.error && <div style={{color: 'red'}}>Error: {userInfo.error}</div>}
    </div>
  );
}

export default DebugInfo;
