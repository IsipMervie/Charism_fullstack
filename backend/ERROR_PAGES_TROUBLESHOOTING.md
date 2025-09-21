# Error Pages Troubleshooting Guide

## Current Issue
You're seeing error pages with messages like:
```
⚠️ Oops! Something went wrong
We're sorry, but something unexpected happened. Our team has been notified and is working to fix this issue.

Error ID: ERR_1756704106596_x968fzu4g
```

## Quick Diagnostic Steps

### 1. Run System Diagnostics
```bash
node diagnose-errors.js
```

### 2. Test Backend Connection
```bash
node test-backend-connection.js
```

### 3. Check Specific Endpoints
Open these URLs in your browser:
- `https://charism.vercel.app/api/health`
- `https://charism.vercel.app/api/status`
- `https://charism.vercel.app/api/db-status`

## Common Causes & Solutions

### 🔴 **Backend Not Deployed**
**Symptoms:**
- All API endpoints return 404 or timeout
- Frontend loads but shows errors when making requests

**Solutions:**
1. Check Vercel dashboard for deployment status
2. Verify `vercel.json` configuration
3. Check that `backend/vercel-server.js` exists
4. Redeploy the project

### 🔴 **Environment Variables Missing**
**Symptoms:**
- Backend responds but database operations fail
- Email functionality doesn't work
- Authentication fails

**Solutions:**
1. Go to Vercel dashboard → Project Settings → Environment Variables
2. Add these required variables:
   ```
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_password
   ```
3. Redeploy after adding variables

### 🔴 **Database Connection Issues**
**Symptoms:**
- `/api/db-status` returns error
- Login/registration fails
- Data operations timeout

**Solutions:**
1. Check MongoDB connection string
2. Verify MongoDB cluster is accessible
3. Check if MongoDB allows connections from Vercel IPs
4. Test connection locally first

### 🔴 **Frontend Build Issues**
**Symptoms:**
- Frontend loads but shows JavaScript errors
- Components fail to render
- API calls fail with CORS errors

**Solutions:**
1. Check frontend build logs in Vercel
2. Verify all dependencies are installed
3. Check for JavaScript syntax errors
4. Clear browser cache

### 🔴 **CORS Issues**
**Symptoms:**
- API calls fail in browser console
- Network errors in browser dev tools
- Frontend can't connect to backend

**Solutions:**
1. Check CORS configuration in `vercel-server.js`
2. Verify frontend URL is in allowed origins
3. Check if backend is responding to OPTIONS requests

## Step-by-Step Troubleshooting

### Step 1: Check Vercel Deployment
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Find your project
3. Check deployment status
4. Look for any build errors
5. Check function logs

### Step 2: Verify Environment Variables
1. In Vercel dashboard, go to Project Settings
2. Click "Environment Variables"
3. Verify these are set:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `EMAIL_USER`
   - `EMAIL_PASS`
   - `NODE_ENV` (should be "production")

### Step 3: Test Backend Endpoints
Run these commands or visit these URLs:

```bash
# Test basic health
curl https://charism.vercel.app/api/health

# Test database status
curl https://charism.vercel.app/api/db-status

# Test simple database
curl https://charism.vercel.app/api/test-db-simple
```

### Step 4: Check MongoDB Connection
1. Verify your MongoDB connection string
2. Test connection from your local machine
3. Check if MongoDB Atlas (if using) allows connections from anywhere
4. Verify database user has correct permissions

### Step 5: Check Frontend Build
1. In Vercel dashboard, check frontend build logs
2. Look for any build errors or warnings
3. Verify all dependencies are properly installed
4. Check if there are any TypeScript/JavaScript errors

## Emergency Fixes

### Quick Backend Test
If backend is completely down, create a simple test:

```javascript
// Create a simple test function in vercel-server.js
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend is working',
    timestamp: new Date().toISOString()
  });
});
```

### Frontend Fallback
If frontend is broken, you can temporarily serve a simple HTML page:

```html
<!DOCTYPE html>
<html>
<head>
    <title>CHARISM Community Link</title>
</head>
<body>
    <h1>System Maintenance</h1>
    <p>We're working on fixing the issues. Please check back later.</p>
</body>
</html>
```

## Monitoring & Prevention

### 1. Set Up Monitoring
- Use Vercel's built-in monitoring
- Set up uptime monitoring (UptimeRobot, Pingdom)
- Monitor error rates and response times

### 2. Regular Health Checks
- Run `node diagnose-errors.js` regularly
- Monitor database connection status
- Check environment variable configuration

### 3. Backup Plans
- Keep local development environment working
- Document deployment procedures
- Have rollback procedures ready

## Getting Help

### 1. Check Logs
- Vercel function logs
- Browser console errors
- Network tab in dev tools

### 2. Error Reporting
When reporting issues, include:
- Error ID from the error page
- Steps to reproduce
- Browser and OS information
- Screenshots of errors

### 3. Contact Information
- Check Vercel support documentation
- Review deployment logs
- Test endpoints manually

## Expected Results After Fix

Once fixed, you should see:
1. ✅ All health endpoints return 200 OK
2. ✅ Frontend loads without errors
3. ✅ Login/registration works
4. ✅ No more error pages
5. ✅ Database operations succeed

## Next Steps

1. Run the diagnostic script: `node diagnose-errors.js`
2. Check your Vercel deployment status
3. Verify all environment variables are set
4. Test the health endpoints manually
5. Check MongoDB connection
6. Review any error logs

The error pages should disappear once the underlying issues are resolved!
