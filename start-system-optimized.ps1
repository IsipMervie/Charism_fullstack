# Optimized CommunityLink System Startup Script
# This script prevents timeouts and port conflicts

Write-Host "🚀 Starting CommunityLink System (Optimized)" -ForegroundColor Green

# Kill any existing Node.js processes
Write-Host "🧹 Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Wait for processes to fully terminate
Start-Sleep -Seconds 2

# Check if port 10000 is free
Write-Host "🔍 Checking port availability..." -ForegroundColor Yellow
$portCheck = netstat -ano | findstr :10000
if ($portCheck) {
    Write-Host "⚠️ Port 10000 is still in use, waiting..." -ForegroundColor Red
    Start-Sleep -Seconds 3
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Start backend with optimized settings
Write-Host "🔧 Starting backend server..." -ForegroundColor Green
cd backend

# Set environment variables for better performance
$env:NODE_ENV = "production"
$env:NODE_OPTIONS = "--max-old-space-size=4096"

# Start the server
node server.js

Write-Host "✅ Backend server started successfully!" -ForegroundColor Green
