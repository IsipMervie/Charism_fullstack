# Quick Start Script for CommunityLink
Write-Host "🚀 Starting CommunityLink System..." -ForegroundColor Green

# Start Backend
Write-Host "`n📡 Starting Backend Server..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-Command", "cd backend; node server.js" -WindowStyle Minimized

# Wait for backend to start
Write-Host "⏳ Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test Backend
Write-Host "`n🔍 Testing Backend..." -ForegroundColor Blue
try {
    $backendHealth = Invoke-RestMethod -Uri "http://localhost:10000/health" -Method GET -TimeoutSec 5
    Write-Host "✅ Backend Status: $($backendHealth.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend not responding: $($_.Exception.Message)" -ForegroundColor Red
}

# Start Frontend
Write-Host "`n🌐 Starting Frontend..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-Command", "cd frontend; npm start" -WindowStyle Minimized

# Wait for frontend to start
Write-Host "⏳ Waiting for frontend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Test Frontend
Write-Host "`n🔍 Testing Frontend..." -ForegroundColor Blue
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5
    Write-Host "✅ Frontend Status: $($frontendResponse.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend not responding: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 System Startup Complete!" -ForegroundColor Green
Write-Host "Backend: http://localhost:10000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
