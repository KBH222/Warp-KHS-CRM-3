@echo off
echo ========================================
echo    KHS CRM - Mobile Access Setup
echo ========================================
echo.

:: Get the local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "ipv4" ^| findstr "192.168"') do (
    set IP=%%a
)
:: Remove leading space
set IP=%IP:~1%

echo Your computer's IP address: %IP%
echo.
echo TO ACCESS FROM YOUR iPHONE:
echo ===========================
echo 1. Make sure your iPhone is on the same WiFi
echo 2. Open Safari (must be Safari!)
echo 3. Go to: http://%IP%:5173
echo 4. Tap Share button
echo 5. Tap "Add to Home Screen"
echo 6. Name it "KHS CRM" and tap Add
echo.
echo Starting the server...
echo Press Ctrl+C to stop
echo.

cd frontend
npm run dev -- --host