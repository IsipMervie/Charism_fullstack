import React from 'react';

function DebugInfo() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = localStorage.getItem('role');
  const token = localStorage.getItem('token');

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f8f9fa', 
      border: '1px solid #dee2e6',
      borderRadius: '5px',
      margin: '20px',
      fontFamily: 'monospace'
    }}>
      <h3>🔍 Debug Information</h3>
      <div>
        <strong>User:</strong> {JSON.stringify(user, null, 2)}
      </div>
      <div>
        <strong>Role:</strong> {role || 'Not set'}
      </div>
      <div>
        <strong>Token:</strong> {token ? 'Present' : 'Not present'}
      </div>
      <div>
        <strong>Current URL:</strong> {window.location.href}
      </div>
      <div>
        <strong>User Agent:</strong> {navigator.userAgent}
      </div>
    </div>
  );
}

export default DebugInfo;
