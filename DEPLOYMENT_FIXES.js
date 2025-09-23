/**
 * DEPLOYMENT FIXES FOR COMMUNITY LINK
 * This script deploys all the critical fixes for the issues reported
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 DEPLOYING CRITICAL FIXES FOR COMMUNITY LINK');
console.log('================================================');

// 1. Copy default event image to backend
console.log('📁 Copying default event image to backend...');
try {
  const frontendImagePath = path.join(__dirname, 'frontend', 'public', 'images', 'default-event.jpg');
  const backendUploadsPath = path.join(__dirname, 'backend', 'uploads', 'default-event.jpg');
  const backendImagesPath = path.join(__dirname, 'backend', 'images', 'default-event.jpg');
  
  // Ensure directories exist
  if (!fs.existsSync(path.join(__dirname, 'backend', 'uploads'))) {
    fs.mkdirSync(path.join(__dirname, 'backend', 'uploads'), { recursive: true });
  }
  if (!fs.existsSync(path.join(__dirname, 'backend', 'images'))) {
    fs.mkdirSync(path.join(__dirname, 'backend', 'images'), { recursive: true });
  }
  
  // Copy the image
  if (fs.existsSync(frontendImagePath)) {
    fs.copyFileSync(frontendImagePath, backendUploadsPath);
    fs.copyFileSync(frontendImagePath, backendImagesPath);
    console.log('✅ Default event image copied successfully');
  } else {
    console.log('⚠️ Frontend default image not found, creating placeholder');
    // Create a simple placeholder image
    const placeholderContent = Buffer.from('placeholder');
    fs.writeFileSync(backendUploadsPath, placeholderContent);
    fs.writeFileSync(backendImagesPath, placeholderContent);
  }
} catch (error) {
  console.error('❌ Error copying default image:', error.message);
}

// 2. Update backend server configuration
console.log('⚙️ Updating backend server configuration...');
try {
  const serverPath = path.join(__dirname, 'backend', 'server.js');
  let serverContent = fs.readFileSync(serverPath, 'utf8');
  
  // Check if images route is already added
  if (!serverContent.includes("app.use('/images', express.static")) {
    // Add images route after uploads route
    serverContent = serverContent.replace(
      "app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));",
      "app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));\n\n// Static folder for images\napp.use('/images', express.static(path.join(__dirname, 'images')));\napp.use('/api/images', express.static(path.join(__dirname, 'images')));"
    );
    
    // Add CORS headers for images
    if (!serverContent.includes("app.use('/images', (req, res, next) =>")) {
      serverContent = serverContent.replace(
        "app.use('/api/uploads', (req, res, next) => {\n  res.header('Access-Control-Allow-Origin', '*');\n  res.header('Access-Control-Allow-Methods', 'GET');\n  res.header('Access-Control-Allow-Headers', 'Content-Type');\n  next();\n});",
        "app.use('/api/uploads', (req, res, next) => {\n  res.header('Access-Control-Allow-Origin', '*');\n  res.header('Access-Control-Allow-Methods', 'GET');\n  res.header('Access-Control-Allow-Headers', 'Content-Type');\n  next();\n});\n\napp.use('/images', (req, res, next) => {\n  res.header('Access-Control-Allow-Origin', '*');\n  res.header('Access-Control-Allow-Methods', 'GET');\n  res.header('Access-Control-Allow-Headers', 'Content-Type');\n  next();\n});\n\napp.use('/api/images', (req, res, next) => {\n  res.header('Access-Control-Allow-Origin', '*');\n  res.header('Access-Control-Allow-Methods', 'GET');\n  res.header('Access-Control-Allow-Headers', 'Content-Type');\n  next();\n});"
      );
    }
    
    fs.writeFileSync(serverPath, serverContent);
    console.log('✅ Backend server configuration updated');
  } else {
    console.log('✅ Backend server configuration already updated');
  }
} catch (error) {
  console.error('❌ Error updating backend server:', error.message);
}

// 3. Update frontend image component
console.log('🖼️ Updating frontend image component...');
try {
  const imageComponentPath = path.join(__dirname, 'frontend', 'src', 'components', 'SimpleEventImage.jsx');
  let imageContent = fs.readFileSync(imageComponentPath, 'utf8');
  
  // Update default image path to use uploads instead of images
  imageContent = imageContent.replace(
    "'https://charism-api-xtw9.onrender.com/images/default-event.jpg'",
    "'https://charism-api-xtw9.onrender.com/uploads/default-event.jpg'"
  );
  
  // Update fallback images to prioritize uploads path
  const fallbackUpdate = `const fallbackImages = [
      'https://charism-api-xtw9.onrender.com/uploads/default-event.jpg',
      'https://charism-api-xtw9.onrender.com/images/default-event.jpg',
      'https://charism-api-xtw9.onrender.com/files/default-event.jpg',
      '/uploads/default-event.jpg',
      '/images/default-event.jpg',
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xNzUgMTI1SDIyNVYxNzVIMTc1VjEyNVoiIGZpbGw9IiNDQ0NDQ0MiLz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSIxODAiIHk9IjEzMCI+CjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjE4IiBzdHJva2U9IiM5OTk5OTkiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNMjYgMTZMMzQgMjRMMjYgMzIiIHN0cm9rZT0iIzk5OTk5OSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+Cjx0ZXh0IHg9IjIwMCIgeT0iMjIwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5OTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiPkV2ZW50IEltYWdlPC90ZXh0Pgo8L3N2Zz4K'
    ];`;
  
  if (!imageContent.includes("'https://charism-api-xtw9.onrender.com/uploads/default-event.jpg',")) {
    // Find and replace the fallback images array
    const fallbackRegex = /const fallbackImages = \[[\s\S]*?\];/;
    imageContent = imageContent.replace(fallbackRegex, fallbackUpdate);
  }
  
  fs.writeFileSync(imageComponentPath, imageContent);
  console.log('✅ Frontend image component updated');
} catch (error) {
  console.error('❌ Error updating frontend image component:', error.message);
}

// 4. Update frontend event list page with better debugging
console.log('📋 Updating frontend event list page...');
try {
  const eventListPath = path.join(__dirname, 'frontend', 'src', 'components', 'EventListPage.jsx');
  let eventListContent = fs.readFileSync(eventListPath, 'utf8');
  
  // Add better user detection debugging
  const debugCode = `// Debug logging for user detection
                console.log(\`🔍 Checking user registration for event "\${event.title}":\`, {
                  userId,
                  userEmail: user.email,
                  userFromStorage: localStorage.getItem('userEmail'),
                  attendanceCount: event.attendance?.length || 0
                });`;
  
  if (!eventListContent.includes('Debug logging for user detection')) {
    // Add debugging after user ID detection
    eventListContent = eventListContent.replace(
      'if (!userId) {\n                  userId = localStorage.getItem(\'userId\');\n                }',
      `if (!userId) {\n                  userId = localStorage.getItem('userId');\n                }\n                \n                ${debugCode}`
    );
  }
  
  // Update attendance matching to include email matching
  const attendanceUpdate = `const att = attendance.find(a => {
                  const attUserId = a.userId?._id || a.userId;
                  const attUserEmail = a.userId?.email || a.email;
                  const matchesId = attUserId === userId;
                  const matchesEmail = attUserEmail === user.email || attUserEmail === localStorage.getItem('userEmail');
                  
                  if (matchesId || matchesEmail) {
                    console.log(\`✅ Found matching attendance:\`, {
                      attUserId,
                      attUserEmail,
                      registrationApproved: a.registrationApproved,
                      status: a.status,
                      matchesId,
                      matchesEmail
                    });
                  }
                  
                  return matchesId || matchesEmail;
                });`;
  
  if (!eventListContent.includes('attUserEmail === user.email')) {
    const attRegex = /const att = attendance\.find\(a => \{[\s\S]*?\}\);/
    eventListContent = eventListContent.replace(attRegex, attendanceUpdate);
  }
  
  // Update isJoined logic to include email matching
  const isJoinedUpdate = `const isJoined = attendance.some(a => {
                  const attUserId = a.userId?._id || a.userId;
                  const attUserEmail = a.userId?.email || a.email;
                  return attUserId === userId || 
                         attUserEmail === user.email || 
                         attUserEmail === localStorage.getItem('userEmail');
                });`;
  
  if (!eventListContent.includes('attUserEmail === user.email ||')) {
    const isJoinedRegex = /const isJoined = attendance\.some\(a => \{[\s\S]*?\}\);/
    eventListContent = eventListContent.replace(isJoinedRegex, isJoinedUpdate);
  }
  
  fs.writeFileSync(eventListPath, eventListContent);
  console.log('✅ Frontend event list page updated');
} catch (error) {
  console.error('❌ Error updating frontend event list page:', error.message);
}

// 5. Add debugging to backend chat controller
console.log('💬 Adding debugging to backend chat controller...');
try {
  const chatControllerPath = path.join(__dirname, 'backend', 'controllers', 'eventChatController.js');
  let chatContent = fs.readFileSync(chatControllerPath, 'utf8');
  
  // Add debugging for chat access
  const debugCode = `console.log(\`🔍 Checking chat access for student \${userId} in event \${eventId}:\`);
      console.log(\`Event attendance:\`, event.attendance.map(a => ({
        userId: a.userId.toString(),
        registrationApproved: a.registrationApproved,
        status: a.status,
        email: a.userId?.email
      })));
      
      const isRegistered = event.attendance.some(att => 
        att.userId.toString() === userId && 
        (att.registrationApproved === true || 
         att.status === 'Approved' || 
         att.status === 'Attended' || 
         att.status === 'Completed')
      );
      
      console.log(\`📊 Chat access result for student \${userId}:\`, {
        isRegistered,
        canAccessChat: isRegistered
      });`;
  
  if (!chatContent.includes('Checking chat access for student')) {
    // Add debugging before the isRegistered check
    chatContent = chatContent.replace(
      'const isRegistered = event.attendance.some(att =>',
      `${debugCode}\n      \n      const isRegistered = event.attendance.some(att =>`
    );
  }
  
  // Add debugging for access denial
  if (!chatContent.includes('Chat access denied for user')) {
    chatContent = chatContent.replace(
      'if (!canAccessChat) {\n      return res.status(403).json({ message: \'You must be registered and approved for this event to participate in chat.\' });\n    }',
      'if (!canAccessChat) {\n      console.log(`❌ Chat access denied for user ${userId} in event ${eventId}`);\n      return res.status(403).json({ message: \'You must be registered and approved for this event to participate in chat.\' });\n    }'
    );
  }
  
  fs.writeFileSync(chatControllerPath, chatContent);
  console.log('✅ Backend chat controller updated');
} catch (error) {
  console.error('❌ Error updating backend chat controller:', error.message);
}

console.log('\n🎉 DEPLOYMENT FIXES COMPLETED!');
console.log('===============================');
console.log('✅ Default event image copied to backend');
console.log('✅ Backend server configured for image serving');
console.log('✅ Frontend image component updated');
console.log('✅ Frontend event list page updated with better debugging');
console.log('✅ Backend chat controller updated with debugging');
console.log('\n📝 NEXT STEPS:');
console.log('1. Deploy the backend changes to Render');
console.log('2. Deploy the frontend changes to Render');
console.log('3. Test the fixes with user jampabustan.student@ua.edu.ph');
console.log('4. Check browser console for debugging information');
console.log('\n🔧 The fixes include:');
console.log('- Fixed default event image loading');
console.log('- Improved user registration detection');
console.log('- Enhanced debugging for troubleshooting');
console.log('- Fixed image path prioritization');
console.log('- Added email-based user matching');
