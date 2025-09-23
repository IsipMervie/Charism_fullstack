// Server Status Checker Utility
// This helps diagnose backend server issues

export const checkServerStatus = async () => {
  const serverUrl = process.env.REACT_APP_API_URL || 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? 'http://localhost:10000/api' 
      : 'https://charism-backend.vercel.app/api');
  
  console.log('🔍 Checking server status...');
  console.log('🌐 Server URL:', serverUrl);
  
  const results = {
    serverUrl,
    timestamp: new Date().toISOString(),
    checks: []
  };
  
  // Test 1: Basic connectivity
  try {
    console.log('📡 Test 1: Basic connectivity...');
    const startTime = Date.now();
    
    const response = await fetch(`${serverUrl}/health`, {
      method: 'GET',
      mode: 'cors',
      timeout: 10000
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    results.checks.push({
      test: 'Basic Connectivity',
      status: 'SUCCESS',
      responseTime: `${responseTime}ms`,
      statusCode: response.status,
      details: `Server responded in ${responseTime}ms`
    });
    
    console.log('✅ Basic connectivity: SUCCESS');
  } catch (error) {
    results.checks.push({
      test: 'Basic Connectivity',
      status: 'FAILED',
      error: error.message,
      code: error.code,
      details: `Connection failed: ${error.message}`
    });
    
    console.error('❌ Basic connectivity: FAILED', error.message);
  }
  
  // Test 2: DNS Resolution
  try {
    console.log('🌍 Test 2: DNS Resolution...');
    const url = new URL(serverUrl);
    const hostname = url.hostname;
    
    // Try to resolve the hostname
    const response = await fetch(`https://${hostname}`, {
      method: 'HEAD',
      mode: 'no-cors',
      timeout: 5000
    });
    
    results.checks.push({
      test: 'DNS Resolution',
      status: 'SUCCESS',
      hostname: hostname,
      details: 'Hostname resolves correctly'
    });
    
    console.log('✅ DNS Resolution: SUCCESS');
  } catch (error) {
    results.checks.push({
      test: 'DNS Resolution',
      status: 'FAILED',
      error: error.message,
      details: `DNS resolution failed: ${error.message}`
    });
    
    console.error('❌ DNS Resolution: FAILED', error.message);
  }
  
  // Test 3: CORS Headers
  try {
    console.log('🔒 Test 3: CORS Headers...');
    const response = await fetch(`${serverUrl}/health`, {
      method: 'OPTIONS',
      mode: 'cors',
      headers: {
        'Origin': window.location.origin,
        'Access-Control-Request-Method': 'GET'
      }
    });
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
    };
    
    results.checks.push({
      test: 'CORS Headers',
      status: 'SUCCESS',
      corsHeaders: corsHeaders,
      details: 'CORS headers present'
    });
    
    console.log('✅ CORS Headers: SUCCESS');
  } catch (error) {
    results.checks.push({
      test: 'CORS Headers',
      status: 'FAILED',
      error: error.message,
      details: `CORS check failed: ${error.message}`
    });
    
    console.error('❌ CORS Headers: FAILED', error.message);
  }
  
  // Summary
  const successCount = results.checks.filter(check => check.status === 'SUCCESS').length;
  const totalCount = results.checks.length;
  
  results.summary = {
    totalTests: totalCount,
    passedTests: successCount,
    failedTests: totalCount - successCount,
    overallStatus: successCount === totalCount ? 'HEALTHY' : 'ISSUES_DETECTED'
  };
  
  console.log('📊 Server Status Summary:', results.summary);
  
  return results;
};

// Quick server health check
export const quickHealthCheck = async () => {
  try {
    const serverUrl = process.env.REACT_APP_API_URL || 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:10000/api' 
        : 'https://charism-backend.vercel.app/api');
    const response = await fetch(`${serverUrl}/health`, {
      method: 'GET',
      mode: 'cors',
      timeout: 5000
    });
    
    if (response.ok) {
      return { status: 'healthy', responseTime: 'fast' };
    } else {
      return { status: 'unhealthy', statusCode: response.status };
    }
  } catch (error) {
    return { 
      status: 'unreachable', 
      error: error.message,
      code: error.code 
    };
  }
};
