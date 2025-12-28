@echo off
echo ========================================
echo Jai Khyapa Parampara Library
echo Local Server Launcher (11ty + Articles)
echo ========================================
echo.

echo Checking for Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Or use the Python server with: python server.py
    echo.
    pause
    exit
)

echo Node.js found! Starting 11ty development server...
echo.
echo Building and serving your website with live reload...
echo.
echo Your website will be available at:
echo    http://localhost:8080
echo.
echo Articles section available at:
echo    http://localhost:8080/articles/
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

cd /d "%~dp0"
start http://localhost:8080
npm run serve
