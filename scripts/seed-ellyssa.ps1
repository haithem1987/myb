#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Seed complet — Résidence Ellyssa, Jardin de Carthage, Tunis.

.DESCRIPTION
    Crée dans Keycloak ET la base copropriété :
      • 1 syndic bénévole  (syndic.ellyssa)
      • 4 membres du conseil syndical bénévoles  (conseil1 … conseil4)
      • 100 propriétaires  (owner.apt001 … owner.apt100)
      • La copropriété "Résidence Ellyssa"
      • 100 appartements (apt-001 … apt-100)
      • Chaque propriétaire lié à son appartement
    Tous les mots de passe : 12345678

.EXAMPLE
    .\scripts\seed-ellyssa.ps1
    .\scripts\seed-ellyssa.ps1 -SkipKeycloak   # DB uniquement
    .\scripts\seed-ellyssa.ps1 -SkipDb         # Keycloak uniquement
    .\scripts\seed-ellyssa.ps1 -Reset          # Supprime et recrée tout
#>

param(
    [string]$KcUrl      = "http://localhost:8080",
    [string]$Realm      = "MYB",
    [string]$ClientName = "MYB-client",
    [string]$KcAdminUser = "admin",
    [string]$KcAdminPass = "admin",
    [string]$DbHost     = "localhost",
    [int]   $DbPort     = 5433,
    [string]$DbName     = "copropertyDB",
    [string]$DbUser     = "postgres",
    [string]$DbPass     = "postgres",
    [string]$Password   = "12345678",
    [switch]$SkipKeycloak,
    [switch]$SkipDb,
    [switch]$Reset
)

$ErrorActionPreference = "Stop"

# ── helpers ──────────────────────────────────────────────────────────────────
function Step($msg)    { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function OK($msg)      { Write-Host "  OK  $msg" -ForegroundColor Green }
function SKIP($msg)    { Write-Host "  --  $msg" -ForegroundColor DarkGray }
function WARN($msg)    { Write-Host "  !!  $msg" -ForegroundColor Yellow }
function FAIL($msg)    { Write-Host "  FAIL $msg" -ForegroundColor Red; exit 1 }

function Invoke-Kc($method, $path, $body = $null) {
    $uri = "$KcUrl$path"
    $h   = @{ Authorization = "Bearer $script:token"; "Content-Type" = "application/json" }
    $params = @{ Method = $method; Uri = $uri; Headers = $h; UseBasicParsing = $true }
    if ($null -ne $body) {
        # Force array serialization when body is an array
        if ($body -is [array]) {
            $params.Body = ConvertTo-Json -InputObject @($body) -Depth 10 -Compress
        } else {
            $params.Body = $body | ConvertTo-Json -Depth 10 -Compress
        }
    }
    try {
        $r = Invoke-WebRequest @params
        if ($r.Content) { return $r.Content | ConvertFrom-Json }
        return $null
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        if ($code -eq 409) { return "CONFLICT" }   # already exists
        if ($code -eq 404) { return $null }
        throw
    }
}

function psql($sql) {
    $tmp = [System.IO.Path]::GetTempFileName() + ".sql"
    [System.IO.File]::WriteAllText($tmp, $sql, [System.Text.Encoding]::UTF8)
    # copy into container and run
    docker cp $tmp "myb-copropertyDB-1:/tmp/seed_query.sql" | Out-Null
    $out = docker exec myb-copropertyDB-1 psql -U $DbUser -d $DbName -t -f /tmp/seed_query.sql 2>&1
    Remove-Item $tmp -ErrorAction SilentlyContinue
    $outStr = ($out | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -and $outStr -match "ERROR") { throw $outStr }
    return $outStr
}

# ═════════════════════════════════════════════════════════════════════════════
#  RESET
# ═════════════════════════════════════════════════════════════════════════════
if ($Reset) {
    Step "Reset — suppression des données Ellyssa"

    # DB
    psql "DELETE FROM ""OwnerUnits"" WHERE ""UnitId"" IN (SELECT ""Id"" FROM ""Units"" u JOIN ""Coproperties"" c ON u.""CopropertyId"" = c.""Id"" WHERE c.""Name"" = 'Résidence Ellyssa');" | Out-Null
    psql "DELETE FROM ""Owners"" WHERE ""Email"" LIKE '%@ellyssa.test';" | Out-Null
    psql "DELETE FROM ""Units"" WHERE ""CopropertyId"" IN (SELECT ""Id"" FROM ""Coproperties"" WHERE ""Name"" = 'Résidence Ellyssa');" | Out-Null
    psql "DELETE FROM ""Coproperties"" WHERE ""Name"" = 'Résidence Ellyssa';" | Out-Null
    OK "DB nettoyée"

    # Keycloak — on récupère le token d'abord
    $tokenResp = Invoke-WebRequest -Method POST -UseBasicParsing `
        -Uri "$KcUrl/realms/master/protocol/openid-connect/token" `
        -Body "client_id=admin-cli&username=$KcAdminUser&password=$KcAdminPass&grant_type=password" `
        -ContentType "application/x-www-form-urlencoded"
    $script:token = ($tokenResp.Content | ConvertFrom-Json).access_token

    $allUsers = Invoke-Kc GET "/admin/realms/$Realm/users?max=200"
    $toDelete = $allUsers | Where-Object { $_.email -like "*@ellyssa.test" }
    foreach ($u in $toDelete) {
        Invoke-Kc DELETE "/admin/realms/$Realm/users/$($u.id)" | Out-Null
    }
    OK "Keycloak nettoyé ($($toDelete.Count) users supprimés)"
    Write-Host "`nReset terminé. Relancez sans -Reset pour recréer.`n" -ForegroundColor Cyan
    exit 0
}

# ═════════════════════════════════════════════════════════════════════════════
#  KEYCLOAK
# ═════════════════════════════════════════════════════════════════════════════
$kcUserIds = @{}   # username -> KC uuid

if (-not $SkipKeycloak) {
    Step "Keycloak — obtention du token admin"
    $tokenResp = Invoke-WebRequest -Method POST -UseBasicParsing `
        -Uri "$KcUrl/realms/master/protocol/openid-connect/token" `
        -Body "client_id=admin-cli&username=$KcAdminUser&password=$KcAdminPass&grant_type=password" `
        -ContentType "application/x-www-form-urlencoded"
    $script:token = ($tokenResp.Content | ConvertFrom-Json).access_token
    if (-not $script:token) { FAIL "Impossible d'obtenir le token Keycloak" }
    OK "Token obtenu"

    # Récupérer UUID du client MYB-client
    Step "Keycloak — récupération du client $ClientName"
    $clients = Invoke-Kc GET "/admin/realms/$Realm/clients?clientId=$ClientName"
    if (-not $clients -or $clients.Count -eq 0) { FAIL "Client $ClientName introuvable dans le realm $Realm" }
    $clientUuid = $clients[0].id
    OK "Client UUID : $clientUuid"

    # Récupérer les rôles nécessaires
    $roleSyndic  = Invoke-Kc GET "/admin/realms/$Realm/clients/$clientUuid/roles/coproperty-syndic"
    $roleCouncil = Invoke-Kc GET "/admin/realms/$Realm/clients/$clientUuid/roles/coproperty-council"
    $roleOwner   = Invoke-Kc GET "/admin/realms/$Realm/clients/$clientUuid/roles/coproperty-owner"
    if (-not $roleSyndic)  { FAIL "Rôle coproperty-syndic introuvable — lancez d'abord keycloak-setup-roles-users.sh" }
    if (-not $roleCouncil) { FAIL "Rôle coproperty-council introuvable" }
    if (-not $roleOwner)   { FAIL "Rôle coproperty-owner introuvable" }
    OK "Rôles trouvés"

    function New-KcUser($username, $firstName, $lastName, $role) {
        $email = "$username@ellyssa.test"
        # Vérifier existence
        $existing = Invoke-Kc GET "/admin/realms/$Realm/users?username=$([uri]::EscapeDataString($username))&exact=true"
        if ($existing -and $existing.Count -gt 0) {
            $uid = $existing[0].id
            SKIP "$username déjà existant ($uid)"
        } else {
            Invoke-Kc POST "/admin/realms/$Realm/users" @{
                username      = $username
                email         = $email
                firstName     = $firstName
                lastName      = $lastName
                enabled       = $true
                emailVerified = $true
                credentials   = @(@{ type = "password"; value = $Password; temporary = $false })
            } | Out-Null
            # Attendre que KC indexe l'utilisateur
            Start-Sleep -Milliseconds 300
            $created = Invoke-Kc GET "/admin/realms/$Realm/users?username=$([uri]::EscapeDataString($username))&exact=true"
            if (-not $created -or $created.Count -eq 0) {
                # fallback: chercher par email
                $created = Invoke-Kc GET "/admin/realms/$Realm/users?email=$([uri]::EscapeDataString($email))&exact=true"
            }
            if (-not $created -or $created.Count -eq 0) { FAIL "Impossible de retrouver $username après création" }
            $uid = $created[0].id
            OK "$username créé ($uid)"
        }
        # Assigner le rôle
        Invoke-Kc POST "/admin/realms/$Realm/users/$uid/role-mappings/clients/$clientUuid" @($role) | Out-Null
        return $uid
    }

    # ── Syndic bénévole ──────────────────────────────────────────────────────
    Step "Keycloak — syndic bénévole"
    $uid = New-KcUser "syndic.ellyssa" "Karim" "Ben Salah" $roleSyndic
    $kcUserIds["syndic.ellyssa"] = $uid

    # ── 4 membres du conseil ─────────────────────────────────────────────────
    Step "Keycloak — membres du conseil syndical (4)"
    $conseillers = @(
        @{ u="conseil1.ellyssa"; fn="Leila";   ln="Trabelsi" },
        @{ u="conseil2.ellyssa"; fn="Mehdi";   ln="Chaabane" },
        @{ u="conseil3.ellyssa"; fn="Sonia";   ln="Ayari"    },
        @{ u="conseil4.ellyssa"; fn="Yassine"; ln="Miled"    }
    )
    foreach ($c in $conseillers) {
        $uid = New-KcUser $c.u $c.fn $c.ln $roleCouncil
        $kcUserIds[$c.u] = $uid
    }

    # ── 100 propriétaires ────────────────────────────────────────────────────
    Step "Keycloak — 100 propriétaires (owner.apt001 … owner.apt100)"
    $firstNames = @("Ahmed","Mohamed","Fatima","Hana","Sami","Rania","Tarek","Nadia","Bilel","Salma",
                    "Amine","Yasmine","Khaled","Sara","Walid","Mariem","Adel","Ines","Fares","Asma",
                    "Hatem","Nesrine","Lotfi","Olfa","Farid","Houda","Slim","Dorra","Nizar","Wiem")
    $lastNames  = @("Ben Ali","Trabelsi","Chaabane","Miled","Ayari","Gharbi","Jebali","Mansouri","Karray","Ferjani",
                    "Bouaziz","Hamdi","Sassi","Dridi","Toumi","Amamou","Riahi","Zouari","Labidi","Belhaj")

    for ($i = 1; $i -le 100; $i++) {
        $num      = "{0:D3}" -f $i
        $username = "owner.apt$num"
        $fn       = $firstNames[($i - 1) % $firstNames.Count]
        $ln       = $lastNames[($i - 1) % $lastNames.Count]
        $uid      = New-KcUser $username $fn $ln $roleOwner
        $kcUserIds[$username] = $uid
    }

    OK "Keycloak : $($kcUserIds.Count) utilisateurs configurés"
}

# ═════════════════════════════════════════════════════════════════════════════
#  DATABASE
# ═════════════════════════════════════════════════════════════════════════════
if (-not $SkipDb) {
    Step "DB — création de la copropriété Résidence Ellyssa"

    # Vérifier si elle existe déjà
    $existingId = psql "SELECT ""Id"" FROM ""Coproperties"" WHERE ""Name"" = 'Résidence Ellyssa' LIMIT 1;"
    if ($existingId) {
        $coproId = $existingId.Trim()
        SKIP "Copropriété déjà existante ($coproId)"
    } else {
        $coproId = [System.Guid]::NewGuid().ToString()

        # Récupérer l'UUID Keycloak du syndic pour ManagerId
        $managerKcId = $kcUserIds["syndic.ellyssa"]
        if (-not $managerKcId -and -not $SkipKeycloak) { WARN "ManagerId syndic non trouvé, ManagerId sera NULL" }

        $managerIdSql = if ($managerKcId) { "'$managerKcId'" } else { "NULL" }

        psql @"
INSERT INTO "Coproperties" (
    "Id","Name","Address","City","PostalCode","Country",
    "Description","TotalUnits","TotalShares","CommonAreas",
    "CreatedAt","UpdatedAt","IsActive","ManagerId","ManagerName","Currency","IsDeleted"
) VALUES (
    '$coproId',
    'Résidence Ellyssa',
    'Jardin de Carthage',
    'Tunis',
    '1082',
    'Tunisie',
    'Résidence Ellyssa — 100 appartements, Jardin de Carthage, Tunis. Syndic bénévole.',
    100,
    10000,
    'Hall d''entrée, Parking, Ascenseur x2, Jardin, Local poubelles',
    NOW(), NOW(),
    true,
    $managerIdSql,
    'Karim Ben Salah',
    'TND',
    false
);
"@ | Out-Null
        OK "Copropriété créée ($coproId)"
    }

    # ── 100 appartements ─────────────────────────────────────────────────────
    Step "DB — 100 appartements"
    $existing = psql "SELECT COUNT(*) FROM ""Units"" WHERE ""CopropertyId"" = '$coproId';"
    $existingCount = [int](($existing | Out-String) -replace '\D','')

    if ($existingCount -ge 100) {
        SKIP "$existingCount appartements déjà créés"
    } else {
        $unitIds = @{}
        $valRows = @()
        for ($i = 1; $i -le 100; $i++) {
            $unitId  = [System.Guid]::NewGuid().ToString()
            $num     = "{0:D3}" -f $i
            $floor   = [Math]::Ceiling($i / 4)   # 4 appts par étage, 25 étages
            $area    = 65 + (($i - 1) % 6) * 10  # entre 65 et 115 m²
            $shares  = 100                         # millièmes égaux
            $unitIds["apt-$num"] = $unitId
            $valRows += "('$unitId','$coproId','apt-$num',$floor,$area,$shares,'Appartement','Appartement T3',false,NOW(),NOW(),'Vacant',false)"
        }
        $sql = "INSERT INTO ""Units"" (""Id"",""CopropertyId"",""UnitNumber"",""Floor"",""Area"",""Shares"",""UnitType"",""Description"",""IsOccupied"",""CreatedAt"",""UpdatedAt"",""OccupancyStatus"",""IsDeleted"") VALUES " + ($valRows -join ",") + ";"
        psql $sql | Out-Null
        OK "100 appartements créés"

        # ── Propriétaires ────────────────────────────────────────────────────
        Step "DB — 100 propriétaires + liaison OwnerUnits"
        $firstNames = @("Ahmed","Mohamed","Fatima","Hana","Sami","Rania","Tarek","Nadia","Bilel","Salma",
                        "Amine","Yasmine","Khaled","Sara","Walid","Mariem","Adel","Ines","Fares","Asma",
                        "Hatem","Nesrine","Lotfi","Olfa","Farid","Houda","Slim","Dorra","Nizar","Wiem")
        $lastNames  = @("Ben Ali","Trabelsi","Chaabane","Miled","Ayari","Gharbi","Jebali","Mansouri","Karray","Ferjani",
                        "Bouaziz","Hamdi","Sassi","Dridi","Toumi","Amamou","Riahi","Zouari","Labidi","Belhaj")

        $ownerRows   = @()
        $ouRows      = @()

        for ($i = 1; $i -le 100; $i++) {
            $num      = "{0:D3}" -f $i
            $username = "owner.apt$num"
            $unitKey  = "apt-$num"
            $unitId   = $unitIds[$unitKey]
            $ownerId  = [System.Guid]::NewGuid().ToString()
            $ouId     = [System.Guid]::NewGuid().ToString()
            $fn       = $firstNames[($i - 1) % $firstNames.Count]
            $ln       = $lastNames[($i - 1) % $lastNames.Count]
            $email    = "$username@ellyssa.test"
            $phone    = "+216 9" + ("{0:D7}" -f (1000000 + $i))

            # UserId = UUID Keycloak si disponible, sinon UUID déterministe
            $kcId = $kcUserIds[$username]
            if (-not $kcId) { $kcId = [System.Guid]::NewGuid().ToString() }

            $ownerRows += "('$ownerId','$kcId','$unitId',100.00,NOW(),NULL,true,NOW(),'$email','$fn','$ln','$phone',NOW(),false)"
            $ouRows    += "('$ouId','$ownerId','$unitId',100.00,NOW(),NULL,true)"
        }

        $sqlOwners = "INSERT INTO ""Owners"" (""Id"",""UserId"",""UnitId"",""OwnershipPercentage"",""StartDate"",""EndDate"",""IsMainOwner"",""CreatedAt"",""Email"",""FirstName"",""LastName"",""Phone"",""UpdatedAt"",""IsDeleted"") VALUES " + ($ownerRows -join ",") + ";"
        psql $sqlOwners | Out-Null
        OK "100 propriétaires créés"

        $sqlOU = "INSERT INTO ""OwnerUnits"" (""Id"",""OwnerId"",""UnitId"",""OwnershipPercentage"",""StartDate"",""EndDate"",""IsMainOwner"") VALUES " + ($ouRows -join ",") + ";"
        psql $sqlOU | Out-Null
        OK "100 liaisons OwnerUnits créées"

        # Marquer les appartements comme occupés
        psql "UPDATE ""Units"" SET ""IsOccupied""=true, ""OccupancyStatus""='Occupied' WHERE ""CopropertyId""='$coproId';" | Out-Null
        OK "Appartements marqués Occupied"
    }
}

# ═════════════════════════════════════════════════════════════════════════════
#  RÉSUMÉ
# ═════════════════════════════════════════════════════════════════════════════
Write-Host ""
Write-Host ("=" * 65) -ForegroundColor Cyan
Write-Host "  SEED ELLYSSA TERMINÉ" -ForegroundColor Green
Write-Host ("=" * 65) -ForegroundColor Cyan
Write-Host ""
Write-Host "  Copropriété : Résidence Ellyssa, Jardin de Carthage, Tunis"
Write-Host "  Appartements : 100 (apt-001 … apt-100)"
Write-Host "  Mot de passe universel : 12345678"
Write-Host ""
Write-Host "  ┌──────────────────────────┬────────────────────────────────┐"
Write-Host "  │ Username                 │ Rôle                           │"
Write-Host "  ├──────────────────────────┼────────────────────────────────┤"
Write-Host "  │ syndic.ellyssa           │ Syndic bénévole                │"
Write-Host "  │ conseil1.ellyssa         │ Membre conseil syndical        │"
Write-Host "  │ conseil2.ellyssa         │ Membre conseil syndical        │"
Write-Host "  │ conseil3.ellyssa         │ Membre conseil syndical        │"
Write-Host "  │ conseil4.ellyssa         │ Membre conseil syndical        │"
Write-Host "  │ owner.apt001 … apt100    │ Propriétaire (100 comptes)     │"
Write-Host "  └──────────────────────────┴────────────────────────────────┘"
Write-Host ""
Write-Host "  URL : http://localhost:4300" -ForegroundColor Yellow
Write-Host ""
