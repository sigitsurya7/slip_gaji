@echo off
cd /d %~dp0
echo [ROOT] Installing...
call npm install > nul 2>&1
cd backend
echo [BACKEND] Installing...
call npm install > nul 2>&1
cd ..
exit
