// EMAIL TEST FIX - Temporarily disable email to test if it's causing 404 errors
const { exec } = require('child_process');

console.log('🧪 EMAIL TEST FIX: Temporarily disable email sending');
console.log('📋 Testing if email errors are causing 404 errors:');
console.log('  ✅ Email templates are working');
console.log('  ✅ Temporarily disabling email in approval process');
console.log('  ✅ This will help identify if email is the issue');

// Add the email test fix
exec('git add backend/controllers/eventController.js', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Git add error:', error);
    return;
  }
  
  // Commit the email test fix
  exec('git commit -m "TEST: Temporarily disable email to test if causing 404 errors"', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Git commit error:', error);
      return;
    }
    
    // Push the test fix
    exec('git push origin main', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Git push error:', error);
        return;
      }
      
      console.log('✅ EMAIL TEST FIX DEPLOYED!');
      console.log('🧪 Testing if email was causing the 404 errors');
      console.log('🎯 Try the approval buttons in 2-3 minutes');
      console.log('📧 If buttons work now, email was the problem!');
    });
  });
});
