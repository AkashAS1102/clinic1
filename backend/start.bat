@echo off
REM Clinic Backend — quick launcher
REM Delegates to start.ps1 (downloads Maven automatically if not present)
echo.
echo  Starting Clinic Java Backend...
echo  (First run downloads Apache Maven ~9MB)
echo.
powershell.exe -ExecutionPolicy Bypass -File "%~dp0start.ps1" %*
