@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0..\.."
echo Running the whole queue unattended: draft, apply, guard, commit, repeat.
echo.
python scripts\transcript_context.py auto
if errorlevel 1 goto fail
echo.
echo All eligible articles now have context.
goto end
:fail
echo.
echo Auto run stopped. Read the error above.
:end
pause
