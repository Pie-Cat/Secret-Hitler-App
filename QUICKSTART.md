# Quick Start Guide

## 🚀 Running the Application

### Option 1: Double-Click (Windows)
Simply double-click **`start.bat`** in Windows Explorer!

### Option 2: PowerShell (Windows)
Open PowerShell in the project folder and run:
```powershell
.\start.ps1
```

### Option 3: Command Prompt (Windows)
Open Command Prompt in the project folder and run:
```batch
start.bat
```

### Option 4: Python (All Platforms)
```bash
python start.py
```

## What Happens Next?

1. ✅ The script checks for Python and Node.js
2. ✅ Automatically installs dependencies if needed
3. ✅ Starts the backend server (port 8000)
4. ✅ Starts the frontend server (port 3000)
5. ✅ Opens the app in your browser automatically

## Accessing the Game

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000

## Stopping the Servers

Simply close the two server windows that opened. The backend and frontend each run in their own window.

## Troubleshooting

### "Python is not installed"
- Download and install Python 3.8+ from https://www.python.org/
- Make sure to check "Add Python to PATH" during installation

### "Node.js is not installed"
- Download and install Node.js 14+ from https://nodejs.org/
- The installer should add Node.js to your PATH automatically

### "Port already in use"
- Make sure no other applications are using ports 8000 or 3000
- Close any other instances of the Secret Hitler app

### Scripts won't run
- Make sure you're in the project root directory
- On Windows, you may need to allow scripts to run (right-click → Properties → Unblock)

## Need More Help?

See the full [README.md](README.md) for detailed setup instructions and game rules.

