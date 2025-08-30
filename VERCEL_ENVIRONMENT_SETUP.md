# Vercel Environment Setup Guide

## Overview
This guide will help you set up the correct environment variables in Vercel to fix:
1. Email links not working (password reset, email verification)
2. Image links not displaying properly
3. API connectivity issues

## Required Environment Variables

### Backend Environment Variables

Set these in your **Backend Vercel Project** (Settings > Environment Variables):

#### Database
```
MONGO_URI=your_mongodb_connection_string_here
```

#### JWT Security
```
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_EXPIRES_IN=24h
```

#### Frontend URLs (CRITICAL for email links)
```
FRONTEND_URL=https://your-frontend-project.vercel.app
FRONTEND_URL_PRODUCTION=https://your-frontend-project.vercel.app
FRONTEND_URL_VERCEL=https://your-frontend-project.vercel.app
```

**IMPORTANT**: Replace `your-frontend-project.vercel.app` with your actual frontend Vercel project URL.

#### Email Configuration
```
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

#### CORS Settings
```
CORS_ORIGINS=https://your-frontend-project.vercel.app,https://your-backend-project.vercel.app
```

#### Environment
```
NODE_ENV=production
```

### Frontend Environment Variables

Set these in your **Frontend Vercel Project** (Settings > Environment Variables):

#### API Configuration
```
REACT_APP_API_URL=https://your-backend-project.vercel.app/api
REACT_APP_ENV=production
REACT_APP_VERSION=1.0.0
```

**IMPORTANT**: Replace `your-backend-project.vercel.app` with your actual backend Vercel project URL.

## Step-by-Step Setup

### 1. Backend Setup
1. Go to your **Backend Vercel Project** dashboard
2. Navigate to Settings > Environment Variables
3. Add each variable from the Backend section above
4. Make sure to set the environment to "Production" for all variables
5. Click "Save" after adding each variable

### 2. Frontend Setup
1. Go to your **Frontend Vercel Project** dashboard
2. Navigate to Settings > Environment Variables
3. Add each variable from the Frontend section above
4. Make sure to set the environment to "Production" for all variables
5. Click "Save" after adding each variable

### 3. Redeploy
1. After setting all environment variables, redeploy both projects
2. Go to Deployments tab in each project
3. Click "Redeploy" on the latest deployment

## URL Examples

### For CHARISM Project
If your projects are named:
- Frontend: `charism-frontend`
- Backend: `charism-backend`

Your URLs would be:
```
FRONTEND_URL=https://charism-frontend.vercel.app
FRONTEND_URL_PRODUCTION=https://charism-frontend.vercel.app
FRONTEND_URL_VERCEL=https://charism-frontend.vercel.app
REACT_APP_API_URL=https://charism-backend.vercel.app/api
CORS_ORIGINS=https://charism-frontend.vercel.app,https://charism-backend.vercel.app
```

## Testing

### 1. Test Email Links
1. Try to register a new user
2. Check if verification email link works
3. Try password reset functionality
4. Verify links open the correct frontend pages

### 2. Test Image Display
1. Upload a profile picture
2. Upload an event image
3. Upload a logo
4. Verify images display correctly

### 3. Test API Connectivity
1. Check if frontend can connect to backend
2. Verify CORS is working
3. Test authentication flows

## Troubleshooting

### Email Links Not Working
- Check if `FRONTEND_URL` variables are set correctly
- Verify frontend URL is accessible
- Check email service configuration

### Images Not Displaying
- Verify backend is serving `/uploads` routes
- Check if images are being uploaded to correct folders
- Verify CORS settings allow image access

### API Connection Issues
- Check `REACT_APP_API_URL` is correct
- Verify backend is deployed and running
- Check CORS origins include frontend URL

## Common Issues

### 1. Wrong URLs
- Double-check all URLs are correct
- Ensure no trailing slashes
- Verify HTTPS vs HTTP

### 2. Environment Variable Scope
- Make sure variables are set for "Production" environment
- Check if variables are accessible in your code

### 3. CORS Errors
- Verify `CORS_ORIGINS` includes both frontend and backend URLs
- Check browser console for CORS errors

## Support

If you continue to have issues:
1. Check Vercel deployment logs
2. Verify environment variables are loaded
3. Test with a simple API endpoint first
4. Check browser console for errors

## Notes

- **Never commit sensitive environment variables** to your repository
- **Always use HTTPS** for production URLs
- **Test thoroughly** after each environment variable change
- **Redeploy** after updating environment variables
