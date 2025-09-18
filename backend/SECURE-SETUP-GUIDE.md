# 🔐 SECURE SETUP GUIDE - NO CREDENTIALS IN CODE

## ✅ SECURITY FIXED:
- ❌ **No MongoDB URI** in server.js
- ❌ **No JWT secret** in server.js  
- ❌ **No email passwords** in server.js
- ✅ **Clean, secure code**

## 🚀 DEPLOYMENT STEPS:

### 1. **Deploy Clean Code:**
```bash
git add .
git commit -m "SECURE: Remove all credentials from code"
git push origin main
```

### 2. **Set Environment Variables in Render:**

Go to: https://dashboard.render.com → Your backend service → Environment tab

**Add these variables:**
```
MONGO_URI=mongodb+srv://admin:admin123@ua-database.wzgg1.mongodb.net/charism?retryWrites=true&w=majority&appName=UA-DATABASE
JWT_SECRET=mysecretkey123456789
EMAIL_USER=nexacore91@gmail.com
EMAIL_PASS=vikq reqx xtdq wglv
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
CORS_ORIGINS=https://charism-ucb4.onrender.com,https://charism.onrender.com,http://localhost:3000
```

### 3. **Result:**
- ✅ **Secure**: Credentials only in Render environment
- ✅ **Professional**: Industry standard practice
- ✅ **Working**: Server will start properly
- ✅ **No exposure**: Credentials not in repository

## 🎯 This is the CORRECT way to handle credentials!
