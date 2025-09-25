# EMAIL SETUP GUIDE - Fix Email Issues

## 🚨 PROBLEM: Email Configuration Missing

Your emails are not working because the email configuration is not set up.

## ✅ SOLUTION: Set Up Email Configuration

### Step 1: Create .env file
Create a file named `.env` in your backend folder with this content:

```
# Email Configuration (REQUIRED)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_SERVICE=gmail
NO_REPLY_EMAIL=noreply@charism.edu.ph
ADMIN_EMAIL=admin@charism.edu.ph

# Database Configuration
MONGO_URI=your-mongodb-connection-string
NODE_ENV=production

# JWT Secret
JWT_SECRET=your-secret-key

# CORS Configuration
CORS_ORIGINS=https://charism-ucb4.onrender.com,https://charism.onrender.com,http://localhost:3000

# Server Configuration
PORT=10000
```

### Step 2: Gmail Setup (Recommended)

1. **Use Gmail with App Password:**
   - Go to your Gmail account
   - Enable 2-Factor Authentication
   - Generate an "App Password" for this application
   - Use the App Password (not your regular password)

2. **Gmail Settings:**
   ```
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASS=your-16-character-app-password
   EMAIL_SERVICE=gmail
   ```

### Step 3: Alternative Email Services

**Outlook/Hotmail:**
```
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
EMAIL_SERVICE=hotmail
```

**Yahoo:**
```
EMAIL_USER=your-email@yahoo.com
EMAIL_PASS=your-app-password
EMAIL_SERVICE=yahoo
```

### Step 4: Test Email Configuration

After setting up the .env file, run:
```bash
node test-email.js
```

## 🔧 QUICK FIX: Disable Email Temporarily

If you want to disable email sending temporarily, modify the sendEmail function:

```javascript
// In utils/sendEmail.js, add this at the top:
const DISABLE_EMAIL = true; // Set to true to disable emails

// Then modify the sendEmail function to return early:
if (DISABLE_EMAIL) {
  console.log('📧 Email disabled - would send to:', to);
  return { success: true, message: 'Email disabled' };
}
```

## 📋 CHECKLIST

- [ ] Created .env file
- [ ] Set EMAIL_USER
- [ ] Set EMAIL_PASS (App Password for Gmail)
- [ ] Set EMAIL_SERVICE
- [ ] Tested with node test-email.js
- [ ] Restarted server after changes

## 🆘 EMERGENCY: No Email Setup

If you can't set up email right now, the forms will still work but users won't receive confirmation emails. The data will still be saved to the database.
