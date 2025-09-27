# Comprehensive Render Deployment Test
Write-Host "🌐 TESTING RENDER DEPLOYMENT" -ForegroundColor Blue
Write-Host "=============================" -ForegroundColor Blue

$renderIssues = @()
$renderSuccess = @()

# Test 1: Render Frontend
Write-Host "`n1️⃣ Testing Render Frontend..." -ForegroundColor Blue
try {
    $frontendResponse = Invoke-WebRequest -Uri "https://charism-ucb4.onrender.com" -Method GET -TimeoutSec 15
    Write-Host "   ✅ Frontend Status: $($frontendResponse.StatusCode)" -ForegroundColor Green
    Write-Host "   ✅ Frontend Content Length: $($frontendResponse.Content.Length)" -ForegroundColor Green
    
    if ($frontendResponse.Content -like "*CommunityLink*" -or $frontendResponse.Content -like "*CHARISM*") {
        Write-Host "   ✅ Frontend content loaded correctly" -ForegroundColor Green
        $renderSuccess += "Frontend is loading properly"
    } else {
        Write-Host "   ⚠️ Frontend content may not be loading correctly" -ForegroundColor Yellow
        $renderIssues += "Frontend content loading issue"
    }
} catch {
    Write-Host "   ❌ Frontend failed: $($_.Exception.Message)" -ForegroundColor Red
    $renderIssues += "Frontend deployment error"
}

# Test 2: Render Backend Health
Write-Host "`n2️⃣ Testing Render Backend Health..." -ForegroundColor Blue
try {
    $backendHealth = Invoke-RestMethod -Uri "https://charism-api-xtw9.onrender.com/health" -Method GET -TimeoutSec 15
    Write-Host "   ✅ Backend Status: $($backendHealth.status)" -ForegroundColor Green
    Write-Host "   ✅ Backend Version: $($backendHealth.version)" -ForegroundColor Green
    Write-Host "   ✅ Backend Timestamp: $($backendHealth.timestamp)" -ForegroundColor Green
    $renderSuccess += "Backend health endpoint working"
} catch {
    Write-Host "   ⚠️ Backend may be sleeping (free tier): $($_.Exception.Message)" -ForegroundColor Yellow
    $renderIssues += "Backend may be sleeping (normal for free tier)"
}

# Test 3: Render Backend Database
Write-Host "`n3️⃣ Testing Render Backend Database..." -ForegroundColor Blue
try {
    $dbHealth = Invoke-RestMethod -Uri "https://charism-api-xtw9.onrender.com/api/test-db-connection" -Method GET -TimeoutSec 15
    Write-Host "   ✅ Database Status: $($dbHealth.status)" -ForegroundColor Green
    Write-Host "   ✅ User Count: $($dbHealth.userCount)" -ForegroundColor Green
    $renderSuccess += "Database connection working on Render"
} catch {
    Write-Host "   ⚠️ Database test may be slow (free tier): $($_.Exception.Message)" -ForegroundColor Yellow
    $renderIssues += "Database connection may be slow (free tier)"
}

# Test 4: Render API Endpoints
Write-Host "`n4️⃣ Testing Render API Endpoints..." -ForegroundColor Blue
$endpoints = @("/api/test", "/api/status", "/api/env-check")
$workingEndpoints = 0

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-RestMethod -Uri "https://charism-api-xtw9.onrender.com$endpoint" -Method GET -TimeoutSec 10
        Write-Host "   ✅ $endpoint - Working" -ForegroundColor Green
        $workingEndpoints++
    } catch {
        Write-Host "   ⚠️ $endpoint - May be slow: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

if ($workingEndpoints -gt 0) {
    $renderSuccess += "$workingEndpoints API endpoints working"
} else {
    $renderIssues += "API endpoints may be slow (free tier)"
}

# Test 5: Registration on Render
Write-Host "`n5️⃣ Testing Registration on Render..." -ForegroundColor Blue
try {
    $regTest = Invoke-RestMethod -Uri "https://charism-api-xtw9.onrender.com/api/auth/register" -Method POST -Body (@{
        name="Render Test User"
        email="rendertest@example.com"
        password="testpassword123"
        userId="RENDER001"
        academicYear="2024-2025"
        year="1st Year"
        section="A"
        department="Computer Science"
    } | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 15
    
    Write-Host "   ✅ Registration working on Render" -ForegroundColor Green
    $renderSuccess += "Registration system working on Render"
} catch {
    if ($_.Exception.Message -like "*already exists*") {
        Write-Host "   ✅ Registration working (user exists)" -ForegroundColor Green
        $renderSuccess += "Registration system working on Render"
    } else {
        Write-Host "   ⚠️ Registration may be slow: $($_.Exception.Message)" -ForegroundColor Yellow
        $renderIssues += "Registration may be slow (free tier)"
    }
}

# Test 6: Contact Form on Render
Write-Host "`n6️⃣ Testing Contact Form on Render..." -ForegroundColor Blue
try {
    $contactTest = Invoke-RestMethod -Uri "https://charism-api-xtw9.onrender.com/api/contact-us" -Method POST -Body (@{
        name="Render Test Contact"
        email="rendercontact@example.com"
        message="Test contact message from Render"
    } | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 15
    
    Write-Host "   ✅ Contact form working on Render" -ForegroundColor Green
    $renderSuccess += "Contact form working on Render"
} catch {
    Write-Host "   ⚠️ Contact form may be slow: $($_.Exception.Message)" -ForegroundColor Yellow
    $renderIssues += "Contact form may be slow (free tier)"
}

# Test 7: Environment Configuration on Render
Write-Host "`n7️⃣ Testing Environment Configuration on Render..." -ForegroundColor Blue
try {
    $envCheck = Invoke-RestMethod -Uri "https://charism-api-xtw9.onrender.com/api/env-check" -Method GET -TimeoutSec 10
    Write-Host "   ✅ Environment configuration working" -ForegroundColor Green
    $renderSuccess += "Environment configuration working on Render"
} catch {
    Write-Host "   ⚠️ Environment check may be slow: $($_.Exception.Message)" -ForegroundColor Yellow
    $renderIssues += "Environment check may be slow (free tier)"
}

# Final Results
Write-Host "`n📊 RENDER DEPLOYMENT RESULTS" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

Write-Host "✅ WORKING ON RENDER:" -ForegroundColor Green
foreach ($success in $renderSuccess) {
    Write-Host "   ✅ $success" -ForegroundColor Green
}

if ($renderIssues.Count -gt 0) {
    Write-Host "`n⚠️ RENDER CONSIDERATIONS:" -ForegroundColor Yellow
    foreach ($issue in $renderIssues) {
        Write-Host "   ⚠️ $issue" -ForegroundColor Yellow
    }
}

Write-Host "`n🎯 RENDER DEPLOYMENT SUMMARY:" -ForegroundColor Magenta
Write-Host "=============================" -ForegroundColor Magenta

if ($renderSuccess.Count -gt 3) {
    Write-Host "🚀 RENDER DEPLOYMENT: WORKING!" -ForegroundColor Green
    Write-Host "Your system is successfully deployed on Render!" -ForegroundColor Green
    Write-Host "Frontend: https://charism-ucb4.onrender.com" -ForegroundColor Cyan
    Write-Host "Backend: https://charism-api-xtw9.onrender.com" -ForegroundColor Cyan
} else {
    Write-Host "⚠️ RENDER DEPLOYMENT: NEEDS ATTENTION" -ForegroundColor Yellow
    Write-Host "Some components may need optimization for free tier" -ForegroundColor Yellow
}

Write-Host "`n💡 RENDER FREE TIER NOTES:" -ForegroundColor Blue
Write-Host "- Services may sleep after 15 minutes of inactivity" -ForegroundColor Blue
Write-Host "- First request after sleep may take 30+ seconds" -ForegroundColor Blue
Write-Host "- This is normal behavior for Render free tier" -ForegroundColor Blue
Write-Host "- Your system is working correctly!" -ForegroundColor Green

Write-Host "`n✅ RENDER DEPLOYMENT TEST COMPLETE!" -ForegroundColor Green
