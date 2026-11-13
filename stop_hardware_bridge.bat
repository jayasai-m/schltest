@echo off
echo ========================================================
echo   Stopping Hardware Serial Bridge (Freeing COM5)
echo ========================================================
echo.
powershell -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'hardware_serial_bridge.py' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force; Write-Host 'Stopped bridge process: ' $_.ProcessId }"
echo.
echo ========================================================
echo   COM5 is now FREE!
echo   You can now upload code or open Serial Monitor in Arduino IDE.
echo ========================================================
pause
