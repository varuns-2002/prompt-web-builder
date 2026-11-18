@echo off
rem Starts Prompt Web Builder and opens it in your browser.
rem Close this window to stop the server.

set "PATH=%USERPROFILE%\tools\node-v24.20.0-win-x64;%PATH%"
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Install Node.js 20 or newer from https://nodejs.org and run this file again.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing dependencies, this takes a minute the first time...
  call npm install
)

rem Open the browser after the server has had time to start.
start "" cmd /c "timeout /t 8 /nobreak >nul & start http://localhost:3100"

echo Starting on http://localhost:3100  (press Ctrl+C to stop)
call npm run dev -- -p 3100
pause
