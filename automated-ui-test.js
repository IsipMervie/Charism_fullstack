// Automated UI Testing Script using Puppeteer
const puppeteer = require('puppeteer');

async function testUI() {
  console.log('🎭 Starting Automated UI Testing...');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Set to true for headless mode
    slowMo: 1000 // Slow down for visibility
  });
  
  const page = await browser.newPage();
  
  try {
    // Test Home Page
    console.log('🏠 Testing Home Page...');
    await page.goto('http://localhost:3000');
    await page.waitForSelector('body');
    
    // Take screenshot
    await page.screenshot({ path: 'homepage.png' });
    console.log('✅ Home Page loaded');
    
    // Test Login Page
    console.log('🔐 Testing Login Page...');
    await page.goto('http://localhost:3000/#/login');
    await page.waitForSelector('form');
    
    // Fill login form
    await page.type('input[name="email"]', 'test@test.com');
    await page.type('input[name="password"]', 'password123');
    
    // Take screenshot
    await page.screenshot({ path: 'login-page.png' });
    console.log('✅ Login Page loaded and form filled');
    
    // Test Register Page
    console.log('📝 Testing Register Page...');
    await page.goto('http://localhost:3000/#/register');
    await page.waitForSelector('form');
    
    // Take screenshot
    await page.screenshot({ path: 'register-page.png' });
    console.log('✅ Register Page loaded');
    
    // Test Events Page
    console.log('📅 Testing Events Page...');
    await page.goto('http://localhost:3000/#/events');
    await page.waitForSelector('body');
    
    // Take screenshot
    await page.screenshot({ path: 'events-page.png' });
    console.log('✅ Events Page loaded');
    
    console.log('🎯 All UI tests completed successfully!');
    
  } catch (error) {
    console.error('❌ UI Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testUI();

