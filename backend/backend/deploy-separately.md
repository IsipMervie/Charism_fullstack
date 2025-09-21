# Separate Frontend and Backend Deployment Guide

## Overview
This guide explains how to deploy your CommunityLink application with frontend and backend as separate services on Vercel.

## Why Separate Deployment?
- **Independent scaling**: Frontend and backend can scale independently
- **Better performance**: Static frontend with CDN, serverless backend
- **Easier maintenance**: Update one service without affecting the other
- **Cost optimization**: Pay only for what you use
- **Team collaboration**: Different teams can work on different services

## Project Structure
```
CommunityLink/
├── frontend/          # React application
│   ├── vercel.json   # Frontend Vercel config
│   └── DEPLOYMENT.md # Frontend deployment guide
├── backend/           # Node.js API
│   ├── vercel.json   # Backend Vercel config
│   └── DEPLOYMENT.md # Backend deployment guide
└── vercel.json       # Root config (for reference only)
```

## Deployment Steps

### Step 1: Prepare Backend
1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Set up environment variables:
   ```bash
   cp env_template.txt .env.local
   # Edit .env.local with your production values
   ```

3. Deploy backend:
   ```bash
   vercel --prod
   ```

4. Note the backend URL (e.g., `https://your-backend.vercel.app`)

### Step 2: Prepare Frontend
1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Update backend API URL in environment:
   ```bash
   cp env_template_safe.txt .env.local
   # Set REACT_APP_API_URL to your backend URL
   ```

3. Deploy frontend:
   ```bash
   vercel --prod
   ```

4. Note the frontend URL (e.g., `https://your-frontend.vercel.app`)

### Step 3: Configure CORS
1. In your backend Vercel project settings, add environment variable:
   ```
   CORS_ORIGINS=https://your-frontend.vercel.app
   ```

2. Redeploy backend if needed:
   ```bash
   cd backend
   vercel --prod
   ```

## Environment Variables

### Backend (.env.local)
```bash
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your-super-secret-jwt-key
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-email-password
NODE_ENV=production
CORS_ORIGINS=https://your-frontend.vercel.app
```

### Frontend (.env.local)
```bash
REACT_APP_API_URL=https://your-backend.vercel.app
REACT_APP_ENVIRONMENT=production
```

## Testing After Deployment

### Backend Health Check
```bash
curl https://your-backend.vercel.app/api/health
```

### Frontend API Connection
1. Open your frontend URL
2. Check browser console for API connection errors
3. Test login/authentication
4. Verify data loading from backend

## Troubleshooting

### Common Issues
1. **CORS errors**: Check CORS_ORIGINS in backend environment
2. **API not found**: Verify backend URL in frontend environment
3. **Build failures**: Check build logs in Vercel dashboard
4. **Database connection**: Verify MONGO_URI is accessible from Vercel

### Debug Commands
```bash
# Test backend locally
cd backend
npm run dev

# Test frontend locally
cd frontend
npm start

# Check Vercel deployment status
vercel ls
```

## Maintenance

### Updating Backend
```bash
cd backend
# Make your changes
git add .
git commit -m "Update backend"
vercel --prod
```

### Updating Frontend
```bash
cd frontend
# Make your changes
git add .
git commit -m "Update frontend"
vercel --prod
```

## Cost Considerations
- **Frontend**: Static hosting (usually free tier sufficient)
- **Backend**: Serverless functions (pay per execution)
- **Database**: MongoDB Atlas (separate cost)
- **Bandwidth**: Included in Vercel free tier

## Security Notes
- Keep environment variables secure
- Use strong JWT secrets
- Enable MongoDB network access restrictions
- Monitor API usage and set rate limits if needed

## Support
- Check individual DEPLOYMENT.md files in frontend/ and backend/ directories
- Review Vercel documentation for specific platform features
- Monitor Vercel dashboard for deployment status and logs
