# PowerShell script to start the frontend development server
Write-Host "🚀 Starting CommunityLink Frontend Server..." -ForegroundColor Green

# Change to frontend directory
Set-Location -Path "frontend"

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️ .env file not found. Creating from template..." -ForegroundColor Yellow
    Copy-Item "env_template.txt" ".env"
    Write-Host "✅ .env file created. Please edit it with your actual values." -ForegroundColor Green
}

# Install dependencies if node_modules doesn't exist
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
    npm install
}

# Start the development server
Write-Host "🌟 Starting frontend development server..." -ForegroundColor Green
npm start

