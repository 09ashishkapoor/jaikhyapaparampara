@echo off
REM Build Number and Date Auto-Updater - uses Python for better compatibility

cd /d "%~dp0"

if not exist "index.html" (
    echo Error: index.html not found
    pause
    exit /b 1
)

python "%~dp0scripts\update_build.py"

if errorlevel 1 (
    echo Error running update script
    pause
    exit /b 1
)

pause
