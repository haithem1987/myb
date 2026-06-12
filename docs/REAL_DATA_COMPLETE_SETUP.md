# Real Data Setup — Complete Setup Guide

## 📋 Prerequisites Check

Before running the setup, ensure you have:

```bash
# 1. Check Docker is running
docker ps

# 2. Check docker-compose is available
docker compose --version

# 3. Verify Keycloak and PostgreSQL services exist
cat docker-compose.dev.yml | grep -E "keycloak|postgresql" | head -5
```

---

## 🚀 Complete Setup (Step by Step)

### Step 1: Start Required Services

```bash
# Start Keycloak and PostgreSQL
docker compose -f docker-compose.dev.yml up -d keycloak postgresql

# Wait for services to be ready (30-60 seconds)
echo "Waiting for services..."
sleep 30

# Verify services are running
docker compose -f docker-compose.dev.yml ps | grep -E "keycloak|postgresql"
```

Expected output:
```
keycloak      │ running
postgresql    │ running
```

### Step 2: Run Real Data Setup

```bash
# Full setup (Keycloak users + Database)
./scripts/setup-real-data.sh
```

Or in stages:

```bash
# Only Keycloak users (no database)
./scripts/setup-real-data.sh keycloak-only

# Wait a moment, then database
sleep 10
./scripts/setup-real-data.sh db-only
```

### Step 3: Start the Application

```bash
# Start frontend (locally) + backend (in Docker)
./scripts/dev-local-frontend.sh client
```

### Step 4: Test Login

Open browser: **http://localhost:4200**

Login with:
- **Username:** admin
- **Password:** admin123

---

## 🐛 Troubleshooting

### Problem: "Failed to get admin token"

**Cause:** Keycloak not running or not ready

```bash
# Solution 1: Wait longer
sleep 60
./scripts/setup-real-data.sh keycloak-only

# Solution 2: Check Keycloak logs
docker compose -f docker-compose.dev.yml logs keycloak | tail -20

# Solution 3: Restart Keycloak
docker compose -f docker-compose.dev.yml restart keycloak
sleep 30
./scripts/setup-real-data.sh
```

### Problem: "Cannot connect to database"

**Cause:** PostgreSQL not running

```bash
# Solution 1: Start database
docker compose -f docker-compose.dev.yml up -d postgresql
sleep 30

# Solution 2: Check database status
docker compose -f docker-compose.dev.yml ps postgresql
docker compose -f docker-compose.dev.yml logs postgresql | tail -20

# Solution 3: Database migration issue?
# Check if coproperty database exists and has tables
docker compose -f docker-compose.dev.yml exec postgresql psql -U postgres -l | grep coproperty
```

### Problem: "psql: command not found"

**Cause:** PostgreSQL client not installed

```bash
# Install PostgreSQL client
brew install postgresql

# Then run setup again
./scripts/setup-real-data.sh db-only
```

### Problem: Tables don't exist

**Cause:** Database migrations haven't run

```bash
# The database schema should exist. Check:
docker compose -f docker-compose.dev.yml exec postgresql psql -U postgres -d copropertyDB -c "\dt"

# If tables are missing, ensure the database was initialized properly
# Try running setup again after restart
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d postgresql keycloak
sleep 30
./scripts/setup-real-data.sh
```

---

## 📊 What Gets Created

### Keycloak Users (11 total)

After running setup, you have:

| Category | Users | Test Passwords |
|----------|-------|-----------------|
| Admins | admin, nidhal.admin | admin123, nidhal123 |
| Employees | employee1, employee2 | emp123 |
| Managers | manager1, manager2 | mgr123 |
| Project Lead | project_lead | proj123 |
| Owners | owner1-4 | owner123 |

### Database Data

- **4 Coproperties** (Tunis, Ariana, Carthage, Sousse)
- **36 Units** (Apartments, Villas, Penthouses)
- **8 Property Owners**
- **4 Budgets** for 2026
- **11 Charges** (Maintenance + Special works)

---

## ✅ Verification Checklist

After running setup:

```bash
# Check Keycloak users were created
curl -s http://localhost:8080/admin/realms/MYB/users \
  -H "Authorization: Bearer $(curl -s -X POST http://localhost:8080/realms/master/protocol/openid-connect/token \
  -d 'client_id=admin-cli&username=admin&password=admin&grant_type=password' | python3 -c 'import sys,json; print(json.load(sys.stdin)["access_token"])')" | python3 -m json.tool | head -30

# Check database has data
psql -h localhost -p 5433 -U postgres -d copropertyDB -c "SELECT COUNT(*) FROM \"Coproperties\""
psql -h localhost -p 5433 -U postgres -d copropertyDB -c "SELECT COUNT(*) FROM \"Units\""
psql -h localhost -p 5433 -U postgres -d copropertyDB -c "SELECT COUNT(*) FROM \"Owners\""
```

Expected output:
```
COUNT: 4        (4 coproperties)
COUNT: 36       (36 units)
COUNT: 8        (8 owners)
```

---

## 🔄 Running Multiple Times

**It's safe to run the setup multiple times!**

The script checks for existing data and won't duplicate:

```bash
# Run again anytime
./scripts/setup-real-data.sh

# Or just update one part
./scripts/setup-real-data.sh keycloak-only
./scripts/setup-real-data.sh db-only
```

---

## 💡 Advanced Usage

### Only Create Keycloak Users

```bash
./scripts/setup-real-data.sh keycloak-only
```

### Only Create Database Data

```bash
./scripts/setup-real-data.sh db-only
```

### Environment Variables

Customize database connection:

```bash
export PGHOST=localhost
export PGPORT=5433
export PGUSER=postgres
export PGPASSWORD=postgres
export PGDATABASE=copropertyDB
./scripts/setup-real-data.sh
```

Or customize Keycloak:

```bash
export KC_URL=http://localhost:8080
export KEYCLOAK_ADMIN_USER=admin
export KEYCLOAK_ADMIN_PASSWORD=admin
./scripts/setup-real-data.sh
```

---

## 📚 Related Scripts

```bash
# Setup Keycloak initial roles and users (run first if needed)
./scripts/keycloak-setup-roles-users.sh

# Generate fake data on OVH database
./scripts/generate-fake-data-ovh.sh

# Start development environment
./scripts/dev-local-frontend.sh client

# Stop all services
./scripts/dev-stop.sh
```

---

## 🎯 Next Steps After Setup

1. **Login to the app:** http://localhost:4200
2. **Test as different users:**
   - Admin: full access
   - Owner: limited to own properties
   - Employee: role-based features
3. **Explore features:**
   - View coproperties
   - Check budgets
   - View charges
   - Test workflows

---

## ⏱️ Typical Timeline

| Step | Time |
|------|------|
| Start services | 30-60s |
| Keycloak setup | 20-30s |
| Database setup | 5-10s |
| **Total** | **1-2 minutes** |

---

## 📞 Need Help?

Check logs:
```bash
# Keycloak
docker compose -f docker-compose.dev.yml logs keycloak

# PostgreSQL
docker compose -f docker-compose.dev.yml logs postgresql

# Application
./scripts/dev-local-frontend.sh client
# (Look for errors in terminal)
```

Generated SQL file for manual inspection:
```bash
# Find and inspect the SQL
ls -lh /tmp/myb_real_data_*.sql
cat /tmp/myb_real_data_*.sql | less
```
