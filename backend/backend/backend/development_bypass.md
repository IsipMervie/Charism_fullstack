# Login Issues - Development Solutions

## Problem
Registered accounts can't login due to:
1. **Email verification required** - Users must verify email before login
2. **Staff approval required** - Staff users need admin approval
3. **Email system not configured** - Verification emails aren't being sent

## Quick Solutions

### Option 1: Auto-Fix All Users (Recommended for Development)
Run this command to fix all existing users:
```bash
cd backend
node fix_login_issues.js
```

### Option 2: Manual Database Update
Connect to MongoDB and update users manually:
```javascript
// Make all users verified and approved
db.users.updateMany({}, { 
  $set: { 
    isVerified: true, 
    isApproved: true, 
    approvalStatus: "approved" 
  } 
});
```

### Option 3: Temporary Bypass (Development Only)
Comment out verification checks in authController.js:
```javascript
// Temporarily comment these lines for development:
// if (!user.isVerified) return res.status(401).json({ message: 'Please verify your email before logging in.' });
// if (user.role === 'Staff' && !user.isApproved) { ... }
```

## Root Cause Analysis

### Login Flow Issues:
1. **Registration creates unverified users** - isVerified: false by default
2. **Email system needs configuration** - EMAIL_USER and EMAIL_PASS env vars
3. **Staff need admin approval** - No auto-approval for staff accounts
4. **Frontend URL not configured** - Verification links may be broken

### Email Configuration Required:
Create `.env` file with:
```
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-secure-secret
```

## Testing
After applying fixes, test with existing user accounts:
1. Check if users can login with their original passwords
2. Verify all user roles work (Student, Staff, Admin)
3. Test new registrations flow

## Production Considerations
- Don't use auto-approval in production
- Configure proper email service (SendGrid, AWS SES, etc.)
- Implement proper admin approval workflow
- Add email verification resend functionality
