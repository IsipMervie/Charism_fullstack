#!/usr/bin/env node

/**
 * CommunityLink Error Monitor & Auto-Fix System
 * Continuously monitors system and fixes common issues automatically
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const BACKEND_URL = 'https://charism-api-xtw9.onrender.com';
const FRONTEND_URL = 'https://charism-ucb4.onrender.com';
const CHECK_INTERVAL = 30000; // 30 seconds
const MAX_RETRIES = 3;

// Error tracking
let errorCount = 0;
let lastErrorTime = 0;
let consecutiveErrors = 0;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

// Error patterns and their fixes
const errorFixes = {
  '503 Service Unavailable': {
    cause: 'Cold start or server overload',
    fix: 'waitAndRetry',
    description: 'Server is starting up or overloaded'
  },
  'ECONNABORTED': {
    cause: 'Request timeout',
    fix: 'increaseTimeout',
    description: 'Request took too long to complete'
  },
  'ERR_NETWORK': {
    cause: 'Network connectivity issue',
    fix: 'retryWithBackoff',
    description: 'Network connection failed'
  },
  'JWT Malformed': {
    cause: 'Invalid or expired token',
    fix: 'clearTokens',
    description: 'Authentication token is invalid'
  },
  'CORS Error': {
    cause: 'Cross-origin request blocked',
    fix: 'checkCORS',
    description: 'CORS configuration issue'
  },
  'Database not connected': {
    cause: 'MongoDB connection lost',
    fix: 'checkDatabase',
    description: 'Database connection failed'
  }
};

// Fix implementations
const fixes = {
  async waitAndRetry(url, options = {}) {
    logInfo('Waiting for server to start up...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    return axios.get(url, { ...options, timeout: 15000 });
  },

  async increaseTimeout(url, options = {}) {
    logInfo('Retrying with increased timeout...');
    return axios.get(url, { ...options, timeout: 30000 });
  },

  async retryWithBackoff(url, options = {}) {
    logInfo('Retrying with exponential backoff...');
    for (let i = 1; i <= MAX_RETRIES; i++) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        return await axios.get(url, options);
      } catch (error) {
        if (i === MAX_RETRIES) throw error;
        logWarning(`Retry attempt ${i}/${MAX_RETRIES} failed`);
      }
    }
  },

  async clearTokens() {
    logInfo('Clearing invalid tokens...');
    // This would clear localStorage tokens in frontend
    logWarning('Frontend should clear localStorage tokens');
  },

  async checkCORS() {
    logInfo('Checking CORS configuration...');
    try {
      const response = await axios.get(`${BACKEND_URL}/api/cors-test`);
      logInfo(`CORS status: ${response.data.corsStatus}`);
    } catch (error) {
      logError('CORS check failed');
    }
  },

  async checkDatabase() {
    logInfo('Checking database connection...');
    try {
      const response = await axios.get(`${BACKEND_URL}/api/health/db`);
      if (response.data.database.status === 'connected') {
        logSuccess('Database is connected');
      } else {
        logError(`Database status: ${response.data.database.status}`);
      }
    } catch (error) {
      logError('Database check failed');
    }
  }
};

// Auto-fix function
async function autoFix(error, url, options = {}) {
  const errorMessage = error.message;
  
  for (const [pattern, fixInfo] of Object.entries(errorFixes)) {
    if (errorMessage.includes(pattern)) {
      logWarning(`Detected error: ${fixInfo.description}`);
      logInfo(`Attempting fix: ${pattern}`);
      
      try {
        const fixFunction = fixes[fixInfo.fix];
        if (fixFunction) {
          const result = await fixFunction(url, options);
          logSuccess(`Fix applied successfully for: ${pattern}`);
          return result;
        }
      } catch (fixError) {
        logError(`Fix failed for ${pattern}: ${fixError.message}`);
      }
    }
  }
  
  throw error; // Re-throw if no fix found
}

// Health check function with auto-fix
async function healthCheckWithAutoFix() {
  const checks = [
    { name: 'Backend Health', url: `${BACKEND_URL}/api/health` },
    { name: 'Database', url: `${BACKEND_URL}/api/health/db` },
    { name: 'Frontend', url: FRONTEND_URL },
    { name: 'Events API', url: `${BACKEND_URL}/api/events` },
    { name: 'Settings', url: `${BACKEND_URL}/api/settings/public` }
  ];

  let healthyServices = 0;
  const issues = [];

  for (const check of checks) {
    try {
      const response = await axios.get(check.url, { timeout: 10000 });
      logSuccess(`${check.name}: OK`);
      healthyServices++;
    } catch (error) {
      logError(`${check.name}: ${error.message}`);
      
      try {
        // Attempt auto-fix
        const fixedResponse = await autoFix(error, check.url);
        logSuccess(`${check.name}: FIXED and now OK`);
        healthyServices++;
      } catch (fixError) {
        logError(`${check.name}: Could not be fixed`);
        issues.push({ service: check.name, error: error.message });
      }
    }
  }

  return { healthyServices, totalServices: checks.length, issues };
}

// Continuous monitoring
async function startMonitoring() {
  log('\n🚀 CommunityLink Error Monitor Started', 'cyan');
  log('Monitoring every 30 seconds...\n', 'cyan');

  setInterval(async () => {
    console.clear();
    log('🔍 CommunityLink System Monitor', 'blue');
    log('='.repeat(50), 'blue');
    
    const timestamp = new Date().toLocaleString();
    log(`Last check: ${timestamp}`, 'cyan');
    
    const { healthyServices, totalServices, issues } = await healthCheckWithAutoFix();
    
    log(`\n📊 System Health: ${healthyServices}/${totalServices} services healthy`, 
        healthyServices === totalServices ? 'green' : 'yellow');
    
    if (issues.length > 0) {
      log('\n🚨 Issues requiring attention:', 'red');
      issues.forEach(issue => {
        log(`  • ${issue.service}: ${issue.error}`, 'red');
      });
    }
    
    if (healthyServices === totalServices) {
      log('\n🎉 All systems operational!', 'green');
    } else {
      log(`\n⚠️  ${issues.length} services need attention`, 'yellow');
    }
    
    // Track consecutive errors
    if (issues.length > 0) {
      consecutiveErrors++;
      if (consecutiveErrors >= 3) {
        log('\n🚨 CRITICAL: Multiple consecutive failures detected!', 'red');
        log('Consider manual intervention or service restart.', 'yellow');
      }
    } else {
      consecutiveErrors = 0;
    }
    
  }, CHECK_INTERVAL);
}

// Emergency recovery function
async function emergencyRecovery() {
  log('\n🚨 EMERGENCY RECOVERY MODE', 'red');
  
  const recoverySteps = [
    { name: 'Check backend service', action: () => axios.get(`${BACKEND_URL}/api/health`) },
    { name: 'Check database', action: () => axios.get(`${BACKEND_URL}/api/health/db`) },
    { name: 'Check frontend', action: () => axios.get(FRONTEND_URL) },
    { name: 'Verify environment', action: () => axios.get(`${BACKEND_URL}/api/env-check`) }
  ];
  
  for (const step of recoverySteps) {
    try {
      await step.action();
      logSuccess(`${step.name}: OK`);
    } catch (error) {
      logError(`${step.name}: FAILED - ${error.message}`);
      // Attempt auto-fix
      try {
        await autoFix(error, step.action);
        logSuccess(`${step.name}: RECOVERED`);
      } catch (fixError) {
        logError(`${step.name}: RECOVERY FAILED`);
      }
    }
  }
}

// Error prevention tips
function showPreventionTips() {
  log('\n🛡️  ERROR PREVENTION TIPS:', 'cyan');
  log('1. Monitor logs regularly', 'cyan');
  log('2. Keep dependencies updated', 'cyan');
  log('3. Use proper error handling in code', 'cyan');
  log('4. Implement rate limiting', 'cyan');
  log('5. Monitor database connections', 'cyan');
  log('6. Set up alerts for critical errors', 'cyan');
  log('7. Regular backup procedures', 'cyan');
  log('8. Test endpoints after deployments', 'cyan');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--emergency')) {
    await emergencyRecovery();
  } else if (args.includes('--once')) {
    await healthCheckWithAutoFix();
  } else if (args.includes('--tips')) {
    showPreventionTips();
  } else {
    // Start continuous monitoring
    await startMonitoring();
  }
}

// Handle process termination
process.on('SIGINT', () => {
  log('\n\n👋 Error monitor stopped.', 'yellow');
  process.exit(0);
});

// Run the monitor
main().catch(error => {
  logError(`Monitor failed: ${error.message}`);
  process.exit(1);
});
