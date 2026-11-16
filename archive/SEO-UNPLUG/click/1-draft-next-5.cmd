@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0..\.."
echo Drafting the next 5 articles...
echo.
python scripts\transcript_context.py run --fixed --limit 5
if errorlevel 1 goto fail
echo.
echo Review file opened. Check it, then double-click 2-apply-reviewed.cmd.
start "" notepad ".cache\context-batches\next-batch.review.md"
goto end
:fail
echo.
echo Draft failed. Nothing was changed. Read the error above.
:end
pause
