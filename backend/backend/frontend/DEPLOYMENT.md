# Frontend Deployment Guide

## Overview
This frontend is deployed separately from the backend on Render as a static React application.

## Prerequisites
- Node.js 16+ installed
- Render account and project created

## Environment Setup
1. Copy `env_template_safe.txt` to `.env.local`
2. Update the backend API URL in your environment variables
3. Ensure all required environment variables are set

## Local Development
```bash
cd frontend
npm install
npm start
```

## Building for Production
```bash
npm run build:render
```

## Deployment Steps

### Option 1: Render Dashboard (Recommended)
1. Connect your GitHub repository to Render
2. Set build settings:
   - Build Command: `npm run build:render`
   - Output Directory: `build`
   - Install Command: `npm install`

### Option 2: Manual Upload
1. Build the project: `npm run build:render`
2. Upload the `build` folder to your hosting service

## Environment Variables
Set these in your Render project settings:
- `REACT_APP_API_URL`: Your backend API URL
- `REACT_APP_ENVIRONMENT`: `production`
- Any other frontend-specific environment variables

## Build Configuration
- Uses `react-app-rewired` for custom build configuration
- Build script: `npm run build:render`
- Output directory: `build/`

## Troubleshooting
- If build fails, check the build logs in Render
- Ensure all dependencies are in `package.json`
- Verify environment variables are set correctly
- Check that the backend API is accessible from the frontend domain

## Post-Deployment
1. Test all major functionality
2. Verify API calls to backend work correctly
3. Check that static assets load properly
4. Test on different devices/browsers
