@echo off
echo ========================================
echo Jai Khyapa Parampara Library
echo Local Server Launcher
echo ========================================
echo.

echo Checking for Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed!
    echo.
    echo Please install Python from: https://www.python.org/downloads/
    echo Or open index.html directly in your browser.
    echo.
    pause
    start index.html
    exit
)

echo Python found! Starting local server...
echo.
echo Your website will be available at:
echo    http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

cd /d "%~dp0"
start http://localhost:8000
python server.py
