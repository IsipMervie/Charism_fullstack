import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ImageDiagnostic = ({ eventId, eventTitle }) => {
  const [diagnosticInfo, setDiagnosticInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runDiagnostic = async () => {
    if (!eventId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'https://charism-api-xtw9.onrender.com'}/api/files/event-image/${eventId}/debug`);
      setDiagnosticInfo(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      runDiagnostic();
    }
  }, [eventId]);

  if (!eventId) {
    return <div>No event ID provided</div>;
  }

  return (
    <div style={{ 
      padding: '10px', 
      border: '1px solid #ccc', 
      borderRadius: '5px', 
      margin: '10px 0',
      backgroundColor: '#f9f9f9'
    }}>
      <h4>🖼️ Image Diagnostic for: {eventTitle}</h4>
      <p><strong>Event ID:</strong> {eventId}</p>
      
      {loading && <p>Loading diagnostic info...</p>}
      
      {error && (
        <div style={{ color: 'red' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {diagnosticInfo && (
        <div>
          <h5>Image Status:</h5>
          <ul>
            <li><strong>Has Image:</strong> {diagnosticInfo.hasImage ? '✅ YES' : '❌ NO'}</li>
            <li><strong>Image Type:</strong> {diagnosticInfo.imageType}</li>
            <li><strong>Valid for Serving:</strong> {diagnosticInfo.isValidForServing ? '✅ YES' : '❌ NO'}</li>
          </ul>
          
          {diagnosticInfo.imageStructure && (
            <div>
              <h5>Image Structure:</h5>
              <ul>
                <li><strong>Has Data:</strong> {diagnosticInfo.imageStructure.hasData ? '✅ YES' : '❌ NO'}</li>
                <li><strong>Data Length:</strong> {diagnosticInfo.imageStructure.dataLength} bytes</li>
                <li><strong>Has Content Type:</strong> {diagnosticInfo.imageStructure.hasContentType ? '✅ YES' : '❌ NO'}</li>
                <li><strong>Content Type:</strong> {diagnosticInfo.imageStructure.contentType || 'N/A'}</li>
                <li><strong>Has Filename:</strong> {diagnosticInfo.imageStructure.hasFilename ? '✅ YES' : '❌ NO'}</li>
                <li><strong>Filename:</strong> {diagnosticInfo.imageStructure.filename || 'N/A'}</li>
                <li><strong>Uploaded At:</strong> {diagnosticInfo.imageStructure.uploadedAt || 'N/A'}</li>
              </ul>
            </div>
          )}
          
          <div style={{ marginTop: '10px' }}>
            <button onClick={runDiagnostic} style={{ 
              padding: '5px 10px', 
              backgroundColor: '#007bff', 
              color: 'var(--text-inverse)', 
              border: 'none', 
              borderRadius: '3px',
              cursor: 'pointer'
            }}>
              🔄 Refresh Diagnostic
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageDiagnostic;

