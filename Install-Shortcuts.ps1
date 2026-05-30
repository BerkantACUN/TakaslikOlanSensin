# =====================================================================
# Masaustune CampusSwap baslat / durdur kisayollarini kurar.
# Bir kere calistirmak yeterli.
# =====================================================================

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$desktop = [Environment]::GetFolderPath("Desktop")
$WshShell = New-Object -ComObject WScript.Shell

# CampusSwap (baslat) kisayolu
$startLnk = $WshShell.CreateShortcut((Join-Path $desktop "CampusSwap.lnk"))
$startLnk.TargetPath       = Join-Path $projectRoot "CampusSwap.bat"
$startLnk.WorkingDirectory = $projectRoot
$startLnk.Description      = "CampusSwap'i baslat (Docker + Oracle + Dev sunucu)"
$startLnk.IconLocation     = "%SystemRoot%\system32\shell32.dll,138"
$startLnk.Save()

# CampusSwap-Stop kisayolu
$stopLnk = $WshShell.CreateShortcut((Join-Path $desktop "CampusSwap-Stop.lnk"))
$stopLnk.TargetPath       = Join-Path $projectRoot "CampusSwap-Stop.bat"
$stopLnk.WorkingDirectory = $projectRoot
$stopLnk.Description      = "CampusSwap'i durdur (Dev sunucu + Oracle container)"
$stopLnk.IconLocation     = "%SystemRoot%\system32\shell32.dll,131"
$stopLnk.Save()

Write-Host ""
Write-Host "  [OK] Masaustune iki kisayol olusturuldu:" -ForegroundColor Green
Write-Host "      - CampusSwap"
Write-Host "      - CampusSwap-Stop"
Write-Host ""
