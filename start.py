#!/usr/bin/env python3
"""
Secret Hitler App Startup Script
This script starts both the backend and frontend servers
Works on Windows, macOS, and Linux
"""

import subprocess
import sys
import os
import time
import platform
import shutil
from pathlib import Path

def check_command(command, name, install_url=None):
    """Check if a command is available in PATH"""
    if shutil.which(command) is None:
        print(f"❌ Error: {name} is not installed or not in PATH")
        if install_url:
            print(f"   Please install {name} from {install_url}")
        return False
    version = subprocess.run([command, "--version"], 
                            capture_output=True, text=True, stderr=subprocess.STDOUT)
    if version.returncode == 0:
        print(f"✅ Found: {version.stdout.strip()}")
    return True

def run_command(command, cwd=None, shell=False, check=True):
    """Run a command and handle errors"""
    try:
        if isinstance(command, str):
            command = command.split()
        subprocess.run(command, cwd=cwd, shell=shell, check=check)
    except subprocess.CalledProcessError as e:
        print(f"❌ Error running command: {' '.join(command) if isinstance(command, list) else command}")
        print(f"   {e}")
        return False
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        return False
    return True

def main():
    """Main startup function"""
    print("=" * 50)
    print("   Secret Hitler App Startup")
    print("=" * 50)
    print()
    
    # Get the project root directory
    project_root = Path(__file__).parent.absolute()
    backend_dir = project_root / "backend"
    frontend_dir = project_root / "frontend"
    
    # Check prerequisites
    print("Checking prerequisites...")
    if not check_command("python", "Python", "https://www.python.org/"):
        sys.exit(1)
    
    # Try python3 if python doesn't work
    python_cmd = "python3" if platform.system() != "Windows" and shutil.which("python3") else "python"
    
    if not check_command("node", "Node.js", "https://nodejs.org/"):
        sys.exit(1)
    
    if not check_command("npm", "npm", "https://nodejs.org/"):
        sys.exit(1)
    
    print()
    print("Setting up backend...")
    
    # Check if backend dependencies are installed
    try:
        import fastapi
        print("✅ Backend dependencies already installed")
    except ImportError:
        print("Installing backend dependencies...")
        if not run_command([python_cmd, "-m", "pip", "install", "-r", "requirements.txt"], 
                          cwd=backend_dir):
            sys.exit(1)
    
    print()
    print("Setting up frontend...")
    
    # Check if frontend dependencies are installed
    if not (frontend_dir / "node_modules").exists():
        print("Installing frontend dependencies...")
        if not run_command(["npm", "install"], cwd=frontend_dir):
            sys.exit(1)
    else:
        print("✅ Frontend dependencies already installed")
    
    print()
    print("Starting servers...")
    print()
    
    # Determine how to start processes based on OS
    is_windows = platform.system() == "Windows"
    
    # Start backend
    print("🚀 Starting backend server on http://localhost:8000")
    backend_cmd = [python_cmd, "-m", "uvicorn", "main:app", 
                   "--reload", "--host", "0.0.0.0", "--port", "8000"]
    
    if is_windows:
        # On Windows, start in a new window
        subprocess.Popen(backend_cmd, cwd=backend_dir, 
                        creationflags=subprocess.CREATE_NEW_CONSOLE)
    else:
        # On Unix-like systems, start in background
        subprocess.Popen(backend_cmd, cwd=backend_dir,
                        stdout=subprocess.DEVNULL, 
                        stderr=subprocess.DEVNULL)
    
    # Wait for backend to start
    time.sleep(2)
    
    # Start frontend
    print("🚀 Starting frontend server on http://localhost:3000")
    frontend_cmd = ["npm", "start"]
    
    if is_windows:
        # On Windows, start in a new window
        subprocess.Popen(frontend_cmd, cwd=frontend_dir,
                        creationflags=subprocess.CREATE_NEW_CONSOLE)
    else:
        # On Unix-like systems, start in background
        subprocess.Popen(frontend_cmd, cwd=frontend_dir,
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL)
    
    print()
    print("=" * 50)
    print("   Servers are starting!")
    print("=" * 50)
    print()
    print("Backend:  http://localhost:8000")
    print("Frontend: http://localhost:3000")
    print()
    print("The application will open in your browser automatically.")
    
    if is_windows:
        print("Close the server windows to stop the servers.")
    else:
        print("Press Ctrl+C to stop the servers.")
        try:
            # Wait for user interrupt
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n\n⚠️  Shutting down servers...")
            print("   Please close the server windows manually.")

if __name__ == "__main__":
    main()

