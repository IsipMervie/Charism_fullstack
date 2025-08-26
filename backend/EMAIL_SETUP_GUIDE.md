# 📧 Email Setup Guide for CommunityLink

## 🚨 **IMPORTANT: Email System Must Be Configured**

The CommunityLink system now sends emails for:
- ✅ **Contact Form Submissions** - Confirmation emails to users
- ✅ **Admin Replies** - Response emails to users  
- ✅ **Admin Notifications** - New message alerts to admins

## 🔧 **Step 1: Create .env File**

Create a file called `.env` in your `backend` folder:

```env
# Email Configuration (REQUIRED)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here

# Optional: Separate admin email for notifications
ADMIN_EMAIL=admin@yourdomain.com

# Other configurations...
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

## 📱 **Step 2: Gmail App Password Setup**

### **For Gmail Users (Recommended):**

1. **Go to [Google Account Settings](https://myaccount.google.com/)**
2. **Click "Security" in the left sidebar**
3. **Enable "2-Step Verification"** (if not already enabled)
4. **Go to "App passwords"** (under 2-Step Verification)
5. **Select "Mail"** and "Other (Custom name)"
6. **Enter "CommunityLink"** as the name
7. **Click "Generate"**
8. **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)
9. **Paste it in your .env file** as `EMAIL_PASS`

### **Why App Password?**
- Regular Gmail passwords won't work with SMTP
- App passwords are more secure
- Required for automated email sending

## 🧪 **Step 3: Test Email System**

Run this command in your backend folder:

```bash
node test_email_system.js
```

**Expected Output:**
```
🧪 Testing Email System...

📋 Environment Variables Check:
EMAIL_USER: ✅ Set
EMAIL_PASS: ✅ Set

📧 Testing email configuration...
📤 Sending test email...
✅ Test email sent successfully!
📬 Check your inbox (and spam folder) for the test email
📧 Sent to: your_email@gmail.com
```

## ❌ **Common Error Solutions:**

### **Error: "EAUTH" (Authentication Failed)**
- ✅ Check `EMAIL_USER` is correct
- ✅ Use App Password, not regular password
- ✅ Enable 2-factor authentication first

### **Error: "ECONNECTION" (Connection Failed)**
- ✅ Check internet connection
- ✅ Verify Gmail SMTP settings
- ✅ Check firewall/antivirus settings

### **Error: "ENOTFOUND" (Domain Not Found)**
- ✅ Check `EMAIL_USER` format
- ✅ Ensure email domain is correct

## 📧 **Email Flow Summary:**

### **When User Submits Contact Form:**
1. **User fills contact form** → Frontend
2. **Form submitted** → Backend API
3. **Message saved** → Database
4. **Confirmation email** → User ✅
5. **Notification email** → Admin ✅

### **When Admin Replies:**
1. **Admin types reply** → Admin panel
2. **Reply saved** → Database
3. **Response email** → User ✅

## 🔒 **Security Notes:**

- **Never commit .env file** to version control
- **Use App Passwords** for Gmail (not regular passwords)
- **Enable 2FA** on your email account
- **Regular passwords won't work** with SMTP

## 🚀 **Quick Test:**

1. **Set up .env file** with email credentials
2. **Restart your backend server**
3. **Submit a contact form** from the frontend
4. **Check your email** for confirmation
5. **Check admin email** for notification

## 📞 **Need Help?**

If you're still having issues:
1. **Check the test script output** for specific errors
2. **Verify your .env file** is in the correct location
3. **Ensure server was restarted** after .env changes
4. **Check spam folder** for test emails

---

**🎯 Goal: Users should receive confirmation emails when they submit contact forms!**
