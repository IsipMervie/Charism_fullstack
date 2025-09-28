# Start Backend on Correct Port (10000)
Write-Host "🚀 Starting Backend on Port 10000..." -ForegroundColor Green

# Navigate to backend directory
Set-Location backend

# Set environment variables
$env:NODE_ENV = "development"
$env:PORT = "10000"

# Start the backend server
Write-Host "🔧 Starting Express server..." -ForegroundColor Yellow
npm start
