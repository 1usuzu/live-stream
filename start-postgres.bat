@echo off
echo Starting PostgreSQL...

REM Try different service names
net start postgresql-x64-14 2>nul
if %errorlevel% == 0 goto success

net start postgresql-x64-15 2>nul
if %errorlevel% == 0 goto success

net start postgresql-x64-16 2>nul
if %errorlevel% == 0 goto success

net start PostgreSQL 2>nul
if %errorlevel% == 0 goto success

echo.
echo ❌ Could not start PostgreSQL automatically
echo.
echo Please start it manually:
echo   1. Press Win + R
echo   2. Type: services.msc
echo   3. Find PostgreSQL service
echo   4. Right-click → Start
echo.
goto end

:success
echo ✅ PostgreSQL started successfully!

:end
pause
