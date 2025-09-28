import React, { useState, useEffect } from 'react';

const ImageUrlTester = ({ event }) => {
  const [testResults, setTestResults] = useState([]);
  const [isTesting, setIsTesting] = useState(false);

  const testImageUrl = async (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      const timeout = setTimeout(() => {
        resolve({ url, success: false, error: 'Timeout' });
      }, 5000);

      img.onload = () => {
        clearTimeout(timeout);
        resolve({ url, success: true });
      };

      img.onerror = () => {
        clearTimeout(timeout);
        resolve({ url, success: false, error: 'Load failed' });
      };

      img.src = url;
    });
  };

  const runTests = async () => {
    if (!event) return;

    setIsTesting(true);
    setTestResults([]);

    const imageData = event.image;
    const eventId = event._id;
    
    console.log('🧪 Testing image URLs for event:', {
      eventId,
      imageData,
      eventTitle: event.title
    });

    const testUrls = [];

    // Generate test URLs
    if (eventId) {
      testUrls.push(
        `https://charism-backend.vercel.app/api/files/event-image/${eventId}`,
        `https://charism-backend.vercel.app/files/event-image/${eventId}`,
        `https://charism-backend.vercel.app/uploads/events/${eventId}`,
        `https://charism-backend.vercel.app/uploads/${eventId}`,
        `/uploads/events/${eventId}`,
        `/uploads/${eventId}`
      );
    }

    if (imageData) {
      let filename = '';
      
      if (typeof imageData === 'string' && imageData.length > 0) {
        filename = imageData.startsWith('/') ? imageData.slice(1) : imageData;
      } else if (imageData.url && typeof imageData.url === 'string') {
        filename = imageData.url.startsWith('/') ? imageData.url.slice(1) : imageData.url;
      }
      
      if (filename) {
        testUrls.push(
          `https://charism-backend.vercel.app/uploads/${filename}`,
          `https://charism-backend.vercel.app/files/${filename}`,
          `https://charism-backend.vercel.app/api/uploads/${filename}`,
          `/uploads/${filename}`,
          `/images/${filename}`,
          filename
        );
      }
    }

    // Test default image
    testUrls.push('https://charism-api-xtw9.onrender.com/api/files/event-image/default');

    console.log('🔍 Testing URLs:', testUrls);

    // Test each URL
    const results = [];
    for (const url of testUrls) {
      const result = await testImageUrl(url);
      results.push(result);
      console.log(`${result.success ? '✅' : '❌'} ${url}: ${result.success ? 'SUCCESS' : result.error}`);
    }

    setTestResults(results);
    setIsTesting(false);
  };

  useEffect(() => {
    if (event) {
      runTests();
    }
  }, [event]);

  if (!event) {
    return <div>No event data</div>;
  }

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #ccc', 
      margin: '10px', 
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>🧪 Image URL Tester</h3>
      <p><strong>Event:</strong> {event.title}</p>
      <p><strong>Event ID:</strong> {event._id}</p>
      <p><strong>Image Data:</strong> {JSON.stringify(event.image, null, 2)}</p>
      
      <button 
        onClick={runTests} 
        disabled={isTesting}
        style={{
          padding: '10px 20px',
          backgroundColor: isTesting ? '#ccc' : '#007bff',
          color: 'var(--text-inverse)',
          border: 'none',
          borderRadius: '4px',
          cursor: isTesting ? 'not-allowed' : 'pointer'
        }}
      >
        {isTesting ? 'Testing...' : 'Test Image URLs'}
      </button>

      {testResults.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h4>Test Results:</h4>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {testResults.map((result, index) => (
              <div 
                key={index}
                style={{
                  padding: '5px',
                  margin: '2px 0',
                  backgroundColor: result.success ? '#d4edda' : '#f8d7da',
                  border: `1px solid ${result.success ? '#c3e6cb' : '#f5c6cb'}`,
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'monospace'
                }}
              >
                <span style={{ fontWeight: 'bold' }}>
                  {result.success ? '✅' : '❌'}
                </span>
                {' '}
                <span style={{ color: result.success ? '#155724' : '#721c24' }}>
                  {result.url}
                </span>
                {!result.success && (
                  <span style={{ color: '#721c24', marginLeft: '10px' }}>
                    ({result.error})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUrlTester;
