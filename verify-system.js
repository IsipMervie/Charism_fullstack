#!/usr/bin/env node

/**
 * Interactive System Verification Tool
 * Guides you through verifying your CommunityLink system
 */

const readline = require('readline');
const { spawn } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(message) {
  log('\n' + '═'.repeat(60), 'cyan');
  log(`  ${message}`, 'cyan');
  log('═'.repeat(60), 'cyan');
}

function section(message) {
  log(`\n${message}`, 'blue');
  log('─'.repeat(60), 'blue');
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(`${colors.cyan}${question}${colors.reset}`, (answer) => {
      resolve(answer.toLowerCase().trim());
    });
  });
}

function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    proc.on('error', (error) => {
      reject(error);
    });
  });
}

async function main() {
  console.clear();
  
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                                                            ║', 'cyan');
  log('║        COMMUNITYLINK SYSTEM VERIFICATION WIZARD            ║', 'cyan');
  log('║                                                            ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  log('\n👋 Welcome! I will help you verify your system is working.', 'bright');
  log('   This will only take a few minutes.\n', 'bright');

  // Step 1: Choose environment
  header('STEP 1: Choose Environment');
  log('1. Test LOCAL environment (localhost)');
  log('2. Test PRODUCTION environment (Render.com)');
  log('3. Both\n');
  
  const envChoice = await ask('Which environment do you want to test? (1/2/3): ');
  
  if (envChoice === '1' || envChoice === '3') {
    section('Testing Local Environment');
    log('ℹ️  Make sure backend and frontend are running!', 'yellow');
    log('   Backend: cd backend && npm start', 'yellow');
    log('   Frontend: cd frontend && npm start\n', 'yellow');
    
    const ready = await ask('Are both services running? (yes/no): ');
    
    if (ready === 'yes' || ready === 'y') {
      log('\n🔄 Running local tests...\n', 'cyan');
      try {
        await runCommand('node', ['test-local.js']);
        log('\n✅ Local tests completed!', 'green');
      } catch (error) {
        log('\n❌ Local tests failed. Check the errors above.', 'red');
      }
    } else {
      log('\n⚠️  Please start backend and frontend first, then run:', 'yellow');
      log('   npm run test:local', 'yellow');
    }
  }
  
  if (envChoice === '2' || envChoice === '3') {
    section('Testing Production Environment');
    log('ℹ️  This will test your deployed system on Render.com\n', 'cyan');
    
    const proceed = await ask('Proceed with production tests? (yes/no): ');
    
    if (proceed === 'yes' || proceed === 'y') {
      log('\n🔄 Running production tests...\n', 'cyan');
      log('⏰ This may take 30-60 seconds (cold start)...\n', 'yellow');
      try {
        await runCommand('node', ['test-system.js']);
        log('\n✅ Production tests completed!', 'green');
      } catch (error) {
        log('\n❌ Production tests failed. Check the errors above.', 'red');
      }
    }
  }

  // Step 2: Manual Testing Guide
  header('STEP 2: Manual Testing Guide');
  log('Would you like to see the manual testing checklist?');
  const showGuide = await ask('(yes/no): ');
  
  if (showGuide === 'yes' || showGuide === 'y') {
    section('Manual Testing Checklist');
    
    log('\n📝 USER REGISTRATION TEST', 'cyan');
    log('1. Go to: https://charism-ucb4.onrender.com/register');
    log('2. Fill in all required fields');
    log('3. Click Register');
    log('4. ✅ Should see success message\n');
    
    log('📝 USER LOGIN TEST', 'cyan');
    log('1. Go to: https://charism-ucb4.onrender.com/login');
    log('2. Enter email and password');
    log('3. Click Login');
    log('4. ✅ Should redirect to dashboard\n');
    
    log('📝 EVENTS TEST', 'cyan');
    log('1. Navigate to Events page');
    log('2. ✅ Should see list of events');
    log('3. Click on an event');
    log('4. ✅ Should see event details');
    log('5. Click Join Event (if student)');
    log('6. ✅ Should successfully join\n');
    
    log('📝 ADMIN TEST', 'cyan');
    log('1. Login as Admin');
    log('2. Go to User Management');
    log('3. ✅ Should see all users');
    log('4. Go to Create Event');
    log('5. Fill in event details');
    log('6. ✅ Event should be created\n');
  }

  // Step 3: Check for errors
  header('STEP 3: Error Checking');
  log('Have you encountered any errors?');
  const hasErrors = await ask('(yes/no): ');
  
  if (hasErrors === 'yes' || hasErrors === 'y') {
    section('Common Error Solutions');
    
    log('\n🔍 ERROR TYPE:', 'yellow');
    log('1. "503 Service Unavailable"');
    log('2. "CORS Error"');
    log('3. "Database not connected"');
    log('4. "Login failed"');
    log('5. "Events not loading"');
    log('6. Other\n');
    
    const errorType = await ask('Which error? (1-6): ');
    
    switch (errorType) {
      case '1':
        log('\n💡 SOLUTION:', 'green');
        log('- Wait 30 seconds and refresh (cold start on free tier)');
        log('- Check Render dashboard for service status');
        log('- Verify backend is deployed successfully');
        break;
      case '2':
        log('\n💡 SOLUTION:', 'green');
        log('- Check CORS_ORIGINS in Render environment variables');
        log('- Should be: https://charism-ucb4.onrender.com,https://charism-api-xtw9.onrender.com');
        log('- No spaces between URLs');
        break;
      case '3':
        log('\n💡 SOLUTION:', 'green');
        log('- Check MONGO_URI in Render environment variables');
        log('- Verify MongoDB Atlas allows connections from 0.0.0.0/0');
        log('- Check database user permissions');
        break;
      case '4':
        log('\n💡 SOLUTION:', 'green');
        log('- Check JWT_SECRET is set in backend environment');
        log('- Verify email and password are correct');
        log('- Clear browser localStorage and try again');
        break;
      case '5':
        log('\n💡 SOLUTION:', 'green');
        log('- Check backend API is accessible');
        log('- Open: https://charism-api-xtw9.onrender.com/api/events');
        log('- Should return array of events or empty array');
        break;
      default:
        log('\n💡 GENERAL DEBUGGING:', 'green');
        log('- Check browser console (F12) for errors');
        log('- Check Render logs for backend errors');
        log('- Verify all environment variables are set');
        log('- Try redeploying the service');
    }
  } else {
    log('\n🎉 Excellent! No errors detected.', 'green');
  }

  // Final Summary
  header('VERIFICATION SUMMARY');
  
  log('\n📚 Documentation Files Created:', 'cyan');
  log('  • SYSTEM_VERIFICATION_CHECKLIST.md - Complete testing guide');
  log('  • QUICK_START_TESTING.md - Quick reference guide');
  log('  • test-system.js - Automated production tests');
  log('  • test-local.js - Automated local tests');
  
  log('\n🔧 Available Commands:', 'cyan');
  log('  • npm run test:local - Test local environment');
  log('  • npm run test:production - Test production');
  log('  • npm run verify - Full system verification');
  log('  • node verify-system.js - This wizard');
  
  log('\n📞 Quick Health Check URLs:', 'cyan');
  log('  • Backend: https://charism-api-xtw9.onrender.com/api/health');
  log('  • Frontend: https://charism-ucb4.onrender.com');
  
  log('\n✅ NEXT STEPS:', 'bright');
  log('1. Run automated tests regularly');
  log('2. Monitor Render logs for errors');
  log('3. Test new features before deploying');
  log('4. Keep environment variables updated');
  log('5. Backup database regularly');
  
  log('\n🎯 Your system is ready when:', 'green');
  log('  ✅ All automated tests pass');
  log('  ✅ Users can register and login');
  log('  ✅ Events load correctly');
  log('  ✅ No console errors');
  log('  ✅ Admin functions work');
  
  const runAgain = await ask('\n\nRun this wizard again? (yes/no): ');
  
  if (runAgain === 'yes' || runAgain === 'y') {
    rl.close();
    main();
  } else {
    log('\n👋 Thank you for using the verification wizard!', 'cyan');
    log('   Your system is ready to go! 🚀\n', 'green');
    rl.close();
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  log('\n\n👋 Verification cancelled. Goodbye!', 'yellow');
  rl.close();
  process.exit(0);
});

// Run the wizard
main().catch((error) => {
  log(`\n❌ Error: ${error.message}`, 'red');
  rl.close();
  process.exit(1);
});

