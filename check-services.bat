@echo off
echo ========================================
echo   Checking Services Status
echo ========================================
echo.

echo [1] Checking PostgreSQL...
sc query postgresql-x64-14 | find "RUNNING" >nul
if %errorlevel% == 0 (
    echo ✅ PostgreSQL is RUNNING
) else (
    echo ❌ PostgreSQL is NOT running
    echo.
    echo To start PostgreSQL:
    echo   1. Open Services (Win + R, type: services.msc)
    echo   2. Find "postgresql-x64-14" (or similar)
    echo   3. Right-click → Start
    echo.
    echo Or run: net start postgresql-x64-14
)

echo.
echo [2] Checking Redis...
sc query Redis | find "RUNNING" >nul
if %errorlevel% == 0 (
    echo ✅ Redis is RUNNING
) else (
    echo ⚠️  Redis is NOT running (optional)
)

echo.
echo [3] Checking Node processes...
tasklist | find "node.exe" >nul
if %errorlevel% == 0 (
    echo ✅ Node.js processes found
    tasklist | find "node.exe"
) else (
    echo ℹ️  No Node.js processes running
)

echo.
echo [4] Checking ports...
netstat -ano | find ":3000" >nul
if %errorlevel% == 0 (
    echo ⚠️  Port 3000 is in use
) else (
    echo ✅ Port 3000 is available
)

netstat -ano | find ":5432" >nul
if %errorlevel% == 0 (
    echo ✅ Port 5432 (PostgreSQL) is in use
) else (
    echo ❌ Port 5432 (PostgreSQL) is NOT in use
)

echo.
echo ========================================
pause
