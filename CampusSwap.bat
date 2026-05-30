@echo off
REM CampusSwap launcher - asil isi CampusSwap.ps1 yapar.
REM PowerShell scripti Ctrl+C ve pencere kapatma olaylarinda
REM dev sunucusu + Oracle container'i otomatik durdurur.

cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0CampusSwap.ps1"
