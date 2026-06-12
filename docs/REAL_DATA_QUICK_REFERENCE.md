# Real Data Setup Quick Reference

## ⚡ TL;DR (30 seconds)

```bash
# Make sure services are running
docker compose -f docker-compose.dev.yml up -d keycloak postgresql

# Create real test data
./scripts/setup-real-data.sh

# Start the app
./scripts/dev-local-frontend.sh client

# Login at http://localhost:4200
# Admin:  admin / admin123
# Owner:  owner1 / owner123
```

## 🎯 What Gets Created

### Keycloak Users (11 total) with Roles:

**Admins (Full Access)**
- `admin` / `admin123` — System administrator
- `nidhal.admin` / `nidhal123` — Admin user

**Employees**
- `employee1` / `emp123` — MYB Employee
- `employee2` / `emp123` — MYB Employee

**Managers**
- `manager1` / `mgr123` — MYB Manager
- `manager2` / `mgr123` — MYB Manager

**Project Lead**
- `project_lead` / `proj123` — Project manager

**Property Owners**
- `owner1` / `owner123` — Owns Unit A01
- `owner2` / `owner123` — Owns Unit B12
- `owner3` / `owner123` — Owns Unit C21
- `owner4` / `owner123` — Owns Unit V01

### Database Data:

| Item | Count | Details |
|------|-------|---------|
| **Coproperties** | 4 | Tunis, Ariana, Carthage, Sousse |
| **Units** | 36 | Apartments, Villas, Penthouses |
| **Owners** | 8 | Linked to Keycloak users |
| **Budgets 2026** | 4 | 75K-210K TND each |
| **Charges** | 11 | Maintenance + Special works |

---

## 🚀 Setup Steps

### Step 1: Start Services
```bash
# Start Keycloak and Database
docker compose -f docker-compose.dev.yml up -d keycloak postgresql

# Wait ~30 seconds for startup
sleep 30
```

### Step 2: Setup Initial Keycloak (if needed)
```bash
# Only if this is first time
./scripts/keycloak-setup-roles-users.sh
```

### Step 3: Create Real Data
```bash
# This creates 11 test users + database data
./scripts/setup-real-data.sh
```

### Step 4: Start Application
```bash
# Frontend locally + backend in Docker
./scripts/dev-local-frontend.sh client
```

### Step 5: Test It
```
Browser: http://localhost:4200
Login as: admin / admin123
```

---

## 🔄 Running Options

```bash
# Full setup (Keycloak users + database data) — RECOMMENDED
./scripts/setup-real-data.sh

# Only create Keycloak users (no database changes)
./scripts/setup-real-data.sh keycloak-only

# Only populate database (no Keycloak changes)
./scripts/setup-real-data.sh db-only

# Run multiple times (safe, won't duplicate)
./scripts/setup-real-data.sh
```

---

## 🧪 Test Scenarios

### Scenario 1: Admin Full Access
```
Login: admin / admin123
See: All coproperties, all users, all budgets, all charges
Test: Create users, edit budgets, manage charges
```

### Scenario 2: Property Owner
```
Login: owner1 / owner123
See: Only their own property (Unit A01 in Résidence Les Jardins)
Test: View charges, submit payments, view documents
```

### Scenario 3: Employee
```
Login: employee1 / emp123
See: Employee dashboard and features
Test: Role-based access control
```

### Scenario 4: Manager
```
Login: manager1 / mgr123
See: Management dashboard
Test: Manage approvals, generate reports
```

---

## 📊 Real Property Data

### Résidence Les Jardins (Tunis)
- 12 Units: Apartments + Penthouse
- Budget: 145,000 TND
- Charges: Maintenance, Façade, Roof

### Villa Minerve Premium (Ariana)
- 8 Villas
- Budget: 98,000 TND
- Charges: Utilities, Pool, Security

### Immeuble Carthage Elite (Carthage)
- 10 Units: Apartments + Penthouses
- Budget: 210,000 TND
- Charges: Common Areas, Elevators, Waterproofing

### Complexe Résidentiel Sousse (Sousse)
- 6 Apartments
- Budget: 75,000 TND
- Charges: Utilities, Green Spaces

---

## 🐛 Quick Fixes

### Services Won't Start?
```bash
# Check what's running
docker compose -f docker-compose.dev.yml ps

# Restart specific service
docker compose -f docker-compose.dev.yml up -d keycloak

# Or full restart
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up -d
```

### Keycloak Login Fails?
```bash
# Wait a bit longer
sleep 30

# Check Keycloak logs
docker compose -f docker-compose.dev.yml logs -f keycloak

# Restart Keycloak
docker compose -f docker-compose.dev.yml restart keycloak
```

### Database Won't Connect?
```bash
# Check if PostgreSQL is running
docker compose -f docker-compose.dev.yml ps postgresql

# Check PostgreSQL logs
docker compose -f docker-compose.dev.yml logs -f postgresql
```

---

## 💡 Tips

✓ **Safe to run multiple times** — Script won't duplicate data  
✓ **All test passwords** — `123` suffix (admin123, emp123, etc.)  
✓ **Realistic data** — Real Tunisian addresses and property types  
✓ **Works offline** — No external API calls after first setup  
✓ **Quick to setup** — ~2 minutes total  

---

## 📚 Full Documentation

- **Full Guide:** [docs/REAL_DATA_SETUP.md](../docs/REAL_DATA_SETUP.md)
- **Keycloak Config:** [docs/KEYCLOAK_CONFIGURATION.md](../docs/KEYCLOAK_CONFIGURATION.md)
- **Development:** [docs/DEV_QUICKSTART.md](../docs/DEV_QUICKSTART.md)

---

## 🎮 Run Now

```bash
# One command to set everything up
./scripts/setup-real-data.sh

# Then start the app
./scripts/dev-local-frontend.sh client

# Open browser to http://localhost:4200
```

**Done! 🎉**
