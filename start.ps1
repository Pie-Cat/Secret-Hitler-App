# Secret Hitler App Startup Script
# This script starts both the backend and frontend servers

# Get the script directory (project root)
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Secret Hitler App Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Java is installed
Write-Host "Checking Java installation..." -ForegroundColor Yellow
$javaCheck = & java -version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Java is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Java 17+ from https://adoptium.net/" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
} else {
    Write-Host "Found Java" -ForegroundColor Green
}

# Check if Maven is installed
Write-Host "Checking Maven installation..." -ForegroundColor Yellow
$mavenCheck = & mvn --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Maven is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Maven from https://maven.apache.org/" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
} else {
    Write-Host "Found Maven" -ForegroundColor Green
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

# Build Java backend
Write-Host "Building Java backend..." -ForegroundColor Yellow
Push-Location "backend-java"
& mvn clean package -DskipTests
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to build Java backend" -ForegroundColor Red
    Pop-Location
    Read-Host "Press Enter to exit"
    exit 1
}
Pop-Location
Write-Host "Backend built successfully" -ForegroundColor Green

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
$backendJavaPath = Join-Path $scriptPath "backend-java"
$frontendPath = Join-Path $scriptPath "frontend"

# Start backend in a new window
Write-Host "Starting backend server on http://localhost:8000" -ForegroundColor Cyan
$backendJarPath = Join-Path $backendJavaPath "target\secret-hitler-backend-1.0.0.jar"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendJavaPath'; java -jar '$backendJarPath'"

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

