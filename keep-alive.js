/**
 * Keep-Alive Script for Render Free Tier
 * Pings your backend every 10 minutes to prevent cold starts
 * 
 * Usage: node keep-alive.js
 * Or add to cron job / scheduled task
 */

const axios = require('axios');

const BACKEND_URL = 'https://charism-api-xtw9.onrender.com';
const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes

async function ping() {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/ping`, {
      timeout: 30000
    });
    console.log(`✅ [${new Date().toLocaleString()}] Server is alive - ${response.data.status}`);
  } catch (error) {
    console.error(`❌ [${new Date().toLocaleString()}] Ping failed:`, error.message);
  }
}

console.log('🔄 Keep-Alive Service Started');
console.log(`Pinging ${BACKEND_URL} every 10 minutes...`);
console.log('Press Ctrl+C to stop\n');

// Ping immediately
ping();

// Then ping every 10 minutes
setInterval(ping, PING_INTERVAL);

