@echo off
echo ========================================================
echo   Starting SmartSchoolIoT Project (Backend + Frontend)
echo ========================================================
echo.
echo [1/2] Launching FastAPI Backend on 0.0.0.0:8000 ...
start "SmartSchoolIoT Backend (Port 8000)" cmd /k "%~dp0start_backend.bat"
timeout /t 3 /nobreak >nul

echo [2/2] Launching Vite React Frontend on port 3000 ...
start "SmartSchoolIoT Frontend (Port 3000)" cmd /k "%~dp0start_frontend.bat"

echo.
echo ========================================================
echo Both servers are launching!
echo Local App URL:   http://localhost:3000
echo Local Backend:   http://localhost:8000 (0.0.0.0:8000)
echo Global Cloud:    https://smart-school-iot.vercel.app
echo Hardware Bridge: Run start_hardware_bridge.bat for USB
echo ========================================================
pause
