@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0..\.."
python scripts\transcript_context.py status
pause
