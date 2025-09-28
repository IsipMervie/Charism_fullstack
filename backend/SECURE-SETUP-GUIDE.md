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
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
JWT_SECRET=your-super-secure-jwt-secret-here
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
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
