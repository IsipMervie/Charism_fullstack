# Start Frontend on Correct Port (3000)
Write-Host "🚀 Starting Frontend on Port 3000..." -ForegroundColor Green

# Navigate to frontend directory
Set-Location frontend

# Set environment variable to ensure port 3000
$env:PORT = "3000"
$env:BROWSER = "none"

# Start the React development server
Write-Host "📱 Starting React development server..." -ForegroundColor Yellow
npm start
