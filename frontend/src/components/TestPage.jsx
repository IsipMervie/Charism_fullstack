import React from 'react';
import DebugInfo from './DebugInfo';

function TestPage() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Test Page Working!</h1>
      <p>If you can see this, routing is working correctly.</p>
      <p>Current time: {new Date().toLocaleString()}</p>
      <DebugInfo />
    </div>
  );
}

export default TestPage;
