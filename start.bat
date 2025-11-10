@echo off
REM Secret Hitler App Startup Script (Batch File)
REM This script starts both the backend and frontend servers

REM Change to script directory
cd /d "%~dp0"

echo ========================================
echo    Secret Hitler App Startup
echo ========================================
echo.

REM Check if Java is installed
echo Checking Java installation...
java -version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Java is not installed or not in PATH
    echo Please install Java 17+ from https://adoptium.net/
    pause
    exit /b 1
)
java -version

REM Check if Maven is installed
echo Checking Maven installation...
mvn --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Maven is not installed or not in PATH
    echo Please install Maven from https://maven.apache.org/
    pause
    exit /b 1
)
mvn --version

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

REM Build Java backend
echo Building Java backend...
cd backend-java
call mvn clean package -DskipTests
if errorlevel 1 (
    echo [ERROR] Failed to build Java backend
    cd ..
    pause
    exit /b 1
)
cd ..
echo Backend built successfully

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
start "Secret Hitler Backend" cmd /k "cd /d %~dp0backend-java && java -jar target\secret-hitler-backend-1.0.0.jar"

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

