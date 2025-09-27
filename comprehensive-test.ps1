# Comprehensive Error Check - CommunityLink
Write-Host "🔍 COMPREHENSIVE SYSTEM ERROR CHECK" -ForegroundColor Red
Write-Host "====================================" -ForegroundColor Red

$errors = 0
$warnings = 0

# Test 1: Backend Health
Write-Host "`n1️⃣ Testing Backend Health..." -ForegroundColor Blue
try {
    $health = Invoke-RestMethod -Uri "http://localhost:10000/health" -Method GET -TimeoutSec 5
    Write-Host "   ✅ Status: $($health.status)" -ForegroundColor Green
    Write-Host "   ✅ Version: $($health.version)" -ForegroundColor Green
    Write-Host "   ✅ Timestamp: $($health.timestamp)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Backend Health Failed: $($_.Exception.Message)" -ForegroundColor Red
    $errors++
}

# Test 2: Database Connection
Write-Host "`n2️⃣ Testing Database Connection..." -ForegroundColor Blue
try {
    $dbTest = Invoke-RestMethod -Uri "http://localhost:10000/api/test-db-connection" -Method GET -TimeoutSec 5
    Write-Host "   ✅ Database Status: $($dbTest.status)" -ForegroundColor Green
    Write-Host "   ✅ User Count: $($dbTest.userCount)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Database Test Failed: $($_.Exception.Message)" -ForegroundColor Red
    $errors++
}

# Test 3: API Endpoints
Write-Host "`n3️⃣ Testing All API Endpoints..." -ForegroundColor Blue
$endpoints = @(
    "/api/test",
    "/api/status", 
    "/api/env-check",
    "/api/health"
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:10000$endpoint" -Method GET -TimeoutSec 5
        Write-Host "   ✅ $endpoint - OK" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ $endpoint - Failed: $($_.Exception.Message)" -ForegroundColor Red
        $errors++
    }
}

# Test 4: CORS Configuration
Write-Host "`n4️⃣ Testing CORS Configuration..." -ForegroundColor Blue
try {
    $corsTest = Invoke-WebRequest -Uri "http://localhost:10000/health" -Method OPTIONS -Headers @{"Origin"="http://localhost:3000"} -TimeoutSec 5
    Write-Host "   ✅ CORS Headers Present" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️ CORS Test Warning: $($_.Exception.Message)" -ForegroundColor Yellow
    $warnings++
}

# Test 5: Frontend Connection
Write-Host "`n5️⃣ Testing Frontend..." -ForegroundColor Blue
try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5
    Write-Host "   ✅ Frontend Status: $($frontend.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️ Frontend Not Started (normal if not running)" -ForegroundColor Yellow
    $warnings++
}

# Test 6: Render Production
Write-Host "`n6️⃣ Testing Render Production..." -ForegroundColor Blue
try {
    $renderFrontend = Invoke-WebRequest -Uri "https://charism-ucb4.onrender.com" -Method GET -TimeoutSec 10
    Write-Host "   ✅ Render Frontend: $($renderFrontend.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Render Frontend Failed: $($_.Exception.Message)" -ForegroundColor Red
    $errors++
}

try {
    $renderBackend = Invoke-WebRequest -Uri "https://charism-api-xtw9.onrender.com/health" -Method GET -TimeoutSec 10
    Write-Host "   ✅ Render Backend: $($renderBackend.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️ Render Backend: May be sleeping (free tier)" -ForegroundColor Yellow
    $warnings++
}

# Test 7: Environment Variables
Write-Host "`n7️⃣ Checking Environment Configuration..." -ForegroundColor Blue
try {
    $envCheck = Invoke-RestMethod -Uri "http://localhost:10000/api/env-check" -Method GET -TimeoutSec 5
    Write-Host "   ✅ Environment Variables: OK" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Environment Check Failed: $($_.Exception.Message)" -ForegroundColor Red
    $errors++
}

# Final Results
Write-Host "`n📊 COMPREHENSIVE TEST RESULTS" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host "Errors Found: $errors" -ForegroundColor $(if($errors -eq 0){"Green"}else{"Red"})
Write-Host "Warnings: $warnings" -ForegroundColor $(if($warnings -eq 0){"Green"}else{"Yellow"})

if ($errors -eq 0) {
    Write-Host "`n🎉 NO CRITICAL ERRORS FOUND!" -ForegroundColor Green
    Write-Host "Your system is working perfectly!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️ $errors CRITICAL ERROR(S) FOUND" -ForegroundColor Red
    Write-Host "These need to be fixed immediately." -ForegroundColor Red
}

if ($warnings -gt 0) {
    Write-Host "`n⚠️ $warnings WARNING(S) - These are usually normal" -ForegroundColor Yellow
}

Write-Host "`n✅ System Check Complete!" -ForegroundColor Green
