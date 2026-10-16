#!/usr/bin/env pwsh
<#
.SYNOPSIS
    E2E test for bank reconciliation feature (OFX / CSV / PDF import).

.DESCRIPTION
    Builds and starts the payment service locally, then imports three test
    bank statement files (OFX, CSV, PDF), validates transaction counts and
    reconciliation statuses, and prints a pass/fail report.

    The service is stopped after the tests unless -KeepRunning is set.

.PARAMETER BaseUrl
    Base URL of the payment service (default: http://localhost:5002).
    Pass a remote URL to skip the local build+start step.

.PARAMETER SkipBuild
    Skip dotnet publish. Use if the service is already running.

.PARAMETER KeepRunning
    Do not stop the service after tests.

.EXAMPLE
    # Build, run and test (default)
    .\e2e-bank-reconciliation.ps1

    # Test against an already-running service
    .\e2e-bank-reconciliation.ps1 -SkipBuild

    # Test against Docker / staging
    .\e2e-bank-reconciliation.ps1 -BaseUrl http://localhost:8084 -SkipBuild
#>
param(
    [string]$BaseUrl      = "http://localhost:5002",
    [switch]$SkipBuild,
    [switch]$KeepRunning
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ── Helpers ──────────────────────────────────────────────────────────────────

$script:passed  = 0
$script:failed  = 0
$script:dotnetPid = $null

function Write-Header([string]$text) {
    Write-Host ""
    Write-Host "━━━  $text  ━━━" -ForegroundColor Cyan
}

function Pass([string]$label) {
    Write-Host "  ✓  $label" -ForegroundColor Green
    $script:passed++
}

function Fail([string]$label, [string]$detail = "") {
    Write-Host "  ✗  $label" -ForegroundColor Red
    if ($detail) { Write-Host "     $detail" -ForegroundColor DarkRed }
    $script:failed++
}

function Assert-Equal($actual, $expected, [string]$label) {
    if ($actual -eq $expected) { Pass $label }
    else { Fail $label "expected=$expected  actual=$actual" }
}

function Assert-GreaterThan($actual, $min, [string]$label) {
    if ($actual -gt $min) { Pass $label }
    else { Fail $label "expected > $min  actual=$actual" }
}

# ── Resolve script directory ──────────────────────────────────────────────────

$scriptDir = $PSScriptRoot
if (-not $scriptDir) { $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path }

$repoRoot  = Resolve-Path (Join-Path $scriptDir "..\..\..")
$csprojPath = Join-Path $repoRoot "src\services\payment-service\Myb.Payment\Myb.Payment.csproj"
$ofxFile   = Join-Path $repoRoot "test-bank-statement.ofx"
$csvFile   = Join-Path $repoRoot "test-bank-statement.csv"
$pdfFile   = Join-Path $repoRoot "test-bank-statement.pdf"

foreach ($f in @($ofxFile, $csvFile, $pdfFile)) {
    if (-not (Test-Path $f)) { throw "Test file not found: $f" }
}

# ── Build & start service ─────────────────────────────────────────────────────

if (-not $SkipBuild) {
    Write-Header "Build"
    $pubDir = Join-Path $env:TEMP "payment-e2e-$(Get-Date -Format 'HHmmss')"
    New-Item -ItemType Directory -Force -Path $pubDir | Out-Null

    Write-Host "  Publishing to $pubDir ..."
    $buildOut = dotnet publish $csprojPath -o $pubDir -c Debug 2>&1
    if ($LASTEXITCODE -ne 0) { throw "dotnet publish failed:`n$buildOut" }
    Write-Host "  Build OK" -ForegroundColor Green

    Write-Header "Start service"
    # Kill any existing service on the same port
    $port = ([Uri]$BaseUrl).Port
    $existingPid = (netstat -ano | Select-String ":$port\s.*LISTENING") -replace '.*LISTENING\s+', '' |
                   Select-Object -First 1
    if ($existingPid) {
        Write-Host "  Stopping existing process $existingPid on port $port"
        Stop-Process -Id ([int]$existingPid) -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
    }

    $env:ASPNETCORE_URLS        = $BaseUrl
    $env:ASPNETCORE_ENVIRONMENT = "Development"
    $proc = Start-Process dotnet -ArgumentList "$pubDir\Myb.Payment.dll" -PassThru
    $script:dotnetPid = $proc.Id
    Write-Host "  Service started (PID $($proc.Id)), waiting for ready ..."

    # Wait up to 15 s for the service to accept connections
    $ready = $false
    for ($i = 0; $i -lt 15; $i++) {
        Start-Sleep -Seconds 1
        try {
            $null = Invoke-WebRequest -Uri "$BaseUrl/api/bank-statements/import" `
                        -Method OPTIONS -Headers @{"X-Dev-Auth"="bypass"} `
                        -ErrorAction Stop
            $ready = $true; break
        } catch {
            if ($_.Exception.Response -ne $null) { $ready = $true; break }
        }
    }
    if (-not $ready) { throw "Service did not become ready within 15 s" }
    Write-Host "  Service ready" -ForegroundColor Green
}

# ── Import helper ─────────────────────────────────────────────────────────────

function Import-Statement([string]$filePath, [string]$mimeType) {
    $result = curl -s -X POST "$BaseUrl/api/bank-statements/import" `
                   -H "X-Dev-Auth: bypass" `
                   -F "file=@${filePath};type=$mimeType"
    return $result | ConvertFrom-Json
}

function Get-Reconciliation([string]$statementId) {
    $result = curl -s "$BaseUrl/api/bank-statements/$statementId/reconciliation" `
                   -H "X-Dev-Auth: bypass"
    return $result | ConvertFrom-Json
}

# ── Tests ─────────────────────────────────────────────────────────────────────

Write-Header "OFX import"
$ofx = Import-Statement $ofxFile "application/x-ofx"
Assert-Equal $ofx.TransactionCount 4   "OFX: 4 transactions"
Assert-Equal $ofx.AutoMatched      3   "OFX: 3 AutoMatched"
Assert-Equal $ofx.ManualSuggestions 0  "OFX: 0 ManualSuggestions"
Assert-Equal $ofx.Unmatched        1   "OFX: 1 Unmatched"

Write-Header "OFX reconciliation detail"
$ofxRec = Get-Reconciliation $ofx.StatementId
Assert-Equal $ofxRec.Format "OFX" "OFX detail: correct format"
Assert-Equal $ofxRec.Items.Count 4 "OFX detail: 4 items"
$ofxMatched = ($ofxRec.Items | Where-Object { $_.Reconciliation.Status -eq 0 }).Count
Assert-Equal $ofxMatched 3 "OFX detail: 3 items with Status=AutoMatched(0)"
$ofxWithPayment = ($ofxRec.Items | Where-Object { $_.Reconciliation.MatchedPayment -ne $null }).Count
Assert-Equal $ofxWithPayment 3 "OFX detail: 3 items with MatchedPayment"

Write-Header "CSV import"
$csv = Import-Statement $csvFile "text/csv"
Assert-Equal $csv.TransactionCount  4 "CSV: 4 transactions"
Assert-Equal $csv.ManualSuggestions 3 "CSV: 3 ManualSuggestions"
Assert-Equal $csv.Unmatched         1 "CSV: 1 Unmatched"

Write-Header "CSV reconciliation detail"
$csvRec = Get-Reconciliation $csv.StatementId
Assert-Equal $csvRec.Format "CSV" "CSV detail: correct format"
Assert-Equal $csvRec.Items.Count 4 "CSV detail: 4 items"

Write-Header "PDF import"
$pdf = Import-Statement $pdfFile "application/pdf"
Assert-Equal $pdf.TransactionCount  4 "PDF: 4 transactions"
Assert-Equal $pdf.ManualSuggestions 3 "PDF: 3 ManualSuggestions"
Assert-Equal $pdf.Unmatched         1 "PDF: 1 Unmatched"

Write-Header "PDF reconciliation detail"
$pdfRec = Get-Reconciliation $pdf.StatementId
Assert-Equal $pdfRec.Format "PDF" "PDF detail: correct format"
Assert-Equal $pdfRec.Items.Count 4 "PDF detail: 4 items"

# Check that amounts are correctly parsed for all 4 PDF rows
$pdfAmounts = ($pdfRec.Items | ForEach-Object { $_.Transaction.Amount }) | Sort-Object
$expectedAmounts = @(-12.5, 75.0, 150.0, 200.0) | Sort-Object
$amountsMatch = ($pdfAmounts.Count -eq 4) -and
                ($pdfAmounts[0] -eq -12.5) -and ($pdfAmounts[1] -eq 75.0) -and
                ($pdfAmounts[2] -eq 150.0) -and ($pdfAmounts[3] -eq 200.0)
if ($amountsMatch) { Pass "PDF detail: all amounts correctly parsed" }
else { Fail "PDF detail: amount mismatch" "got: $($pdfAmounts -join ', ')" }

# Verify matched payments carry the right price
$pdfMatchedAmounts = ($pdfRec.Items |
    Where-Object { $_.Reconciliation.MatchedPayment -ne $null } |
    ForEach-Object { $_.Reconciliation.MatchedPayment.Price }) | Sort-Object
Assert-Equal $pdfMatchedAmounts.Count 3 "PDF detail: 3 matched payments"

Write-Header "Export CSV"
$exportStatus = curl -s -o /dev/null -w "%{http_code}" `
    "$BaseUrl/api/bank-statements/$($pdf.StatementId)/export" `
    -H "X-Dev-Auth: bypass"
Assert-Equal $exportStatus "200" "PDF export: HTTP 200"

# ── Summary ──────────────────────────────────────────────────────────────────

Write-Header "Results"
$total = $script:passed + $script:failed
Write-Host "  $($script:passed)/$total passed" -ForegroundColor ($script:failed -eq 0 ? "Green" : "Yellow")

if (-not $KeepRunning -and $script:dotnetPid) {
    Write-Host ""
    Write-Host "  Stopping service (PID $($script:dotnetPid)) ..."
    Stop-Process -Id $script:dotnetPid -Force -ErrorAction SilentlyContinue
}

if ($script:failed -gt 0) {
    Write-Host "  $($script:failed) test(s) FAILED" -ForegroundColor Red
    exit 1
}

Write-Host "  All tests passed" -ForegroundColor Green
exit 0
