// Simple connection test utility
import { API_URL } from '../config/environment';

export const testBackendConnection = async () => {
  const results = {
    timestamp: new Date().toISOString(),
    apiUrl: API_URL,
    tests: {}
  };

  console.log('🔍 Testing backend connection...');
  console.log('🌐 API URL:', API_URL);
  console.log('🏠 Current hostname:', window.location.hostname);

  // Test 1: Basic health check
  try {
    console.log('📡 Testing health endpoint...');
    const startTime = Date.now();
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const endTime = Date.now();
    
    if (response.ok) {
      const data = await response.json();
      results.tests.health = {
        success: true,
        status: response.status,
        responseTime: endTime - startTime,
        data: data
      };
      console.log('✅ Health check successful:', data);
    } else {
      results.tests.health = {
        success: false,
        status: response.status,
        error: `HTTP ${response.status}`
      };
      console.log('❌ Health check failed:', response.status);
    }
  } catch (error) {
    results.tests.health = {
      success: false,
      error: error.message,
      code: error.code
    };
    console.log('❌ Health check error:', error.message);
  }

  // Test 2: Test endpoint
  try {
    console.log('📡 Testing test endpoint...');
    const startTime = Date.now();
    const response = await fetch(`${API_URL}/test`, {
      method: 'GET',
      mode: 'cors'
    });
    const endTime = Date.now();
    
    if (response.ok) {
      const data = await response.json();
      results.tests.test = {
        success: true,
        status: response.status,
        responseTime: endTime - startTime,
        data: data
      };
      console.log('✅ Test endpoint successful:', data);
    } else {
      results.tests.test = {
        success: false,
        status: response.status,
        error: `HTTP ${response.status}`
      };
      console.log('❌ Test endpoint failed:', response.status);
    }
  } catch (error) {
    results.tests.test = {
      success: false,
      error: error.message,
      code: error.code
    };
    console.log('❌ Test endpoint error:', error.message);
  }

  // Test 3: Frontend test endpoint
  try {
    console.log('📡 Testing frontend-test endpoint...');
    const startTime = Date.now();
    const response = await fetch(`${API_URL}/frontend-test`, {
      method: 'GET',
      mode: 'cors'
    });
    const endTime = Date.now();
    
    if (response.ok) {
      const data = await response.json();
      results.tests.frontendTest = {
        success: true,
        status: response.status,
        responseTime: endTime - startTime,
        data: data
      };
      console.log('✅ Frontend test endpoint successful:', data);
    } else {
      results.tests.frontendTest = {
        success: false,
        status: response.status,
        error: `HTTP ${response.status}`
      };
      console.log('❌ Frontend test endpoint failed:', response.status);
    }
  } catch (error) {
    results.tests.frontendTest = {
      success: false,
      error: error.message,
      code: error.code
    };
    console.log('❌ Frontend test endpoint error:', error.message);
  }

  console.log('📊 Connection test results:', results);
  return results;
};

export const getConnectionSummary = (results) => {
  const summary = {
    overall: 'unknown',
    issues: [],
    recommendations: []
  };

  // Check each test
  Object.entries(results.tests).forEach(([testName, testResult]) => {
    if (!testResult.success) {
      summary.issues.push(`${testName} failed: ${testResult.error || testResult.status}`);
    }
  });

  // Determine overall status
  if (summary.issues.length === 0) {
    summary.overall = 'connected';
    summary.recommendations.push('All tests passed - backend is accessible');
  } else if (summary.issues.length <= 2) {
    summary.overall = 'partially_connected';
    summary.recommendations.push('Some endpoints are accessible, check specific failures');
  } else {
    summary.overall = 'disconnected';
    summary.recommendations.push('Backend appears to be unreachable');
    summary.recommendations.push('Check if backend is deployed and running');
    summary.recommendations.push('Verify API URL configuration');
  }

  return summary;
};
