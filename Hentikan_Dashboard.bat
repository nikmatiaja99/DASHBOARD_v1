@echo off
echo Menghentikan Server BIOTA Smarthome Dashboard di Port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    taskkill /F /PID %%a 2>nul
)
echo.
echo Server berhasil dihentikan.
pause
