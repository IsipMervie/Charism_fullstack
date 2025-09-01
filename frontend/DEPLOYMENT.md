# Frontend Deployment Guide

## Overview
This frontend is deployed separately from the backend on Vercel as a static React application.

## Prerequisites
- Node.js 16+ installed
- Vercel CLI installed: `npm i -g vercel`
- Vercel account and project created

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
npm run build:vercel
```

## Deployment Steps

### Option 1: Vercel CLI (Recommended)
1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Deploy to Vercel:
   ```bash
   vercel --prod
   ```

3. Follow the prompts to:
   - Link to existing project or create new
   - Set build settings
   - Deploy

### Option 2: GitHub Integration
1. Push your frontend code to a separate repository
2. Connect the repository to Vercel
3. Set build settings:
   - Build Command: `npm run build:vercel`
   - Output Directory: `build`
   - Install Command: `npm install`

## Environment Variables
Set these in your Vercel project settings:
- `REACT_APP_API_URL`: Your backend API URL
- `REACT_APP_ENVIRONMENT`: `production`
- Any other frontend-specific environment variables

## Build Configuration
- Uses `react-app-rewired` for custom build configuration
- Build script: `npm run build:vercel`
- Output directory: `build/`

## Troubleshooting
- If build fails, check the build logs in Vercel
- Ensure all dependencies are in `package.json`
- Verify environment variables are set correctly
- Check that the backend API is accessible from the frontend domain

## Post-Deployment
1. Test all major functionality
2. Verify API calls to backend work correctly
3. Check that static assets load properly
4. Test on different devices/browsers
