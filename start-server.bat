@echo off
REM Start the development server
cd /d "%~dp0"
set PATH=%~dp0..\node;%PATH%
echo Starting Harbor Cloud on http://localhost:3000...
npm run dev
