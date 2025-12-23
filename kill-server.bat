@echo off
REM Kill any process using port 3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo Killing process %%a on port 3000...
    taskkill /PID %%a /F 2>nul
)
echo Port 3000 is now free.
