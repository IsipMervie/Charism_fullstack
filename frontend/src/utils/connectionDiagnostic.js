// Connection Diagnostic Utility
import { API_URL } from '../config/environment';

export const runConnectionDiagnostic = async () => {
  const results = {
    timestamp: new Date().toISOString(),
    environment: {
      apiUrl: API_URL,
      hostname: window.location.hostname,
      protocol: window.location.protocol,
      userAgent: navigator.userAgent
    },
    tests: {}
  };

  // Test 1: Basic connectivity
  try {
    const startTime = Date.now();
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const endTime = Date.now();
    
    results.tests.basicConnectivity = {
      success: response.ok,
      status: response.status,
      responseTime: endTime - startTime,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    results.tests.basicConnectivity = {
      success: false,
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    };
  }

  // Test 2: CORS preflight
  try {
    const startTime = Date.now();
    const response = await fetch(`${API_URL}/health`, {
      method: 'OPTIONS',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test'
      }
    });
    const endTime = Date.now();
    
    results.tests.corsPreflight = {
      success: true,
      status: response.status,
      responseTime: endTime - startTime,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    results.tests.corsPreflight = {
      success: false,
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    };
  }

  // Test 3: Network information
  if ('connection' in navigator) {
    results.tests.networkInfo = {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt,
      saveData: navigator.connection.saveData
    };
  }

  // Test 4: DNS resolution
  try {
    const url = new URL(API_URL);
    const startTime = Date.now();
    const response = await fetch(`${url.origin}/health`, {
      method: 'GET',
      mode: 'cors'
    });
    const endTime = Date.now();
    
    results.tests.dnsResolution = {
      success: response.ok,
      responseTime: endTime - startTime,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    results.tests.dnsResolution = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }

  return results;
};

export const getDiagnosticSummary = (results) => {
  const summary = {
    overall: 'unknown',
    issues: [],
    recommendations: []
  };

  // Check basic connectivity
  if (!results.tests.basicConnectivity?.success) {
    summary.issues.push('Basic connectivity failed');
    summary.recommendations.push('Check internet connection');
    summary.recommendations.push('Verify server is running');
  }

  // Check CORS
  if (!results.tests.corsPreflight?.success) {
    summary.issues.push('CORS preflight failed');
    summary.recommendations.push('Check server CORS configuration');
  }

  // Check response times
  if (results.tests.basicConnectivity?.responseTime > 5000) {
    summary.issues.push('Slow response time');
    summary.recommendations.push('Server may be overloaded');
  }

  // Determine overall status
  if (summary.issues.length === 0) {
    summary.overall = 'healthy';
  } else if (summary.issues.length <= 2) {
    summary.overall = 'degraded';
  } else {
    summary.overall = 'unhealthy';
  }

  return summary;
};
