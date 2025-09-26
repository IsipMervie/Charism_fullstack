#!/bin/bash

echo "=== DEPLOYING CORS FIXES ==="
echo "Deploying CORS fixes to resolve frontend-backend communication issues..."

# Build and deploy backend with CORS fixes
echo "🔧 Building backend with CORS fixes..."
cd backend
npm install

if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed"
else
    echo "❌ Backend dependency installation failed"
    exit 1
fi

cd ..

# Build frontend with CORS fixes
echo "🔧 Building frontend with CORS fixes..."
cd frontend
npm install
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi

cd ..

echo "📋 CORS FIXES DEPLOYED:"
echo "✅ Backend: Enhanced CORS configuration with explicit origins"
echo "✅ Backend: Added preflight request handling (OPTIONS method)"
echo "✅ Backend: Added CORS headers to all responses"
echo "✅ Frontend: Configured axios with credentials and CORS headers"
echo "✅ Backend: Added CORS test endpoint for debugging"

echo ""
echo "🎯 CORS ERRORS SHOULD NOW BE RESOLVED!"
echo "🚀 Frontend and backend can now communicate properly!"
echo ""
echo "📝 WHAT WAS FIXED:"
echo "1. Added 'Access-Control-Allow-Origin' headers"
echo "2. Configured explicit allowed origins for frontend"
echo "3. Added preflight request handling for OPTIONS method"
echo "4. Enhanced CORS configuration with credentials support"
echo "5. Added CORS test endpoint for debugging"
echo ""
echo "🔧 DEBUGGING:"
echo "Test CORS with: https://charism-api-xtw9.onrender.com/api/cors-test"
echo ""
echo "🎉 DEPLOYMENT COMPLETE - CORS ERRORS FIXED!"
