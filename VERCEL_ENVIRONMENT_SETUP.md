# VERCEL ENVIRONMENT SETUP GUIDE

## 🚨 CRITICAL: Fix Database Connection Issues

Your system is currently failing because the database connection is not properly configured in Vercel. Follow these steps to fix it:

## 📋 Required Environment Variables

Go to your Vercel Dashboard → Project Settings → Environment Variables and add these:

### 1. Database Connection (REQUIRED)
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority
```
- Replace with your actual MongoDB connection string
- This is the main cause of your "Database connection not ready" errors

### 2. JWT Secret (REQUIRED)
```
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
```
- Generate a strong random string (at least 32 characters)
- Required for user authentication

### 3. Email Configuration (REQUIRED)
```
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_gmail_app_password_here
```
- Use Gmail App Password, not your regular password
- Required for email verification and notifications

### 4. Application URLs (REQUIRED)
```
FRONTEND_URL=https://charism.vercel.app
BACKEND_URL=https://charism-backend.vercel.app
CORS_ORIGINS=https://charism.vercel.app,https://charism-backend.vercel.app
```

### 5. Environment (REQUIRED)
```
NODE_ENV=production
```

## 🔧 Setup Steps

1. **Go to Vercel Dashboard**
   - Navigate to your project
   - Click "Settings" tab
   - Click "Environment Variables" in the left sidebar

2. **Add Each Variable**
   - Click "Add New"
   - Set Environment to "Production"
   - Add each variable above
   - Click "Save"

3. **Redeploy**
   - Go to "Deployments" tab
   - Click "Redeploy" on your latest deployment
   - Or push a new commit to trigger deployment

## 🧪 Test Your Setup

After setting environment variables and redeploying:

1. **Test Health Check**: `https://charism.vercel.app/api/health`
2. **Test Database**: `https://charism.vercel.app/api/test-db-simple`
3. **Test Login**: Try logging in with a valid user

## 🚨 Common Issues & Solutions

### "Database connection not ready"
- **Cause**: MONGO_URI not set or invalid
- **Solution**: Check your MongoDB connection string

### "JWT_SECRET not set"
- **Cause**: JWT_SECRET environment variable missing
- **Solution**: Generate and set a strong JWT secret

### CORS Errors
- **Cause**: CORS_ORIGINS not properly configured
- **Solution**: Ensure your frontend URL is in CORS_ORIGINS

### Email Failures
- **Cause**: EMAIL_USER or EMAIL_PASS not set
- **Solution**: Use Gmail App Password, not regular password

## 🔍 Verification Commands

Test these endpoints after setup:

```bash
# Health check
curl https://charism.vercel.app/api/health

# Database test
curl https://charism.vercel.app/api/test-db-simple

# Test endpoint
curl https://charism.vercel.app/api/test
```

## 📞 Need Help?

If you still have issues after following this guide:

1. Check Vercel deployment logs
2. Verify all environment variables are set
3. Ensure MongoDB Atlas is accessible from Vercel
4. Check if your MongoDB cluster allows connections from Vercel's IP ranges

## 🎯 Expected Result

After proper setup, you should see:
- ✅ Successful login
- ✅ Images displaying properly
- ✅ All API endpoints working
- ✅ No more "Database connection not ready" errors
