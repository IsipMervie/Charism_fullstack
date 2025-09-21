# 🚀 DEPLOYMENT CHECKLIST - CommunityLink

## ✅ Pre-Deployment Checks

### 1. Code Quality
- [ ] All tests pass locally
- [ ] No console.log statements in production code
- [ ] Error handling is comprehensive
- [ ] Input validation is in place

### 2. Environment Variables (VERCEL)
- [ ] `MONGO_URI` - MongoDB connection string
- [ ] `JWT_SECRET` - Strong random string
- [ ] `EMAIL_USER` - Gmail address
- [ ] `EMAIL_PASS` - Gmail app password
- [ ] `NODE_ENV` - Set to "production"
- [ ] `CORS_ORIGINS` - Frontend URLs (comma-separated)
- [ ] `FRONTEND_URL` - Your frontend domain
- [ ] `BACKEND_URL` - Your backend domain

### 3. Database
- [ ] MongoDB Atlas cluster is running
- [ ] Network access allows Vercel (0.0.0.0/0)
- [ ] Database user has correct permissions
- [ ] Connection string is valid

### 4. Dependencies
- [ ] All packages are in package.json
- [ ] No dev dependencies in production
- [ ] Node.js version is compatible (>=14.0.0)

## 🚀 Deployment Steps

### 1. Vercel Dashboard Setup
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings → Environment Variables
4. Add all required environment variables
5. Save changes

### 2. Deploy
1. Push code to GitHub
2. Vercel will auto-deploy
3. Check deployment logs for errors
4. Test endpoints after deployment

## 🧪 Post-Deployment Testing

### 1. Health Checks
- [ ] `/api/health` - Returns `{ status: "OK" }`
- [ ] `/api/test-db` - Database connection test
- [ ] `/api/test-models` - Model loading test

### 2. Core Functionality
- [ ] User registration/login
- [ ] File uploads
- [ ] Database operations
- [ ] Email sending

### 3. Error Handling
- [ ] Invalid routes return 404
- [ ] Database errors are handled gracefully
- [ ] CORS errors are resolved
- [ ] Authentication errors are clear

## 🚨 Common Issues & Solutions

### 1. "Server Error" Message
**Cause:** Missing environment variables
**Solution:** Check Vercel environment variables

### 2. CORS Errors
**Cause:** Incorrect CORS_ORIGINS setting
**Solution:** Update CORS_ORIGINS with your frontend URL

### 3. Database Connection Failed
**Cause:** Invalid MONGO_URI or network restrictions
**Solution:** Verify MongoDB Atlas settings and connection string

### 4. JWT Errors
**Cause:** Missing or weak JWT_SECRET
**Solution:** Generate a strong random string for JWT_SECRET

### 5. File Upload Issues
**Cause:** Missing file storage configuration
**Solution:** Check file upload middleware and storage settings

## 🔧 Debugging Commands

### Test Database Connection
```bash
curl https://your-backend.vercel.app/api/test-db
```

### Test Health
```bash
curl https://your-backend.vercel.app/api/health
```

### Test Models
```bash
curl https://your-backend.vercel.app/api/test-models
```

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test endpoints individually
4. Check MongoDB Atlas status
5. Review error logs in Vercel dashboard

## 🎯 Success Criteria

- [ ] All health check endpoints return success
- [ ] Database operations work correctly
- [ ] File uploads function properly
- [ ] Authentication system works
- [ ] No 500 errors in production
- [ ] CORS issues are resolved
- [ ] Email system is functional
