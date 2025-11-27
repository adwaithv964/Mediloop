# Mediloop Development Startup Script (PowerShell)

Write-Host "🚀 Starting Mediloop Development Environment" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if backend/.env exists
if (-not (Test-Path "backend\.env")) {
    Write-Host "⚠️  Backend .env file not found!" -ForegroundColor Yellow
    Write-Host "📝 Creating backend\.env from template..." -ForegroundColor Cyan
    Write-Host ""
    
    @"
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
"@ | Out-File -FilePath "backend\.env" -Encoding utf8
    
    Write-Host "✅ Created backend\.env" -ForegroundColor Green
    Write-Host "⚠️  Please add your Gemini API key to backend\.env" -ForegroundColor Yellow
    Write-Host ""
}

# Start backend
Write-Host "🔧 Starting Backend Server..." -ForegroundColor Cyan
Set-Location backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
Set-Location ..

# Small delay
Start-Sleep -Seconds 2

# Start frontend
Write-Host "🎨 Starting Frontend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host ""
Write-Host "✅ Development servers started!" -ForegroundColor Green
Write-Host "📝 Backend: http://localhost:5000" -ForegroundColor Yellow
Write-Host "📝 Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

