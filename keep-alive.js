#!/usr/bin/env node

/**
 * CommunityLink Keep-Alive Script
 * Prevents Render.com free tier cold starts by pinging services regularly
 */

const axios = require('axios');

// Configuration
const SERVICES = [
  {
    name: 'Backend API',
    url: 'https://charism-api-xtw9.onrender.com/api/health',
    interval: 300000, // 5 minutes
    timeout: 10000
  },
  {
    name: 'Frontend',
    url: 'https://charism-ucb4.onrender.com',
    interval: 300000, // 5 minutes
    timeout: 10000
  }
];

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

// Ping a service to keep it alive
async function pingService(service) {
  try {
    const startTime = Date.now();
    const response = await axios.get(service.url, { 
      timeout: service.timeout,
      headers: {
        'User-Agent': 'CommunityLink-KeepAlive/1.0'
      }
    });
    const responseTime = Date.now() - startTime;
    
    log(`✅ ${service.name}: OK (${responseTime}ms)`, 'green');
    return { success: true, responseTime };
  } catch (error) {
    log(`❌ ${service.name}: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

// Keep alive function
async function keepAlive() {
  log('\n🔄 Keep-Alive Ping Started', 'cyan');
  log(`⏰ ${new Date().toLocaleString()}`, 'cyan');
  
  const results = await Promise.all(
    SERVICES.map(service => pingService(service))
  );
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = SERVICES.length;
  
  if (successCount === totalCount) {
    log(`🎉 All ${totalCount} services are alive!`, 'green');
  } else {
    log(`⚠️  ${successCount}/${totalCount} services responded`, 'yellow');
  }
  
  return results;
}

// Start continuous keep-alive
function startKeepAlive() {
  log('🚀 CommunityLink Keep-Alive Service Started', 'blue');
  log('📡 This will prevent cold starts on Render free tier', 'cyan');
  log('⏰ Pinging every 5 minutes...\n', 'cyan');
  
  // Initial ping
  keepAlive();
  
  // Set up intervals for each service
  SERVICES.forEach(service => {
    setInterval(() => {
      log(`\n⏰ ${new Date().toLocaleString()}`, 'cyan');
      pingService(service);
    }, service.interval);
  });
  
  // Overall status check every 30 minutes
  setInterval(() => {
    log('\n📊 30-Minute Status Check', 'blue');
    keepAlive();
  }, 1800000); // 30 minutes
}

// Single ping mode
async function singlePing() {
  log('🔍 Single Keep-Alive Ping', 'cyan');
  const results = await keepAlive();
  
  const failedServices = results.filter(r => !r.success);
  if (failedServices.length > 0) {
    log('\n⚠️  Some services failed to respond:', 'yellow');
    failedServices.forEach((result, index) => {
      const service = SERVICES[index];
      log(`   • ${service.name}: ${result.error}`, 'red');
    });
    process.exit(1);
  } else {
    log('\n🎉 All services are alive and well!', 'green');
    process.exit(0);
  }
}

// Health check mode
async function healthCheck() {
  log('🏥 Health Check Mode', 'cyan');
  
  const backendHealth = await pingService(SERVICES[0]);
  const frontendHealth = await pingService(SERVICES[1]);
  
  if (backendHealth.success && frontendHealth.success) {
    log('\n✅ System is healthy and operational!', 'green');
  } else {
    log('\n❌ System health issues detected:', 'red');
    if (!backendHealth.success) {
      log('   • Backend API is not responding', 'red');
    }
    if (!frontendHealth.success) {
      log('   • Frontend is not responding', 'red');
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--once')) {
    await singlePing();
  } else if (args.includes('--health')) {
    await healthCheck();
  } else {
    startKeepAlive();
    
    // Keep the process running
    process.on('SIGINT', () => {
      log('\n\n👋 Keep-alive service stopped.', 'yellow');
      process.exit(0);
    });
    
    // Keep process alive
    setInterval(() => {
      // Just keep the process running
    }, 1000);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  log(`❌ Unhandled error: ${error.message}`, 'red');
});

process.on('uncaughtException', (error) => {
  log(`❌ Uncaught exception: ${error.message}`, 'red');
  process.exit(1);
});

// Run the keep-alive service
main().catch(error => {
  log(`❌ Keep-alive failed: ${error.message}`, 'red');
  process.exit(1);
});