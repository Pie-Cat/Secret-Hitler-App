# Secret Hitler App Startup Script
# This script starts both the backend and frontend servers

# Get the script directory (project root)
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Secret Hitler App Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
Write-Host "Checking Python installation..." -ForegroundColor Yellow
$pythonCheck = & python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.8+ from https://www.python.org/" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
} else {
    Write-Host "Found: $pythonCheck" -ForegroundColor Green
}

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
$nodeCheck = & node --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js 14+ from https://nodejs.org/" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
} else {
    Write-Host "Found: $nodeCheck" -ForegroundColor Green
}

Write-Host ""
Write-Host "Setting up backend..." -ForegroundColor Yellow

# Check if backend dependencies are installed
$fastapiInstalled = & python -c "import fastapi" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    Push-Location "backend"
    & pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to install backend dependencies" -ForegroundColor Red
        Pop-Location
        Read-Host "Press Enter to exit"
        exit 1
    }
    Pop-Location
    Write-Host "Backend dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "Backend dependencies already installed" -ForegroundColor Green
}

Write-Host "Setting up frontend..." -ForegroundColor Yellow

# Check if frontend dependencies are installed
if (-not (Test-Path "frontend\node_modules" -ErrorAction SilentlyContinue)) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location "frontend"
    & npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to install frontend dependencies" -ForegroundColor Red
        Pop-Location
        Read-Host "Press Enter to exit"
        exit 1
    }
    Pop-Location
    Write-Host "Frontend dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "Frontend dependencies already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting servers..." -ForegroundColor Green
Write-Host ""

# Get absolute paths
$backendPath = Join-Path $scriptPath "backend"
$frontendPath = Join-Path $scriptPath "frontend"

# Start backend in a new window
Write-Host "Starting backend server on http://localhost:8000" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

# Wait a moment for backend to start
Start-Sleep -Seconds 2

# Start frontend in a new window
Write-Host "Starting frontend server on http://localhost:3000" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm start"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   Servers are starting!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "The application will open in your browser automatically." -ForegroundColor Cyan
Write-Host "Close the server windows to stop the servers." -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to close this window (servers will continue running)..." -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

