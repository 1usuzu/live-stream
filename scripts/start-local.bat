@echo off
REM Script để start toàn bộ services local (Windows)

echo ========================================
echo Starting Livestream App (Local)
echo ========================================
echo.

echo [1/4] Starting PostgreSQL + Redis...
start "PostgreSQL + Redis" cmd /k "docker-compose up postgres redis"
timeout /t 5 /nobreak >nul

echo [2/4] Starting Backend...
start "Backend" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul

echo [3/4] Starting Frontend...
start "Frontend" cmd /k "cd frontend && npm start"
timeout /t 3 /nobreak >nul

echo [4/4] Starting RTMP Server...
start "RTMP Server" cmd /k "cd rtmp-server && npm start"

echo.
echo ========================================
echo All services started!
echo ========================================
echo.
echo URLs:
echo - Frontend: http://localhost:3001
echo - Backend:  http://localhost:3000
echo - RTMP:     rtmp://localhost:1935/live
echo.
echo Press any key to stop all services...
pause >nul

echo.
echo Stopping services...
taskkill /FI "WindowTitle eq PostgreSQL + Redis*" /T /F
taskkill /FI "WindowTitle eq Backend*" /T /F
taskkill /FI "WindowTitle eq Frontend*" /T /F
taskkill /FI "WindowTitle eq RTMP Server*" /T /F
docker-compose down

echo.
echo All services stopped.
pause
