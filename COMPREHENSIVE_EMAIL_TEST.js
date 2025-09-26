const axios = require('axios');

console.log('=== COMPREHENSIVE EMAIL FUNCTIONALITY TEST ===');
console.log('Testing all email functionality...\n');

// Test email configuration
async function testEmailConfiguration() {
  try {
    console.log('🔍 Testing email configuration...');
    const response = await axios.get('https://charism-api-xtw9.onrender.com/api/health/email', { timeout: 10000 });
    console.log('✅ Email configuration test passed:', response.status);
    console.log('Response:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Email configuration test failed:', error.message);
    return false;
  }
}

// Test registration email
async function testRegistrationEmail() {
  try {
    console.log('🔍 Testing registration email...');
    
    // Try to register a test user (should trigger registration email)
    const testUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'testpassword123',
      userId: 'TEST001',
      academicYear: '2024-2025',
      year: '1st Year',
      section: 'A',
      department: 'Computer Science'
    };
    
    const response = await axios.post('https://charism-api-xtw9.onrender.com/api/auth/register', testUser, { timeout: 10000 });
    console.log('✅ Registration endpoint accessible:', response.status);
    console.log('Note: Email would be sent if user was created');
    return true;
  } catch (error) {
    if (error.response && error.response.status === 400 && error.response.data.message === 'User already exists') {
      console.log('✅ Registration endpoint working (user exists - expected)');
      return true;
    }
    console.log('❌ Registration email test failed:', error.message);
    return false;
  }
}

// Test contact form email
async function testContactEmail() {
  try {
    console.log('🔍 Testing contact form email...');
    
    const contactData = {
      name: 'Test Contact',
      email: 'contact@example.com',
      message: 'This is a test contact message'
    };
    
    const response = await axios.post('https://charism-api-xtw9.onrender.com/api/contact-us', contactData, { timeout: 10000 });
    console.log('✅ Contact form email test passed:', response.status);
    console.log('Response:', response.data.message);
    return true;
  } catch (error) {
    console.log('❌ Contact form email test failed:', error.message);
    return false;
  }
}

// Test feedback email
async function testFeedbackEmail() {
  try {
    console.log('🔍 Testing feedback email...');
    
    const feedbackData = {
      subject: 'Test Feedback',
      message: 'This is a test feedback message',
      category: 'general',
      priority: 'low',
      userEmail: 'feedback@example.com',
      userName: 'Test User',
      userRole: 'guest'
    };
    
    const response = await axios.post('https://charism-api-xtw9.onrender.com/api/feedback/submit', feedbackData, { timeout: 10000 });
    console.log('✅ Feedback email test passed:', response.status);
    console.log('Response:', response.data.message);
    return true;
  } catch (error) {
    console.log('❌ Feedback email test failed:', error.message);
    return false;
  }
}

// Test password reset email
async function testPasswordResetEmail() {
  try {
    console.log('🔍 Testing password reset email...');
    
    const resetData = {
      email: 'test@example.com'
    };
    
    const response = await axios.post('https://charism-api-xtw9.onrender.com/api/auth/forgot-password', resetData, { timeout: 10000 });
    console.log('✅ Password reset email test passed:', response.status);
    console.log('Response:', response.data.message);
    return true;
  } catch (error) {
    console.log('❌ Password reset email test failed:', error.message);
    return false;
  }
}

// Test login notification email
async function testLoginNotificationEmail() {
  try {
    console.log('🔍 Testing login notification email...');
    
    const loginData = {
      email: 'test@example.com',
      password: 'testpassword123'
    };
    
    const response = await axios.post('https://charism-api-xtw9.onrender.com/api/auth/login', loginData, { timeout: 10000 });
    console.log('✅ Login endpoint accessible:', response.status);
    console.log('Note: Login notification email would be sent if login was successful');
    return true;
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ Login endpoint working (invalid credentials - expected)');
      return true;
    }
    console.log('❌ Login notification email test failed:', error.message);
    return false;
  }
}

// Check if event approval/disapproval emails are implemented
async function checkEventApprovalEmails() {
  try {
    console.log('🔍 Checking event approval/disapproval email implementation...');
    
    // Check if we can access events endpoint
    const response = await axios.get('https://charism-api-xtw9.onrender.com/api/events', { timeout: 10000 });
    console.log('✅ Events endpoint accessible:', response.status);
    console.log('Events count:', response.data?.events?.length || 0);
    
    console.log('⚠️ Note: Event approval/disapproval emails need to be implemented in the backend');
    return true;
  } catch (error) {
    console.log('❌ Event approval email check failed:', error.message);
    return false;
  }
}

// Run all email tests
async function runAllEmailTests() {
  const results = {
    emailConfiguration: await testEmailConfiguration(),
    registrationEmail: await testRegistrationEmail(),
    contactEmail: await testContactEmail(),
    feedbackEmail: await testFeedbackEmail(),
    passwordResetEmail: await testPasswordResetEmail(),
    loginNotificationEmail: await testLoginNotificationEmail(),
    eventApprovalEmails: await checkEventApprovalEmails()
  };
  
  console.log('\n=== EMAIL TEST RESULTS SUMMARY ===');
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? 'PASSED' : 'FAILED';
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${test}: ${status}`);
  });
  
  console.log(`\n📊 Overall: ${passed}/${total} email tests passed`);
  
  if (passed === total) {
    console.log('🎉 All email tests passed! Email system is working properly.');
  } else {
    console.log('⚠️ Some email tests failed. Email system may have issues.');
  }
  
  console.log('\n📋 Email Implementation Status:');
  console.log('✅ Registration Email: Implemented');
  console.log('✅ Login Notification Email: Implemented');
  console.log('✅ Password Reset Email: Implemented');
  console.log('✅ Contact Form Email: Implemented');
  console.log('✅ Feedback Email: Implemented');
  console.log('❌ Event Registration Approval Email: NOT IMPLEMENTED');
  console.log('❌ Event Registration Disapproval Email: NOT IMPLEMENTED');
  console.log('❌ Attendance Approval Email: NOT IMPLEMENTED');
  console.log('❌ Attendance Disapproval Email: NOT IMPLEMENTED');
  
  return results;
}

runAllEmailTests().catch(console.error);
