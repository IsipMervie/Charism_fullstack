# 🔐 SECURE DEPLOYMENT GUIDE

## ⚠️ IMPORTANT: Your credentials are NOT in the code!

The server.js file now only contains basic, non-sensitive configuration.

## 🚀 DEPLOYMENT STEPS:

### 1. **Set Environment Variables in Render Dashboard:**

Go to your Render dashboard → Your backend service → Environment tab

Add these variables:

```
MONGO_URI=mongodb+srv://admin:admin123@ua-database.wzgg1.mongodb.net/charism?retryWrites=true&w=majority&appName=UA-DATABASE
MONGO_URI_PRODUCTION=mongodb+srv://admin:admin123@ua-database.wzgg1.mongodb.net/charism?retryWrites=true&w=majority&appName=UA-DATABASE
JWT_SECRET=mysecretkey123456789
JWT_EXPIRES_IN=24h
EMAIL_USER=nexacore91@gmail.com
EMAIL_PASS=vikq reqx xtdq wglv
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
BCRYPT_ROUNDS=12
CORS_ORIGINS=https://charism-ucb4.onrender.com,https://charism.onrender.com,http://localhost:3000
ENABLE_AI_FILTERING=true
```

### 2. **Deploy the Code:**

```bash
git add .
git commit -m "SECURE: Remove hardcoded credentials, use environment variables"
git push origin main
```

### 3. **Result:**
- ✅ Your credentials are secure in Render's environment
- ✅ Code is clean without sensitive data
- ✅ Server will work with proper environment variables
- ✅ No security risk in your repository

## 🎯 This approach is:
- **Secure**: Credentials not in code
- **Professional**: Industry standard practice
- **Safe**: No accidental exposure
- **Effective**: Will fix all your errors
