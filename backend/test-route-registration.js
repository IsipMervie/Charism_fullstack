// Test script to verify route registration
const express = require('express');
const eventRoutes = require('./routes/eventRoutes');

async function testRouteRegistration() {
  console.log('🧪 Testing Route Registration...\n');
  
  try {
    // Create a test app
    const app = express();
    app.use('/api/events', eventRoutes);
    
    // Test if routes are registered
    console.log('📋 Checking if routes are registered...');
    
    // Get all registered routes
    const routes = [];
    eventRoutes.stack.forEach((middleware) => {
      if (middleware.route) {
        routes.push({
          method: Object.keys(middleware.route.methods)[0].toUpperCase(),
          path: middleware.route.path
        });
      }
    });
    
    console.log('📋 Registered routes:');
    routes.forEach(route => {
      console.log(`  ${route.method} ${route.path}`);
    });
    
    // Check specifically for registration approval routes
    const registrationRoutes = routes.filter(route => 
      route.path.includes('/registrations/') && 
      (route.path.includes('/approve') || route.path.includes('/disapprove'))
    );
    
    console.log('\n📋 Registration approval routes:');
    registrationRoutes.forEach(route => {
      console.log(`  ${route.method} ${route.path}`);
    });
    
    if (registrationRoutes.length === 0) {
      console.log('❌ No registration approval routes found!');
    } else {
      console.log('✅ Registration approval routes are registered');
    }
    
  } catch (error) {
    console.error('❌ Route registration test error:', error.message);
  }
}

// Run the test
testRouteRegistration();
