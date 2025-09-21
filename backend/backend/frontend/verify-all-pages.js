// frontend/verify-all-pages.js
// Comprehensive verification of all pages for text readability

const fs = require('fs');
const path = require('path');

// List of all pages/components to verify
const pagesToCheck = [
  'HomePage.css',
  'LoginPage.css',
  'RegisterPage.css',
  'CreateEventPage.css',
  'EditEventPage.css',
  'EventListPage.css',
  'EventDetailsPage.css',
  'EventAttendancePage.css',
  'EventParticipantsPage.css',
  'MyParticipationPage.css',
  'StudentDashboard.css',
  'AdminDashboard.css',
  'StaffDashboard.css',
  'ManageUsersPage.css',
  'AdminManageEventsPage.css',
  'AdminManageMessagesPage.css',
  'StudentsByYearPage.css',
  'SettingsPage.css',
  'ProfilePage.css',
  'ChangePasswordPage.css',
  'ForgotPasswordPage.css',
  'ResetPasswordPage.css',
  'ContactUsPage.css',
  'FeedbackPage.css',
  'AnalyticsPage.css',
  'StaffApprovalPage.css',
  'RegistrationManagementPage.css',
  'SchoolSettingsPage.css',
  'PublicEventRegistrationPage.css',
  'VerifyEmailPage.css',
  'NotFoundPage.css',
  'AdminViewStudentDocumentation.css',
  'StudentDocumentationPage.css',
  'EventDocumentationUpload.css',
  'RegistrationApprovalPage.css',
  'NavigationBar.css',
  'LoadingSpinner.css',
  'ProfilePictureUpload.css'
];

// Common problematic color patterns
const problematicPatterns = [
  /color:\s*#[0-9a-fA-F]{3,6}/g,
  /background:\s*#[0-9a-fA-F]{3,6}/g,
  /background-color:\s*#[0-9a-fA-F]{3,6}/g,
  /border-color:\s*#[0-9a-fA-F]{3,6}/g,
  /box-shadow:\s*[^;]*rgba\([^)]*\)/g
];

function checkFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return { exists: false, issues: [] };
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    // Check for problematic patterns
    problematicPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Skip if it's already using CSS variables
          if (!match.includes('var(--')) {
            issues.push({
              type: 'hardcoded_color',
              pattern: match.trim(),
              line: content.substring(0, content.indexOf(match)).split('\n').length
            });
          }
        });
      }
    });
    
    // Check if file imports theme variables
    const hasThemeImport = content.includes('@import') && content.includes('themes.css');
    
    return {
      exists: true,
      hasThemeImport,
      issues,
      totalLines: content.split('\n').length
    };
    
  } catch (error) {
    return { exists: false, error: error.message };
  }
}

function verifyAllPages() {
  console.log('🔍 Comprehensive verification of all pages...\n');
  
  const results = [];
  let totalIssues = 0;
  let filesWithIssues = 0;
  
  pagesToCheck.forEach(pageName => {
    const filePath = path.join(__dirname, 'src', 'components', pageName);
    const result = checkFile(filePath);
    
    if (!result.exists) {
      console.log(`⚠️  File not found: ${pageName}`);
      return;
    }
    
    if (result.issues && result.issues.length > 0) {
      filesWithIssues++;
      totalIssues += result.issues.length;
      console.log(`❌ ${pageName}: ${result.issues.length} issues found`);
      result.issues.forEach(issue => {
        console.log(`   - Line ${issue.line}: ${issue.pattern}`);
      });
    } else {
      console.log(`✅ ${pageName}: No issues found`);
    }
    
    if (!result.hasThemeImport && result.exists) {
      console.log(`⚠️  ${pageName}: Missing theme import`);
    }
    
    results.push({
      name: pageName,
      ...result
    });
  });
  
  console.log('\n📊 Summary:');
  console.log(`- Total files checked: ${results.filter(r => r.exists).length}`);
  console.log(`- Files with issues: ${filesWithIssues}`);
  console.log(`- Total issues found: ${totalIssues}`);
  
  if (totalIssues === 0) {
    console.log('\n🎉 All pages are perfect! No text readability issues found.');
  } else {
    console.log('\n⚠️  Some pages still have issues that need to be fixed.');
  }
  
  return results;
}

// Run verification
verifyAllPages();
