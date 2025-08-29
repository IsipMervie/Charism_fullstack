# 🚀 VERCEL DEPLOYMENT GUIDE FOR COMMUNITYLINK

## 📋 **PREREQUISITES:**
1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **GitHub Account** - Your code must be on GitHub
3. **MongoDB Database** - Your existing database will work

## 🎯 **DEPLOYMENT STEPS:**

### **STEP 1: Connect GitHub to Vercel**
1. **Go to [vercel.com](https://vercel.com)**
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Select the repository: `CommunityLink`**

### **STEP 2: Configure Backend Deployment**
1. **Project Name:** `charism-backend` (or your preferred name)
2. **Framework Preset:** `Node.js`
3. **Root Directory:** `backend`
4. **Build Command:** `npm install`
5. **Output Directory:** Leave empty
6. **Install Command:** `npm install`
7. **Development Command:** `npm run dev`

### **STEP 3: Set Backend Environment Variables**
**In Vercel dashboard, go to Settings > Environment Variables:**

```
MONGO_URI=your_actual_mongodb_connection_string
JWT_SECRET=your_actual_jwt_secret
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_gmail_app_password
FRONTEND_URL=https://your-frontend-project.vercel.app
BACKEND_URL=https://your-backend-project.vercel.app
CORS_ORIGINS=https://your-frontend-project.vercel.app,https://your-backend-project.vercel.app
NODE_ENV=production
```

### **STEP 4: Deploy Backend**
1. **Click "Deploy"**
2. **Wait for deployment to complete**
3. **Note your backend URL:** `https://your-backend-project.vercel.app`

### **STEP 5: Configure Frontend Deployment**
1. **Go back to Vercel dashboard**
2. **Click "New Project" again**
3. **Import the same repository**
4. **Project Name:** `charism-frontend` (or your preferred name)
5. **Framework Preset:** `Create React App`
6. **Root Directory:** `frontend`
7. **Build Command:** `npm run build`
8. **Output Directory:** `build`
9. **Install Command:** `npm install`

### **STEP 6: Set Frontend Environment Variables**
**In Vercel dashboard, go to Settings > Environment Variables:**

```
REACT_APP_API_URL=https://your-backend-project.vercel.app/api
REACT_APP_ENV=production
REACT_APP_VERSION=1.0.0
```

### **STEP 7: Deploy Frontend**
1. **Click "Deploy"**
2. **Wait for deployment to complete**
3. **Note your frontend URL:** `https://your-frontend-project.vercel.app`

## 🔧 **POST-DEPLOYMENT CONFIGURATION:**

### **Update CORS Origins:**
1. **Go to backend project settings**
2. **Update `CORS_ORIGINS` to include your frontend URL**
3. **Redeploy backend**

### **Test Your Application:**
1. **Visit your frontend URL**
2. **Test login/registration**
3. **Test image uploads**
4. **Test event creation**

## 🚨 **IMPORTANT NOTES:**

### **File Uploads:**
- **Vercel has limitations with file uploads**
- **Consider using cloud storage (AWS S3, Cloudinary) for production**
- **For now, small files will work on Vercel**

### **Database:**
- **Your existing MongoDB will work**
- **No changes needed to database**

### **Environment Variables:**
- **Never commit sensitive data to Git**
- **Always use Vercel environment variables**
- **Keep your `.env` files local only**

## 🎉 **SUCCESS INDICATORS:**

✅ **Backend deploys without errors**
✅ **Frontend builds successfully**
✅ **Can access both URLs**
✅ **Login/registration works**
✅ **Images display properly**
✅ **Events can be created**

## 🆘 **TROUBLESHOOTING:**

### **Backend Issues:**
- **Check Vercel function logs**
- **Verify environment variables**
- **Check MongoDB connection**

### **Frontend Issues:**
- **Check build logs**
- **Verify API URL configuration**
- **Check browser console for errors**

## 📞 **NEED HELP?**

**If you encounter issues:**
1. **Check Vercel deployment logs**
2. **Verify environment variables**
3. **Test API endpoints directly**
4. **Check browser console errors**

---

**Good luck with your Vercel deployment! 🚀✨**
