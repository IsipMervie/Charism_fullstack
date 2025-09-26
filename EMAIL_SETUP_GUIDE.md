# 📧 EMAIL SETUP GUIDE - Fix Email Not Working

## ❌ **PROBLEM IDENTIFIED:**
Users aren't receiving emails because email credentials are not configured.

## ✅ **SOLUTION:**

### **1. Create `.env` file in backend directory:**
```bash
# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_SERVICE=gmail
NO_REPLY_EMAIL=noreply@charism.edu.ph

# Other required variables
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=production
PORT=10000
```

### **2. For Gmail Setup:**
1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password:**
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this password in `EMAIL_PASS`

### **3. Alternative Email Services:**
```bash
# For Outlook/Hotmail
EMAIL_SERVICE=hotmail
EMAIL_USER=your_email@outlook.com
EMAIL_PASS=your_password

# For Yahoo
EMAIL_SERVICE=yahoo
EMAIL_USER=your_email@yahoo.com
EMAIL_PASS=your_app_password

# For Custom SMTP
EMAIL_HOST=smtp.yourdomain.com
EMAIL_PORT=587
EMAIL_USER=your_email@yourdomain.com
EMAIL_PASS=your_password
```

### **4. Test Email Configuration:**
```bash
# Test if emails work
node -e "
const sendEmail = require('./backend/utils/sendEmail');
sendEmail('test@example.com', 'Test Email', 'Test message', '<h1>Test</h1>', true)
  .then(result => console.log('Email result:', result))
  .catch(err => console.error('Email error:', err));
"
```

## 🚀 **QUICK FIX:**

1. **Create `.env` file** in `backend/` directory
2. **Add your email credentials** (see examples above)
3. **Restart the backend server**
4. **Test registration** - users will now receive emails!

## 📧 **EMAILS THAT WILL WORK:**
- ✅ User registration verification
- ✅ Password reset emails
- ✅ Event registration confirmations
- ✅ Event completion notifications
- ✅ Staff approval notifications
- ✅ Contact form responses
- ✅ Feedback notifications

## ⚠️ **IMPORTANT NOTES:**
- Use **App Passwords** for Gmail (not regular password)
- Make sure **2FA is enabled** for Gmail
- **NO_REPLY_EMAIL** should be a valid domain email
- Test with a real email address first

## 🔧 **TROUBLESHOOTING:**
If emails still don't work:
1. Check `.env` file is in correct location (`backend/.env`)
2. Verify email credentials are correct
3. Check if 2FA is enabled for Gmail
4. Try different email service (Outlook/Yahoo)
5. Check server logs for email errors

---

**After setting up email credentials, users will receive all email notifications!** 📧✅

