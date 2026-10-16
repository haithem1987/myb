# /local-dev — Start & debug myb locally

Use this skill whenever the user asks to start, run or debug the myb project locally, or when diagnosing local dev environment issues.

## Known pitfalls (from hard experience)

### 1. npm install — always use --legacy-peer-deps
```
ngx-stripe@17.2.0 requires @stripe/stripe-js <4.0.0 but the project has ^4.6.0
```
**Fix:** Always run `npm install --legacy-peer-deps` in `src/front/myb.front/`.

### 2. Node.js version warnings
Angular 17 requires Node >=20.9.0. The machine may have v20.8.0 → produces engine warnings but doesn't block the build.

### 3. Port 4200 is taken by the nginx docker container
The local docker stack (`docker-compose.local.yml`) serves the built admin app on port 4200 via nginx.
**Fix:** Use port 4300 for the Angular dev server:
```powershell
cd src/front/myb.front
npx nx serve admin --port 4300
```

### 4. Keycloak redirect_uri mismatch for dev port
Keycloak's MYB-client only allows redirects to `localhost:4200` and `localhost:4201` by default.
**Fix:** Add port 4300 via the Keycloak admin REST API:
```powershell
$token = (Invoke-RestMethod -Uri "http://localhost:8080/realms/master/protocol/openid-connect/token" `
  -Method POST -ContentType "application/x-www-form-urlencoded" `
  -Body "username=admin&password=admin&grant_type=password&client_id=admin-cli").access_token

$clients = Invoke-RestMethod -Uri "http://localhost:8080/admin/realms/MYB/clients" `
  -Headers @{Authorization="Bearer $token"}
$c = $clients | Where-Object { $_.clientId -eq "MYB-client" }
$c.redirectUris += "http://localhost:4300/*"
$c.webOrigins  += "http://localhost:4300"
Invoke-RestMethod -Uri "http://localhost:8080/admin/realms/MYB/clients/$($c.id)" `
  -Method PUT -Headers @{Authorization="Bearer $token"; "Content-Type"="application/json"} `
  -Body ($c | ConvertTo-Json -Depth 10)
```

### 5. Always start Keycloak from the MAIN REPO docker-compose, never the worktree
Running docker-compose from a worktree creates conflicts with existing container names (e.g. `mailhog`).
```powershell
# From C:\DEV\REPOS\myb (the main checkout):
docker-compose -f docker-compose.yml up keycloak keycloak-db -d
```

### 6. ToastService API
`ToastService` has `show()`, `showSuccess()`, `showError()`, `showInfo()` and `remove()`.
The convenience methods (`showSuccess`, `showError`, `showInfo`) were added — always use them.

---

## Full local dev startup sequence

```powershell
# 1. Start PostgreSQL for payment service (if not already running)
docker run -d --name myb-payment-pg -e POSTGRES_PASSWORD=payment-pwd -e POSTGRES_DB=paymentDB -p 5432:5432 postgres:16.2

# 2. Start Keycloak (from MAIN REPO directory)
docker-compose -f C:\DEV\REPOS\myb\docker-compose.yml up keycloak keycloak-db -d

# 3. Start the payment service (applies migrations automatically)
cd src/services/payment-service/Myb.Payment
dotnet run

# 4. Install frontend deps (once)
cd src/front/myb.front
npm install --legacy-peer-deps

# 5. Start Angular dev server on port 4300 (4200 is taken by nginx docker)
npx nx serve admin --port 4300

# 6. If this is the first run on a new port, add redirect URI to Keycloak (see §4 above)

# 7. Open http://localhost:4300 and log in
```

## Validating API endpoints without login

All payment endpoints require Keycloak JWT. To verify an endpoint is reachable:
```powershell
# 401 = endpoint exists, auth is wired correctly
Invoke-WebRequest -Uri http://localhost:5000/api/bank-statements/import -Method POST
```

## Test OFX file for bank reconciliation

A test OFX file lives at `C:\Users\haith\AppData\Local\Temp\test-bank-statement.ofx` (re-create if needed from the bank-reconciliation session).
