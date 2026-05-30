@echo off
title CampusSwap Stop
color 0C
echo.
echo  ===============================================
echo    CampusSwap durduruluyor...
echo  ===============================================
echo.

REM 3000 portunu tutan node process'lerini kapat
echo [1/2] Next.js dev sunucusu durduruluyor...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 " ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)
echo       [OK]

echo [2/2] Oracle container durduruluyor...
docker stop campusswap-oracle >nul 2>&1
if errorlevel 1 (
    echo       UYARI: Container zaten kapali ya da Docker calismiyor.
) else (
    echo       [OK]
)

echo.
echo  ===============================================
echo    Tum servisler durduruldu.
echo  ===============================================
echo.
timeout /t 3 /nobreak >nul
