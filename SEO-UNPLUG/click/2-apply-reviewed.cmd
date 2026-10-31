@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0..\.."
if not exist ".cache\context-batches\next-batch.out.json" (
  echo No reviewed batch found. Double-click 1-draft-next-5.cmd first.
  pause
  exit /b 1
)
echo Applying the reviewed batch...
echo.
python scripts\transcript_context.py apply .cache\context-batches\next-batch.out.json
if errorlevel 1 goto fail
echo.
echo Batch applied and archived. Click 1-draft-next-5.cmd for the next 5.
echo.
python scripts\transcript_context.py status
goto end
:fail
echo.
echo Apply failed. The batch was not archived. Fix the error and click again.
:end
pause
