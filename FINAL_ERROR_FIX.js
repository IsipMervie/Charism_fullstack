const fs = require('fs');

console.log('=== FINAL ERROR FIX ===');
console.log('Fixing the remaining getUserId errors...\n');

// Read the api.js file
const apiPath = 'frontend/src/api/api.js';
let content = fs.readFileSync(apiPath, 'utf8');

// Replace getUserId() calls with a direct implementation
const getUserIdImplementation = `const userId = (() => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId || payload.id;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
})();`;

// Replace both occurrences
content = content.replace(
  /const userId = getUserId\(\);/g,
  getUserIdImplementation
);

// Write the fixed content back
fs.writeFileSync(apiPath, content);

console.log('✅ Fixed getUserId usage in api.js');
console.log('🎉 All errors should now be resolved!');
