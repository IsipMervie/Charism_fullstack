# Login Troubleshooting Guide

## Current Issue
Your login is failing with "Request timeout" errors. The frontend is trying to connect to the backend but the connection is timing out.

## Quick Fix Steps

### 1. Test Backend Connection
Run this command to test if your backend is working:
```bash
node test-backend-connection.js
```

### 2. Check Environment Variables
Make sure your Vercel deployment has these environment variables set:

**Required Environment Variables:**
- `MONGO_URI` - Your MongoDB connection string
- `JWT_SECRET` - A secret key for JWT tokens
- `EMAIL_USER` - Email username for sending emails
- `EMAIL_PASS` - Email password for sending emails

### 3. Verify Backend Deployment
Your backend should be deployed as a serverless function at:
- **URL**: `https://charism.vercel.app/api/*`
- **Function**: `backend/vercel-server.js`

### 4. Check MongoDB Connection
Make sure your MongoDB database is accessible and the connection string is correct.

## Detailed Troubleshooting

### Step 1: Test Backend Health
1. Open your browser
2. Go to: `https://charism.vercel.app/api/health`
3. You should see: `{"status":"OK"}`

If this fails, your backend is not working.

### Step 2: Check Vercel Deployment
1. Go to your Vercel dashboard
2. Check if the deployment is successful
3. Look for any build errors
4. Check the function logs for errors

### Step 3: Verify Environment Variables
In your Vercel dashboard:
1. Go to your project settings
2. Check "Environment Variables"
3. Make sure all required variables are set
4. Redeploy if you added new variables

### Step 4: Test Database Connection
If the health endpoint works but login fails, the issue might be:
1. MongoDB connection string is wrong
2. Database is not accessible
3. Network issues between Vercel and MongoDB

## Common Solutions

### Solution 1: Backend Not Deployed
If the health endpoint returns 404:
1. Make sure your `vercel.json` is correct
2. Redeploy your project to Vercel
3. Check that `backend/vercel-server.js` exists

### Solution 2: Environment Variables Missing
If you get database errors:
1. Add all required environment variables in Vercel
2. Redeploy the project
3. Check the function logs

### Solution 3: MongoDB Connection Issues
If database connection fails:
1. Check your MongoDB connection string
2. Make sure the database is accessible from Vercel
3. Check if your MongoDB cluster allows connections from Vercel's IPs

### Solution 4: CORS Issues
If you get CORS errors:
1. The CORS configuration is already set up in `vercel-server.js`
2. Make sure the frontend URL is in the allowed origins

## Testing Steps

### 1. Test Backend Health
```bash
curl https://charism.vercel.app/api/health
```

### 2. Test Login Endpoint
```bash
curl -X POST https://charism.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### 3. Check Function Logs
In Vercel dashboard:
1. Go to Functions tab
2. Click on your function
3. Check the logs for errors

## Emergency Fix

If nothing works, try this temporary fix:

1. **Deploy a simple test backend:**
```javascript
// Create a simple test function
module.exports = (req, res) => {
  res.json({ status: 'OK', message: 'Backend is working' });
};
```

2. **Test the connection**
3. **Gradually add back the full functionality**

## Contact Information

If you're still having issues:
1. Check the Vercel function logs
2. Test the backend endpoints manually
3. Verify all environment variables are set
4. Make sure MongoDB is accessible

## Expected Behavior After Fix

Once fixed, you should see:
1. ✅ Backend health endpoint returns `{"status":"OK"}`
2. ✅ Login attempts show proper error messages
3. ✅ No more "Request timeout" errors
4. ✅ Login works with valid credentials

## Next Steps

1. Run the test script: `node test-backend-connection.js`
2. Check your Vercel deployment status
3. Verify environment variables
4. Test the health endpoint manually
5. Try logging in again

The login should work once the backend is properly deployed and accessible!
