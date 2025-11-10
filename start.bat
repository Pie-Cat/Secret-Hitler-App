@echo off
REM Secret Hitler App Startup Script (Batch File)
REM This script starts both the backend and frontend servers

REM Change to script directory
cd /d "%~dp0"

echo ========================================
echo    Secret Hitler App Startup
echo ========================================
echo.

REM Check if Python is installed
echo Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)
python --version

REM Check if Node.js is installed
echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js 14+ from https://nodejs.org/
    pause
    exit /b 1
)
node --version

echo.
echo Setting up backend...

REM Check if backend dependencies are installed
python -c "import fastapi" >nul 2>&1
if errorlevel 1 (
    echo Installing backend dependencies...
    cd backend
    pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] Failed to install backend dependencies
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo Backend dependencies installed successfully
) else (
    echo Backend dependencies already installed
)

echo Setting up frontend...

REM Check if frontend dependencies are installed
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install frontend dependencies
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo Frontend dependencies installed successfully
) else (
    echo Frontend dependencies already installed
)

echo.
echo Starting servers...
echo.

REM Start backend in a new window
echo Starting backend server on http://localhost:8000
start "Secret Hitler Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

REM Wait a moment for backend to start
timeout /t 2 /nobreak >nul

REM Start frontend in a new window
echo Starting frontend server on http://localhost:3000
start "Secret Hitler Frontend" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo ========================================
echo    Servers are starting!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo The application will open in your browser automatically.
echo Close the server windows to stop the servers.
echo.
echo Press any key to close this window (servers will continue running)...
pause >nul

