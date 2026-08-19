@echo off
echo Starting Clinic System...
echo --------------------------
echo 1. Starting Java Backend...
start "Clinic Backend" cmd /c "cd backend && start.bat"
echo.
echo 2. Starting React Frontend...
start "Clinic Frontend" cmd /c "cd frontend && npm run dev"
echo.
echo Both servers are starting in separate windows.
echo Please wait a few seconds and then open the frontend URL (usually http://localhost:5173).
