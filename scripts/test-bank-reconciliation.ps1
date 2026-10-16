#!/usr/bin/env pwsh
<#
.SYNOPSIS
    End-to-end test for the bank reconciliation feature, bypassing Keycloak.

.DESCRIPTION
    Prerequisites:
      1. PostgreSQL running: docker run -d --name myb-payment-pg -e POSTGRES_PASSWORD=payment-pwd -e POSTGRES_DB=paymentDB -p 5432:5432 postgres:16.2
      2. Payment service running: cd src/services/payment-service/Myb.Payment && dotnet run
         (test seed data is auto-inserted on first startup in Development mode)

    The script uses the X-Dev-Auth: bypass header to skip Keycloak authentication.

.EXAMPLE
    .\scripts\test-bank-reconciliation.ps1
    .\scripts\test-bank-reconciliation.ps1 -BaseUrl http://localhost:5000 -OFXFile .\my-statement.ofx
#>

param(
    [string]$BaseUrl = "http://localhost:5000",
    [string]$OFXFile = "$PSScriptRoot\..\test-bank-statement.ofx"
)

$headers = @{ "X-Dev-Auth" = "bypass" }
$ErrorActionPreference = "Stop"

function Write-Step([string]$msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-OK([string]$msg)   { Write-Host "  OK  $msg" -ForegroundColor Green }
function Write-Fail([string]$msg) { Write-Host "  FAIL $msg" -ForegroundColor Red; exit 1 }

# ------------------------------------------------------------------
# 0. Create test OFX file if it doesn't exist
# ------------------------------------------------------------------
if (-not (Test-Path $OFXFile)) {
    Write-Step "Creating test OFX file at $OFXFile"
    $ofx = @'
OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<SIGNONMSGSRSV1><SONRS><STATUS><CODE>0</CODE><SEVERITY>INFO</SEVERITY></STATUS>
<DTSERVER>20261016120000</DTSERVER><LANGUAGE>FRA</LANGUAGE></SONRS></SIGNONMSGSRSV1>
<BANKMSGSRSV1><STMTTRNRS><TRNUID>1</TRNUID><STMTRS><CURDEF>EUR</CURDEF>
<BANKACCTFROM><BANKID>30004</BANKID><ACCTID>12345678901</ACCTID><ACCTTYPE>CHECKING</ACCTTYPE></BANKACCTFROM>
<BANKTRANLIST><DTSTART>20261001</DTSTART><DTEND>20261016</DTEND>
<STMTTRN><TRNTYPE>CREDIT</TRNTYPE><DTPOSTED>20261005</DTPOSTED><TRNAMT>150.00</TRNAMT><FITID>TXN001</FITID><NAME>Virement Dupont</NAME></STMTTRN>
<STMTTRN><TRNTYPE>CREDIT</TRNTYPE><DTPOSTED>20261008</DTPOSTED><TRNAMT>200.00</TRNAMT><FITID>TXN002</FITID><NAME>Virement Martin</NAME></STMTTRN>
<STMTTRN><TRNTYPE>DEBIT</TRNTYPE><DTPOSTED>20261010</DTPOSTED><TRNAMT>-85.50</TRNAMT><FITID>TXN003</FITID><NAME>EDF parties communes</NAME></STMTTRN>
<STMTTRN><TRNTYPE>CREDIT</TRNTYPE><DTPOSTED>20261012</DTPOSTED><TRNAMT>75.00</TRNAMT><FITID>TXN004</FITID><NAME>Virement Bernard</NAME></STMTTRN>
</BANKTRANLIST>
<LEDGERBAL><BALAMT>5234.75</BALAMT><DTASOF>20261016</DTASOF></LEDGERBAL>
</STMTRS></STMTTRNRS></BANKMSGSRSV1>
</OFX>
'@
    $ofx | Set-Content $OFXFile -Encoding ASCII
    Write-OK "Created $OFXFile"
}

# ------------------------------------------------------------------
# 1. Health check
# ------------------------------------------------------------------
Write-Step "Checking service is up at $BaseUrl"
try {
    $null = Invoke-WebRequest "$BaseUrl/openapi/v1.json" -Headers $headers -UseBasicParsing -TimeoutSec 5
    Write-OK "Service is reachable"
} catch {
    if ($_.Exception.Response.StatusCode -in 401, 404) {
        Write-OK "Service is reachable (got $($_.Exception.Response.StatusCode))"
    } else {
        Write-Fail "Cannot reach $BaseUrl — is the payment service running? ($($_.Exception.Message))"
    }
}

# ------------------------------------------------------------------
# 2. Import OFX file
# ------------------------------------------------------------------
Write-Step "Importing OFX file: $OFXFile"
$form = [System.Net.Http.MultipartFormDataContent]::new()
$fileBytes = [System.IO.File]::ReadAllBytes($OFXFile)
$fileContent = [System.Net.Http.ByteArrayContent]::new($fileBytes)
$fileContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("application/octet-stream")
$form.Add($fileContent, "file", [System.IO.Path]::GetFileName($OFXFile))

$client = [System.Net.Http.HttpClient]::new()
$client.DefaultRequestHeaders.Add("X-Dev-Auth", "bypass")
$response = $client.PostAsync("$BaseUrl/api/bank-statements/import", $form).GetAwaiter().GetResult()
$body = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
$client.Dispose()

if (-not $response.IsSuccessStatusCode) {
    Write-Fail "Import failed ($($response.StatusCode)): $body"
}

$import = $body | ConvertFrom-Json
Write-OK "Imported: $($import.TransactionCount) transactions"
Write-OK "  Auto-matched:        $($import.AutoMatched)"
Write-OK "  Manual suggestions:  $($import.ManualSuggestions)"
Write-OK "  Unmatched:           $($import.Unmatched)"

$statementId = $import.StatementId

# ------------------------------------------------------------------
# 3. Fetch reconciliation details
# ------------------------------------------------------------------
Write-Step "Fetching reconciliation for statement $statementId"
$rec = Invoke-RestMethod "$BaseUrl/api/bank-statements/$statementId/reconciliation" -Headers $headers
Write-OK "Got $($rec.Items.Count) reconciliation rows"

foreach ($item in $rec.Items) {
    $status = $item.Reconciliation?.Status ?? "N/A"
    $amount = $item.Transaction.Amount
    $label  = $item.Transaction.Label
    $color  = switch ($status) {
        "AutoMatched"      { "Green" }
        "ManualSuggestion" { "Yellow" }
        "Unmatched"        { "Red" }
        default            { "Gray" }
    }
    Write-Host "  [$status] $($amount.ToString('+0.00;-0.00')) € — $label" -ForegroundColor $color
}

# ------------------------------------------------------------------
# 4. Validate a manual suggestion (if any)
# ------------------------------------------------------------------
$suggestion = $rec.Items | Where-Object { $_.Reconciliation?.Status -eq "ManualSuggestion" } | Select-Object -First 1
if ($suggestion) {
    Write-Step "Validating manual suggestion: $($suggestion.Reconciliation.Id)"
    $validateBody = @{ matchedPaymentId = $suggestion.Reconciliation.MatchedPayment?.Id } | ConvertTo-Json
    Invoke-RestMethod "$BaseUrl/api/bank-statements/$statementId/reconciliation/$($suggestion.Reconciliation.Id)/validate" `
        -Method POST -Headers ($headers + @{"Content-Type"="application/json"}) -Body $validateBody | Out-Null
    Write-OK "Validated"
} else {
    Write-Host "  (no manual suggestions to validate)" -ForegroundColor Gray
}

# ------------------------------------------------------------------
# 5. Download CSV export
# ------------------------------------------------------------------
Write-Step "Downloading CSV export"
$csvPath = "$env:TEMP\rapprochement-test.csv"
Invoke-WebRequest "$BaseUrl/api/bank-statements/$statementId/export" -Headers $headers -OutFile $csvPath -UseBasicParsing
$lineCount = (Get-Content $csvPath).Count
Write-OK "CSV saved to $csvPath ($lineCount lines)"

# ------------------------------------------------------------------
# Summary
# ------------------------------------------------------------------
Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "  ALL TESTS PASSED" -ForegroundColor Green
Write-Host "  Statement ID: $statementId" -ForegroundColor Gray
Write-Host "  CSV export:   $csvPath" -ForegroundColor Gray
Write-Host ("=" * 60) -ForegroundColor Cyan
