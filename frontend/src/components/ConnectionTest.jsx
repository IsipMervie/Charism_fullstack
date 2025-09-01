import React, { useState } from 'react';
import { testBackendConnection, getConnectionSummary } from '../utils/testConnection';
import { API_URL } from '../config/environment';

const ConnectionTest = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [results, setResults] = useState(null);
  const [summary, setSummary] = useState(null);

  const runTest = async () => {
    setIsTesting(true);
    try {
      const testResults = await testBackendConnection();
      setResults(testResults);
      
      const testSummary = getConnectionSummary(testResults);
      setSummary(testSummary);
    } catch (error) {
      console.error('Connection test failed:', error);
      setResults({ error: error.message });
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-success';
      case 'partially_connected': return 'text-warning';
      case 'disconnected': return 'text-danger';
      default: return 'text-muted';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return '✅';
      case 'partially_connected': return '⚠️';
      case 'disconnected': return '❌';
      default: return '❓';
    }
  };

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">🔗 Backend Connection Test</h5>
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-6">
              <strong>Current API URL:</strong>
              <code className="ms-2">{API_URL}</code>
            </div>
            <div className="col-md-6">
              <strong>Current Hostname:</strong>
              <code className="ms-2">{window.location.hostname}</code>
            </div>
          </div>

          <button 
            className="btn btn-primary mb-3" 
            onClick={runTest}
            disabled={isTesting}
          >
            {isTesting ? '🔄 Testing...' : '🧪 Test Connection'}
          </button>

          {results && (
            <div className="mt-3">
              <h6>Test Results:</h6>
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Test</th>
                      <th>Status</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(results.tests || {}).map(([testName, testResult]) => (
                      <tr key={testName}>
                        <td>{testName}</td>
                        <td>
                          {testResult.success ? (
                            <span className="text-success">✅ Success</span>
                          ) : (
                            <span className="text-danger">❌ Failed</span>
                          )}
                        </td>
                        <td>
                          {testResult.success ? (
                            <small className="text-muted">
                              Status: {testResult.status}, 
                              Time: {testResult.responseTime}ms
                            </small>
                          ) : (
                            <small className="text-danger">
                              {testResult.error || `HTTP ${testResult.status}`}
                            </small>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {summary && (
            <div className="mt-3">
              <h6>Connection Summary:</h6>
              <div className={`alert alert-${summary.overall === 'connected' ? 'success' : summary.overall === 'partially_connected' ? 'warning' : 'danger'}`}>
                <strong>
                  {getStatusIcon(summary.overall)} Status: {summary.overall.replace('_', ' ').toUpperCase()}
                </strong>
                {summary.issues.length > 0 && (
                  <div className="mt-2">
                    <strong>Issues:</strong>
                    <ul className="mb-0 mt-1">
                      {summary.issues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {summary.recommendations.length > 0 && (
                  <div className="mt-2">
                    <strong>Recommendations:</strong>
                    <ul className="mb-0 mt-1">
                      {summary.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {results?.error && (
            <div className="alert alert-danger mt-3">
              <strong>Test Error:</strong> {results.error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectionTest;
