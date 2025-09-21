# Deployment Troubleshooting Guide

## Current Issues Identified

### 1. Timeout Errors (ECONNABORTED)
- **Problem**: Frontend requests are timing out after 30 seconds
- **Cause**: Database connection issues and slow response times
- **Solution**: Reduced timeouts to 15 seconds for faster failure detection

### 2. 500 Internal Server Errors
- **Problem**: `/api/settings/school` endpoint returning 500 errors
- **Cause**: Endpoint requires authentication but frontend is calling it without auth
- **Solution**: Frontend now uses `/api/settings/public/school` endpoint

### 3. Database Connection Issues
- **Problem**: MongoDB connection failures in Vercel environment
- **Cause**: Environment variables not properly set or connection timeouts
- **Solution**: Improved error handling and fallback to default values

### 4. Events and Analytics Failures
- **Problem**: `/api/events` and `/api/analytics` returning "Database not connected" errors
- **Cause**: Database connection failures causing endpoints to crash
- **Solution**: Added graceful fallbacks and better error handling



## Quick Fixes Applied

### Frontend Changes
1. **Fixed NavigationBar.jsx**: Added missing dependency to useEffect
2. **Updated API timeout**: Reduced from 30s to 15s
3. **Corrected endpoint usage**: Using public school settings endpoint

### Backend Changes
1. **Improved error handling**: Better fallback for database failures
2. **Reduced database timeouts**: Faster failure detection
3. **Added health check endpoints**: Better monitoring
4. **Enhanced lazy connection**: Prevents hanging connections
5. **Fixed events and analytics controllers**: Added graceful fallbacks for database failures
6. **Added database status endpoint**: Real-time connection monitoring

## Environment Variable Setup

### Required Variables (Must be set in Vercel)
```bash
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_gmail_app_password_here
NODE_ENV=production
```

### Optional Variables (Recommended)
```bash
FRONTEND_URL=https://charism.vercel.app
BACKEND_URL=https://charism-backend.vercel.app
CORS_ORIGINS=https://charism.vercel.app,https://charism-backend.vercel.app
```

## Testing Steps

### 1. Check Environment Variables
```bash
# Run this in your Vercel deployment
node backend/check-env.js
```

### 2. Test Basic Endpoints
- `/api/health` - Basic health check
- `/api/health-quick` - Quick response test
- `/api/test-db-simple` - Database connection test

### 3. Test School Settings
- `/api/settings/public/school` - Public school settings (no auth required)
- `/api/settings/school` - Admin school settings (requires auth)

### 4. Test Database Connection
- `/api/db-status` - Database connection status
- `/api/test-db-comprehensive` - Full database connection test



## Common Issues and Solutions

### Issue: "timeout of 30000ms exceeded"
**Solution**: 
- Check if MONGO_URI is set correctly in Vercel
- Verify MongoDB Atlas network access allows Vercel IPs
- Check if MongoDB cluster is running and accessible

### Issue: "500 Internal Server Error"
**Solution**:
- Check Vercel function logs for detailed error messages
- Verify all required environment variables are set
- Test database connection with `/api/test-db-comprehensive`

### Issue: CORS Errors
**Solution**:
- Set CORS_ORIGINS environment variable in Vercel
- Include your frontend domain in the CORS configuration
- Check if the request origin matches allowed origins



## Vercel Deployment Checklist

### Before Deployment
- [ ] Set all required environment variables
- [ ] Verify MongoDB connection string format
- [ ] Test database connection locally
- [ ] Check CORS configuration

### After Deployment
- [ ] Test `/api/health` endpoint
- [ ] Test `/api/settings/public/school` endpoint

- [ ] Check Vercel function logs for errors
- [ ] Verify frontend can reach backend

### Monitoring
- [ ] Check Vercel Analytics for function performance
- [ ] Monitor MongoDB Atlas for connection issues
- [ ] Watch for timeout errors in browser console
- [ ] Test critical user flows

## Debugging Commands

### Check Environment Variables
```bash
node backend/check-env.js
```

### Test Database Connection
```bash
curl https://your-app.vercel.app/api/test-db-comprehensive
```

### Test Health Endpoints
```bash
curl https://your-app.vercel.app/api/health
curl https://your-app.vercel.app/api/health-quick
```

### Test School Settings
```bash
curl https://your-app.vercel.app/api/settings/public/school
```



## Performance Optimizations

### Database
- Reduced connection timeouts for faster failure detection
- Implemented lazy connection for serverless environment
- Added connection pooling optimizations

### API
- Reduced frontend timeout from 30s to 15s
- Added fallback values for failed requests
- Implemented graceful degradation

### CORS
- Configured permissive CORS for development
- Added wildcard support for Vercel domains
- Implemented proper preflight handling

## Next Steps

1. **Deploy the updated code** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Test the health endpoints** first
4. **Verify school settings** are loading correctly
5. **Monitor for timeout errors** in production

## Support

If issues persist:
1. Check Vercel function logs for detailed error messages
2. Verify MongoDB Atlas connection and network access
3. Test with the provided debugging endpoints
4. Review environment variable configuration

## Files Modified

- `frontend/src/components/NavigationBar.jsx` - Fixed useEffect dependency
- `frontend/src/api/api.js` - Reduced timeout and fixed formatting
- `frontend/src/components/AdminDashboard.jsx` - Added database status and better error handling
- `frontend/src/components/AnalyticsPage.jsx` - Improved error handling for analytics
- `frontend/src/components/DatabaseStatus.jsx` - New database status monitoring component
- `backend/controllers/settingsController.js` - Improved error handling
- `backend/controllers/eventController.js` - Added graceful fallback for database failures
- `backend/controllers/analyticsController.js` - Added graceful fallback for database failures
- `backend/config/db.js` - Reduced timeouts and added connection timeout
- `backend/vercel-server.js` - Added health check and database status endpoints
- `backend/check-env.js` - New environment checker script
- `backend/test-db-connection.js` - New database connection test script

- `DEPLOYMENT_TROUBLESHOOTING.md` - This troubleshooting guide
