# =====================================================================
# CampusSwap — tek script launcher
# Docker + Oracle container + Next.js dev sunucusunu baslatir, tarayiciyi
# acar. Pencerede Ctrl+C basildiginda veya pencere kapatildiginda dev
# sunucusu ve Oracle container otomatik durdurulur.
# =====================================================================

$ErrorActionPreference = "Continue"
$script:Stopped = $false

# Bu script'in bulundugu klasor proje koku
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

$Host.UI.RawUI.WindowTitle = "CampusSwap (Ctrl+C ile kapat)"

function Write-Step {
    param([string]$Tag, [string]$Msg)
    Write-Host ""
    Write-Host "[$Tag] " -ForegroundColor Cyan -NoNewline
    Write-Host $Msg
}

function Wait-Docker {
    Write-Host "      Docker daemon hazir olana kadar bekleniyor..."
    $tries = 0
    while ($tries -lt 40) {
        docker ps 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) { return $true }
        Start-Sleep -Seconds 3
        $tries++
    }
    return $false
}

function Wait-OracleReady {
    Write-Host "      'DATABASE IS READY TO USE' log'u bekleniyor..."
    $tries = 0
    while ($tries -lt 40) {
        $logs = docker logs --tail 30 campusswap-oracle 2>&1 | Out-String
        if ($logs -match "DATABASE IS READY TO USE") { return $true }
        if ($tries -gt 0 -and $tries % 4 -eq 0) {
            Write-Host "      Hala bekleniyor... ($tries/40)"
        }
        Start-Sleep -Seconds 5
        $tries++
    }
    return $false
}

function Stop-Everything {
    if ($script:Stopped) { return }
    $script:Stopped = $true

    Write-Host ""
    Write-Host ""
    Write-Host "  ===============================================" -ForegroundColor Red
    Write-Host "    Servisler durduruluyor..." -ForegroundColor Red
    Write-Host "  ===============================================" -ForegroundColor Red

    # 1) 3000 portunu tutan node process'lerini kapat
    try {
        $conns = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
        foreach ($c in $conns) {
            Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    } catch {}

    # 2) Geride kalan node.exe'leri de temizle (dev tree)
    Get-Process -Name "node" -ErrorAction SilentlyContinue | ForEach-Object {
        try { $_ | Stop-Process -Force -ErrorAction SilentlyContinue } catch {}
    }

    # 3) Oracle container'i durdur
    docker stop campusswap-oracle 2>&1 | Out-Null

    Write-Host "    [OK] Next.js + Oracle kapatildi." -ForegroundColor Green
    Start-Sleep -Seconds 2
}

# Pencere kapatildiginda da cleanup tetiklensin
try {
    Register-EngineEvent -SourceIdentifier ([System.Management.Automation.PsEngineEvent]::Exiting) `
        -Action { Stop-Everything } | Out-Null
} catch {}

# Ctrl+C handler (PowerShell engine'in Ctrl+C iptalini try/finally ile yakaliyoruz)

try {
    Write-Host ""
    Write-Host "  ===============================================" -ForegroundColor Cyan
    Write-Host "    CampusSwap baslatiliyor..." -ForegroundColor Cyan
    Write-Host "  ===============================================" -ForegroundColor Cyan

    # ------------------------------------------------------------
    # 1) Docker Desktop
    # ------------------------------------------------------------
    Write-Step "1/5" "Docker Desktop kontrol ediliyor..."
    docker ps 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "      Docker daemon kapali, Docker Desktop aciliyor..."
        $dockerExe = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        if (-not (Test-Path $dockerExe)) {
            Write-Host "      HATA: Docker Desktop bulunamadi. Yukleyin:" -ForegroundColor Red
            Write-Host "      https://www.docker.com/products/docker-desktop/"
            Read-Host "Cikis icin Enter'a basin"
            return
        }
        Start-Process $dockerExe
        if (-not (Wait-Docker)) {
            Write-Host "      HATA: Docker baslatilamadi (2 dk timeout)." -ForegroundColor Red
            Read-Host "Enter"
            return
        }
    }
    Write-Host "      [OK] Docker hazir." -ForegroundColor Green

    # ------------------------------------------------------------
    # 2) Oracle container
    # ------------------------------------------------------------
    Write-Step "2/5" "Oracle container kontrol ediliyor..."
    $existing = docker ps -a --format "{{.Names}}" 2>$null | Select-String -SimpleMatch "campusswap-oracle"
    $firstRun = $false
    if (-not $existing) {
        Write-Host "      Container yok, ilk kurulum yapiliyor."
        Write-Host "      Image indiriliyor (~1.2 GB, 5-10 dk surebilir)..."
        docker run -d --name campusswap-oracle --restart unless-stopped `
            -p 1521:1521 `
            -e ORACLE_PASSWORD=campusswap123 `
            -e APP_USER=campus `
            -e APP_USER_PASSWORD=campus123 `
            gvenzl/oracle-free:23-slim-faststart | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "      HATA: Container olusturulamadi." -ForegroundColor Red
            Read-Host "Enter"
            return
        }
        $firstRun = $true
    } else {
        docker start campusswap-oracle 2>&1 | Out-Null
    }
    Write-Host "      [OK] Container calisiyor." -ForegroundColor Green

    # ------------------------------------------------------------
    # 3) DB hazir
    # ------------------------------------------------------------
    Write-Step "3/5" "Oracle veritabani hazir olana kadar bekleniyor..."
    if (-not (Wait-OracleReady)) {
        Write-Host "      HATA: Oracle 3 dk icinde acilmadi." -ForegroundColor Red
        Read-Host "Enter"
        return
    }
    Write-Host "      [OK] Oracle hazir." -ForegroundColor Green

    # ------------------------------------------------------------
    # 4) Bagimliliklar + ilk kurulumda schema/seed
    # ------------------------------------------------------------
    if (-not (Test-Path "node_modules")) {
        Write-Step "4/5" "node_modules yok, npm install..."
        npm install --legacy-peer-deps --no-fund --no-audit
    }
    if (-not (Test-Path ".env")) {
        Copy-Item ".env.example" ".env"
    }
    if ($firstRun) {
        Write-Step "4/5" "Ilk kurulum: schema + seed yukleniyor..."
        npm run db:setup
        Write-Host "      [OK] Schema + demo veri yuklendi." -ForegroundColor Green
    } else {
        Write-Step "4/5" "Mevcut veritabani kullaniliyor."
    }

    # ------------------------------------------------------------
    # 5) Tarayici (gecikmeli) + dev sunucusu (on planda)
    # ------------------------------------------------------------
    Write-Step "5/5" "Next.js dev sunucusu baslatiliyor..."

    # 12 sn sonra tarayiciyi ac
    Start-Job -ScriptBlock {
        Start-Sleep -Seconds 12
        Start-Process "http://localhost:3000"
    } | Out-Null

    Write-Host ""
    Write-Host "  ===============================================" -ForegroundColor Green
    Write-Host "    CampusSwap calisir durumda!" -ForegroundColor Green
    Write-Host ""
    Write-Host "    Tarayici:  http://localhost:3000"
    Write-Host "    DB:        localhost:1521/FREEPDB1"
    Write-Host "    Demo:      berkant@example.com / test1234"
    Write-Host ""
    Write-Host "    KAPATMAK ICIN: Ctrl+C bas veya bu pencereyi kapat." -ForegroundColor Yellow
    Write-Host "    Otomatik olarak Next.js + Oracle durdurulacak."
    Write-Host "  ===============================================" -ForegroundColor Green
    Write-Host ""

    # npm run dev'i ön planda çalıştır — Ctrl+C ile dön
    npm run dev

} finally {
    Stop-Everything
}
