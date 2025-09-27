# Fast Startup Script - CommunityLink
Write-Host "🚀 FAST START - CommunityLink" -ForegroundColor Green

# Start Backend
Write-Host "Starting Backend..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-Command", "cd backend; node server.js" -WindowStyle Minimized

# Start Frontend  
Write-Host "Starting Frontend..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-Command", "cd frontend; npm start" -WindowStyle Minimized

Write-Host "✅ Services Starting..." -ForegroundColor Green
Write-Host "Backend: http://localhost:10000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Wait 30 seconds then test!" -ForegroundColor Yellow
