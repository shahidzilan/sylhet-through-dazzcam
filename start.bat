@echo off
REM Double-click this to build + preview your flipbook. No installs needed (uses Node).
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js not found. Install it from https://nodejs.org/ then double-click again.
  pause
  exit /b 1
)
node make-thumbs.mjs
if errorlevel 1 pause
node build.mjs
if errorlevel 1 pause
start "" "http://127.0.0.1:4174/"
node server.mjs 4174
pause
