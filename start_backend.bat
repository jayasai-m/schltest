@echo off
cd /d "%~dp0smart-school-iot\backend"
echo ========================================================
echo   Starting SmartSchoolIoT FastAPI Backend (MySQL)
echo ========================================================
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
pause
