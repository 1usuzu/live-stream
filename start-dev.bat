@echo off
echo Starting Livestream App...

echo.
echo [1/3] Starting Backend...
start "Backend" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak > nul

echo [2/3] Starting Frontend...
start "Frontend" cmd /k "cd frontend && npm start"

timeout /t 3 /nobreak > nul

echo [3/3] Starting RTMP Server...
start "RTMP" cmd /k "cd rtmp-server && node server.js"

echo.
echo ✅ All services started!
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:3000
echo RTMP:     http://localhost:8000
echo.
pause
