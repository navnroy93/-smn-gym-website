@echo off
title SMN GYM Website Server
color 0E

echo =======================================================
echo          STARTING SMN GYM DYNAMIC WEBSITE
echo =======================================================
echo.
echo Checking dependencies...
if not exist node_modules (
    echo Installing required packages...
    call npm install
)

echo.
echo Starting Web Server on Port 3000...
echo.
echo [1] Website URL:       http://localhost:3000
echo [2] Registered Excel:  data\SMN_Gym_Members.xlsx
echo [3] Owner WhatsApp:    +91 8892152766
echo.
echo Opening website in your default browser...
start http://localhost:3000

echo.
echo Press Ctrl+C in this window if you ever want to stop the server.
echo =======================================================
node server.js
pause
