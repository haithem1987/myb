#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Clean build & full local stack launcher for MYB.

.DESCRIPTION
    1. Checkout the requested branch and pull latest.
    2. Stop existing containers.
    3. Optionally wipe Keycloak volumes (fresh realm).
    4. Build the Angular front-ends (pushdev config, both apps).
    5. Start the full stack via docker-compose.yml + docker-compose.local.yml.
    6. Wait for Keycloak, then patch redirect URIs for port 4300.
    7. Optionally seed the database (Résidence Ellyssa).

.EXAMPLE
    .\scripts\start-local.ps1
    .\scripts\start-local.ps1 -Branch feature/my-branch
    .\scripts\start-local.ps1 -Branch main -CleanKeycloak -Seed
    .\scripts\start-local.ps1 -SkipBuild          # reuse last front build
#>
param(
    [string]$Branch       = "",        # empty = stay on current branch
    [switch]$CleanKeycloak,            # wipe keycloak_data + keycloak-db volumes
    [switch]$Seed,                     # run seed-ellyssa.ps1 after startup
    [switch]$SkipBuild,                # skip npm install + nx build
    [string]$KcAdminPass  = "admin"    # matches KC_BOOTSTRAP_ADMIN_PASSWORD default in docker-compose.yml
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path $PSScriptRoot -Parent
Set-Location $RepoRoot

# ── helpers ───────────────────────────────────────────────────────────────────
function Step($msg)  { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function OK($msg)    { Write-Host "  OK  $msg" -ForegroundColor Green }
function WARN($msg)  { Write-Host "  !!  $msg" -ForegroundColor Yellow }
function FAIL($msg)  { Write-Host "  FAIL $msg" -ForegroundColor Red; exit 1 }

# Load .env so KC_BOOTSTRAP_ADMIN_PASSWORD etc. override the defaults
if (Test-Path "$RepoRoot\.env") {
    Get-Content "$RepoRoot\.env" | Where-Object { $_ -match '^[A-Z_]+=.+' } | ForEach-Object {
        $k, $v = $_ -split '=', 2
        if (-not [System.Environment]::GetEnvironmentVariable($k)) {
            [System.Environment]::SetEnvironmentVariable($k, $v)
        }
    }
    if ($env:KEYCLOAK_ADMIN_PASSWORD) { $KcAdminPass = $env:KEYCLOAK_ADMIN_PASSWORD }
}

# ── 1. Branch checkout ────────────────────────────────────────────────────────
if ($Branch) {
    Step "Git — checkout $Branch"
    git fetch --all --prune
    git checkout $Branch
    git pull
    OK "Sur la branche $Branch"
} else {
    $Branch = git rev-parse --abbrev-ref HEAD
    Step "Git — branche courante : $Branch (pas de checkout)"
}

# ── 2. Stop containers ────────────────────────────────────────────────────────
Step "Docker — arrêt des conteneurs existants"
docker compose -f docker-compose.yml -f docker-compose.local.yml down --remove-orphans 2>&1 | Out-Null
OK "Conteneurs arrêtés"

# ── 3. Keycloak clean ─────────────────────────────────────────────────────────
if ($CleanKeycloak) {
    Step "Keycloak — suppression des volumes (reset realm)"
    docker volume rm myb_keycloak_data            2>&1 | Out-Null
    docker volume rm myb_postgres_keycloak_data   2>&1 | Out-Null
    # also try unprefixed names in case compose project name differs
    docker volume rm keycloak_data                2>&1 | Out-Null
    docker volume rm postgres_keycloak_data       2>&1 | Out-Null
    OK "Volumes Keycloak supprimés"
}

# ── 4. Frontend build ─────────────────────────────────────────────────────────
if (-not $SkipBuild) {
    Step "Frontend — npm install (--legacy-peer-deps)"
    Push-Location "$RepoRoot\src\front\myb.front"
    npm install --legacy-peer-deps
    OK "npm install terminé"

    Step "Frontend — nx build admin (pushdev)"
    npx nx build admin --configuration=pushdev --output-path=dist/local/admin
    OK "admin buildé"

    Step "Frontend — nx build client (pushdev)"
    npx nx build client --configuration=pushdev --output-path=dist/local/client
    OK "client buildé"

    Pop-Location
} else {
    WARN "SkipBuild : réutilisation du dernier build front"
}

# ── 5. Start stack ────────────────────────────────────────────────────────────
Step "Docker — démarrage du stack complet"
# Explicit service list — mirrors push-local.sh; excludes myb-front whose Dockerfile
# requires a production nginx.conf that doesn't exist locally.
$services = @(
    "keycloak-db","keycloak","mailhog","rabbitmq",
    "notificationDB","copropertyDB","timesheetDB","documentDB","invoiceDB","paymentDB",
    "myb-notification","myb-coproperty","myb-mailer","myb-usermanager",
    "myb-timesheet","myb-docmanager","myb-invoice","myb-payment",
    "myb-client-local","myb-admin-local"
)
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d @services
OK "Stack démarré"

# ── 6. Wait for Keycloak ──────────────────────────────────────────────────────
Step "Keycloak — attente santé (max 120s)"
$deadline = (Get-Date).AddSeconds(120)
$ready = $false
while ((Get-Date) -lt $deadline) {
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:8080/realms/master" -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($r.StatusCode -eq 200) { $ready = $true; break }
    } catch {}
    Write-Host "  ... attente Keycloak" -ForegroundColor DarkGray
    Start-Sleep 5
}
if (-not $ready) { FAIL "Keycloak n'a pas démarré dans les 120s — vérifiez: docker compose logs keycloak" }
OK "Keycloak opérationnel"

# ── 7. Patch redirect URIs for port 4300 ─────────────────────────────────────
Step "Keycloak — ajout redirect URI localhost:4300"
try {
    $tokenResp = Invoke-RestMethod -Uri "http://localhost:8080/realms/master/protocol/openid-connect/token" `
        -Method POST -ContentType "application/x-www-form-urlencoded" `
        -Body "username=admin&password=$KcAdminPass&grant_type=password&client_id=admin-cli"
    $token = $tokenResp.access_token

    $clients = Invoke-RestMethod -Uri "http://localhost:8080/admin/realms/MYB/clients" `
        -Headers @{Authorization="Bearer $token"}
    $c = $clients | Where-Object { $_.clientId -eq "MYB-client" }

    if ($c) {
        if ($c.redirectUris -notcontains "http://localhost:4300/*") {
            $c.redirectUris += "http://localhost:4300/*"
        }
        if ($c.webOrigins -notcontains "http://localhost:4300") {
            $c.webOrigins += "http://localhost:4300"
        }
        Invoke-RestMethod -Uri "http://localhost:8080/admin/realms/MYB/clients/$($c.id)" `
            -Method PUT -Headers @{Authorization="Bearer $token"; "Content-Type"="application/json"} `
            -Body ($c | ConvertTo-Json -Depth 10) | Out-Null
        OK "Redirect URI 4300 ajoutée"
    } else {
        WARN "Client MYB-client introuvable — patch redirect URI ignoré"
    }
} catch {
    WARN "Impossible de patcher les redirect URI : $($_.Exception.Message)"
}

# ── 8. Seed ───────────────────────────────────────────────────────────────────
if ($Seed) {
    Step "Seed — Résidence Ellyssa"
    & "$RepoRoot\scripts\seed-ellyssa.ps1" -KcAdminPass $KcAdminPass
}

# ── Résumé ────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host ("=" * 65) -ForegroundColor Green
Write-Host "  MYB LOCAL STACK PRÊT" -ForegroundColor Green
Write-Host ("=" * 65) -ForegroundColor Green
Write-Host ""
Write-Host "  Branche       : $Branch"
Write-Host "  Owner space   : http://localhost:4200"
Write-Host "  Admin space   : http://localhost:4201"
Write-Host "  Dev Angular   : http://localhost:4300  (npx nx serve admin --port 4300)"
Write-Host "  Keycloak      : http://localhost:8080"
Write-Host "  Mailhog       : http://localhost:8025"
Write-Host ""
Write-Host "  Logs          : docker compose -f docker-compose.yml -f docker-compose.local.yml logs -f"
Write-Host "  Stop          : docker compose -f docker-compose.yml -f docker-compose.local.yml down"
Write-Host ""
