@echo off
REM CampusSwap durdurucu - 3000 portunu temizler, Oracle container'i durdurur.

cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Continue';" ^
  "Write-Host '';" ^
  "Write-Host '  ==============================================';" ^
  "Write-Host '    CampusSwap durduruluyor...';" ^
  "Write-Host '  ==============================================';" ^
  "try { Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } } catch {};" ^
  "Get-Process -Name 'node' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue;" ^
  "Write-Host '    [OK] Next.js dev sunucusu kapatildi.' -ForegroundColor Green;" ^
  "docker stop campusswap-oracle 2>&1 | Out-Null;" ^
  "Write-Host '    [OK] Oracle container durduruldu.' -ForegroundColor Green;" ^
  "Write-Host '';" ^
  "Start-Sleep -Seconds 2"
