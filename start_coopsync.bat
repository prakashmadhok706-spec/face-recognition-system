@echo off
title CoopSync AI - SIH 2026 ERP Launcher
color 0A

echo ======================================================================
echo    CoopSync AI - Cooperative ERP, Biometrics & Employment Ecosystem
echo    Problem Statement ID: SIH26087
echo ======================================================================
echo.

cd /d "%~dp0"

echo [1/3] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "CoopSync Backend (FastAPI)" cmd /k "cd CoopSyncAI\backend && python main.py"

timeout /t 3 /nobreak >nul

echo [2/3] Starting React Vite Frontend on http://localhost:5173 ...
start "CoopSync Frontend (React Vite)" cmd /k "cd CoopSyncAI\frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo [3/3] Opening browser...
start http://localhost:5173

echo.
echo ======================================================================
echo    CoopSync AI is now running!
echo    - Frontend UI:  http://localhost:5173
echo    - Backend API:  http://127.0.0.1:8000/docs
echo ======================================================================
echo.
pause
