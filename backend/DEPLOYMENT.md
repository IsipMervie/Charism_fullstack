# Backend Deployment Guide

## Overview
This backend is deployed separately from the frontend on Render as a Node.js API.

## Prerequisites
- Node.js 16+ installed
- Render account and project created
- MongoDB database (MongoDB Atlas recommended)

## Environment Setup
1. Copy `env_template.txt` to `.env.local`
2. Set required environment variables:
   - `MONGO_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Secret key for JWT tokens
   - `EMAIL_USER`: Email service username
   - `EMAIL_PASS`: Email service password
   - `NODE_ENV`: `production`

## Local Development
```bash
cd backend
npm install
npm run dev
```

## Deployment Steps

### Option 1: Render Dashboard (Recommended)
1. Connect your GitHub repository to Render
2. Set build settings:
   - Build Command: `echo 'No build step required'`
   - Output Directory: `none`
   - Install Command: `npm install`

### Option 2: Manual Upload
1. Build the project: `npm run build`
2. Upload the backend folder to your hosting service

## Environment Variables
Set these in your Render project settings:
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `EMAIL_USER`: Email service username
- `EMAIL_PASS`: Email service password
- `NODE_ENV`: `production`
- `CORS_ORIGINS`: Comma-separated list of allowed origins

## API Endpoints
The backend provides these main API routes:
- `/api/auth` - Authentication endpoints
- `/api/users` - User management
- `/api/admin` - Admin functions
- `/api/events` - Event management
- `/api/feedback` - Feedback system
- `/api/messages` - Messaging system
- `/api/analytics` - Analytics data
- `/api/settings` - System settings

## Health Checks
Test these endpoints after deployment:
- `/api/health` - Basic health check
- `/api/db-status` - Database connection status
- `/api/test` - General API test

## CORS Configuration
The backend is configured to allow requests from:
- Your frontend domain
- Render domains
- Any origin specified in `CORS_ORIGINS` environment variable

## Troubleshooting
- Check Render logs for errors
- Verify environment variables are set correctly
- Ensure MongoDB is accessible from Render
- Check CORS configuration if frontend can't reach backend

## Post-Deployment
1. Test all API endpoints
2. Verify database connections
3. Test authentication flows
4. Check file upload functionality
5. Monitor performance and errors

## Scaling Considerations
- Render has execution time limits
- Consider database connection pooling
- Monitor memory usage in logs
- Use appropriate timeout settings for long-running operations
