@echo off
title CoopSync AI - SIH 2026 Enterprise ERP Launcher
color 0A

echo ======================================================================
echo    CoopSync AI - Cooperative ERP, Biometrics ^& Employment Ecosystem
echo    Smart India Hackathon 2026 - Problem Statement: SIH26087
echo ======================================================================
echo.

cd /d "%~dp0"

:: ----------------------------------------------------------------------
:: 1. Detect Python 3.11 Environment (with bcrypt, sqlalchemy, opencv)
:: ----------------------------------------------------------------------
set "PY_CMD="

py -3.11 -c "import sys, bcrypt, sqlalchemy, fastapi, cv2; sys.exit(0)" >nul 2>nul
if %errorlevel% equ 0 (
    set "PY_CMD=py -3.11"
    goto :PYTHON_FOUND
)

py -3 -c "import sys, bcrypt, sqlalchemy, fastapi, cv2; sys.exit(0)" >nul 2>nul
if %errorlevel% equ 0 (
    set "PY_CMD=py -3"
    goto :PYTHON_FOUND
)

python -c "import sys, bcrypt, sqlalchemy, fastapi, cv2; sys.exit(0)" >nul 2>nul
if %errorlevel% equ 0 (
    set "PY_CMD=python"
    goto :PYTHON_FOUND
)

:: If none of the above passed the package check, fallback to py -3.11 or python
where py >nul 2>nul
if %errorlevel% equ 0 (
    set "PY_CMD=py -3.11"
) else (
    set "PY_CMD=python"
)

:PYTHON_FOUND
echo [OK] Selected Python Environment: %PY_CMD%

:: ----------------------------------------------------------------------
:: 2. Pre-flight Database Verification ^& Idempotent Catalog Seeding
:: ----------------------------------------------------------------------
echo [*] Initializing database and verifying SQLite schema...
%PY_CMD% -c "import sys, os; sys.path.insert(0, r'CoopSyncAI\backend'); import database; database.init_db(); print('[OK] Database schema and idempotent seeding verified.')"

:: ----------------------------------------------------------------------
:: 3. Start FastAPI Backend Server (Port 8000)
:: ----------------------------------------------------------------------
echo.
echo [1/3] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "CoopSync Backend (FastAPI)" cmd /k "cd /d ""%~dp0CoopSyncAI\backend"" && %PY_CMD% main.py"

:: Wait for backend service to bind port
ping 127.0.0.1 -n 4 >nul

:: ----------------------------------------------------------------------
:: 4. Start React Vite Frontend (Port 5173)
:: ----------------------------------------------------------------------
echo.
echo [2/3] Starting React 19 + Vite Frontend on http://localhost:5173 ...
if not exist "CoopSyncAI\frontend\node_modules" (
    echo [*] Installing frontend npm packages first...
    cmd /c "npm --prefix CoopSyncAI\frontend install"
)
start "CoopSync Frontend (React Vite)" cmd /k "cd /d ""%~dp0CoopSyncAI\frontend"" && npm run dev"

:: Wait for Vite dev server
ping 127.0.0.1 -n 4 >nul

:: ----------------------------------------------------------------------
:: 5. Launch Browser
:: ----------------------------------------------------------------------
echo.
echo [3/3] Launching web application in browser...
start http://localhost:5173

echo.
echo ======================================================================
echo    CoopSync AI Ecosystem is now active!
echo.
echo    - Frontend Portal:    http://localhost:5173
echo    - Backend API Docs:   http://127.0.0.1:8000/docs
echo    - API Health Check:   http://127.0.0.1:8000/api/health
echo.
echo    Quick Test Accounts:
echo    - Student:    puneet@coopsync.edu      / pass123
echo    - Admin:      admin@coopsync.edu       / admin123
echo    - Trainer:    trainer@coopsync.edu     / trainer123
echo    - Employer:   sec_employer@agricoop.org / password123
echo ======================================================================
echo.
pause
