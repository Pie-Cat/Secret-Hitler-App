@echo off
echo Starting Secret Hitler Application...
echo.

echo Checking if backend dependencies are installed...
cd backend
if not exist "venv\" (
    echo Creating Python virtual environment...
    python -m venv venv
)
call venv\Scripts\activate.bat
pip install -r requirements.txt >nul 2>&1
cd ..

echo.
echo Checking if frontend dependencies are installed...
cd frontend
if not exist "node_modules\" (
    echo Installing frontend dependencies...
    call npm install
)
cd ..

echo.
echo Starting backend server on port 8000...
start "Secret Hitler Backend" cmd /k "cd backend && venv\Scripts\activate.bat && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak >nul

echo Starting frontend server on port 3000...
start "Secret Hitler Frontend" cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo Application is starting!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo ========================================
echo.
echo Close the backend and frontend windows to stop the servers.
pause

