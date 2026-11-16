@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0..\.."
echo Building the test site...
echo.
call npm run build:test
if errorlevel 1 goto fail
echo.
echo Build passed.
goto end
:fail
echo.
echo Build failed.
:end
pause
