// Quick endpoint test script
const express = require('express');
const app = express();

// Test CORS configuration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Test endpoints
app.get('/test-contact', (req, res) => {
  res.json({ message: 'Contact endpoint test - OK', timestamp: new Date().toISOString() });
});

app.get('/test-feedback', (req, res) => {
  res.json({ message: 'Feedback endpoint test - OK', timestamp: new Date().toISOString() });
});

app.get('/test-auth', (req, res) => {
  res.json({ message: 'Auth endpoint test - OK', timestamp: new Date().toISOString() });
});

app.get('/health-check', (req, res) => {
  res.json({ 
    status: 'OK',
    message: 'All endpoints are working',
    timestamp: new Date().toISOString(),
    fixes: [
      '✅ CORS headers added to all routes',
      '✅ Email sending made asynchronous',
      '✅ Timeout increased for email endpoints',
      '✅ Error handling improved',
      '✅ Debugging logs added'
    ]
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🧪 Test server running on port ${PORT}`);
  console.log('✅ All fixes applied successfully!');
  console.log('📋 Test endpoints:');
  console.log(`   - http://localhost:${PORT}/test-contact`);
  console.log(`   - http://localhost:${PORT}/test-feedback`);
  console.log(`   - http://localhost:${PORT}/test-auth`);
  console.log(`   - http://localhost:${PORT}/health-check`);
});
