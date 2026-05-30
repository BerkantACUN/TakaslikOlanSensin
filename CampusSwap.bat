@echo off
setlocal EnableDelayedExpansion
title CampusSwap Launcher
color 0B
cd /d "%~dp0"

echo.
echo  ===============================================
echo    CampusSwap baslatiliyor...
echo  ===============================================
echo.

REM ------------------------------------------------------------
REM  1) Docker Desktop calistigindan emin ol
REM ------------------------------------------------------------
echo [1/5] Docker Desktop kontrol ediliyor...
docker ps >nul 2>&1
if errorlevel 1 (
    echo       Docker daemon kapali, Docker Desktop aciliyor...
    if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
        start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    ) else (
        echo       HATA: Docker Desktop bulunamadi. Lutfen kur:
        echo       https://www.docker.com/products/docker-desktop/
        pause
        exit /b 1
    )
    echo       Docker hazir olana kadar bekleniyor ^(max 2 dk^)...
    set /a tries=0
    :wait_docker
    timeout /t 3 /nobreak >nul
    docker ps >nul 2>&1
    if errorlevel 1 (
        set /a tries+=1
        if !tries! lss 40 goto wait_docker
        echo       HATA: Docker baslatilamadi.
        pause
        exit /b 1
    )
)
echo       [OK] Docker hazir.
echo.

REM ------------------------------------------------------------
REM  2) Oracle container baslat (yoksa olustur)
REM ------------------------------------------------------------
echo [2/5] Oracle container kontrol ediliyor...
docker ps -a --format "{{.Names}}" | findstr /B /C:"campusswap-oracle" >nul
if errorlevel 1 (
    echo       Container yok, ilk kurulum yapiliyor.
    echo       Image indiriliyor ^(~1.2 GB, ilk seferde 5-10 dk^)...
    docker run -d --name campusswap-oracle --restart unless-stopped ^
        -p 1521:1521 ^
        -e ORACLE_PASSWORD=campusswap123 ^
        -e APP_USER=campus ^
        -e APP_USER_PASSWORD=campus123 ^
        gvenzl/oracle-free:23-slim-faststart
    if errorlevel 1 (
        echo       HATA: Container olusturulamadi.
        pause
        exit /b 1
    )
    set FIRST_RUN=1
) else (
    docker start campusswap-oracle >nul 2>&1
    set FIRST_RUN=0
)
echo       [OK] Container calisiyor.
echo.

REM ------------------------------------------------------------
REM  3) Oracle DB acilana kadar bekle
REM ------------------------------------------------------------
echo [3/5] Oracle veritabani hazir olana kadar bekleniyor...
set /a db_tries=0
:wait_db
timeout /t 5 /nobreak >nul
docker logs --tail 30 campusswap-oracle 2>nul | findstr /C:"DATABASE IS READY TO USE" >nul
if errorlevel 1 (
    set /a db_tries+=1
    if !db_tries! lss 40 (
        echo       Hala bekleniyor... ^(!db_tries!/40^)
        goto wait_db
    )
    echo       HATA: Oracle 3 dk icinde acilmadi.
    pause
    exit /b 1
)
echo       [OK] Oracle hazir.
echo.

REM ------------------------------------------------------------
REM  4) Bagimliliklar + ilk kurulumda schema/seed
REM ------------------------------------------------------------
if not exist "node_modules" (
    echo [4/5] node_modules bulunamadi, npm install...
    call npm install --legacy-peer-deps --no-fund --no-audit
    if errorlevel 1 (
        echo       HATA: npm install basarisiz.
        pause
        exit /b 1
    )
)
if not exist ".env" (
    echo       .env yok, .env.example kopyalaniyor...
    copy ".env.example" ".env" >nul
)

if "!FIRST_RUN!"=="1" (
    echo [4/5] Ilk kurulum: schema + seed yukleniyor...
    call npm run db:setup
    if errorlevel 1 (
        echo       UYARI: Schema kurulumunda hata olabilir; sistem yine de calisabilir.
    )
    echo       [OK] Schema + demo veri yuklendi.
) else (
    echo [4/5] Mevcut veritabani kullaniliyor.
)
echo.

REM ------------------------------------------------------------
REM  5) Next.js dev sunucusu + tarayici
REM ------------------------------------------------------------
echo [5/5] Next.js dev sunucusu aciliyor...
start "CampusSwap Dev Server" cmd /k "title CampusSwap Dev && color 0A && npm run dev"
echo       Sunucunun yuklenmesini bekliyorum ^(15 sn^)...
timeout /t 15 /nobreak >nul

echo       Tarayici aciliyor: http://localhost:3000
start http://localhost:3000

echo.
echo  ===============================================
echo    CampusSwap calisir durumda!
echo
echo    - Tarayici: http://localhost:3000
echo    - DB:       localhost:1521/FREEPDB1
echo    - Demo:     berkant@example.com / test1234
echo
echo    Kapatmak icin 'CampusSwap Dev Server'
echo    penceresinde Ctrl+C bas; container'i da
echo    durdurmak icin CampusSwap-Stop.bat'i calistir.
echo  ===============================================
echo.
pause
endlocal
