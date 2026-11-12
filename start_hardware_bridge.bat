@echo off
cd /d "%~dp0smart-school-iot\backend"
echo ========================================================
echo   SmartSchoolIoT - Hardware USB Serial Bridge (COM5)
echo ========================================================
echo   Reads live sensor data from ESP32 via USB Serial
echo   and streams telemetry into http://127.0.0.1:8000
echo.
echo   NOTE: Please CLOSE the Arduino IDE Serial Monitor window
echo   before running this so COM5 is not locked!
echo ========================================================
echo.
.\venv\Scripts\python.exe hardware_serial_bridge.py
pause
