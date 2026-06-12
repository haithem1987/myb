# Real Data Setup Guide

## 📋 Overview

Generate realistic test data with real Keycloak users and their roles, plus comprehensive coproperty/unit database data.

### What Gets Created:

**Keycloak Users (with roles):**
- 2 System Admins (coproperty-admin)
- 2 Employees (MYB_EMPLOYEE)
- 2 Managers (MYB_MANAGER)
- 1 Project Lead (MYB_PROJECT_RW)
- 4 Property Owners (coproperty-owner)

**Database Data:**
- 4 Coproperties (Tunis, Ariana, Carthage, Sousse)
- 36 Units (Apartments, Villas, Penthouses)
- 8 Property Owners
- 4 Budgets for 2026
- 11 Charges (Maintenance + Special Works)

---

## 🚀 Quick Start

### Prerequisites

1. **Keycloak Running**
   ```bash
   ./scripts/dev-local-frontend.sh client
   # or
   docker compose -f docker-compose.dev.yml up -d keycloak
   ```

2. **Database Running**
   ```bash
   docker compose -f docker-compose.dev.yml up -d postgresql
   ```

3. **Credentials (if database needs auth)**
   ```bash
   export PGHOST=localhost
   export PGPORT=5433
   export PGUSER=postgres
   export PGPASSWORD=postgres
   export PGDATABASE=copropertyDB
   ```

### Run Setup

```bash
# Full setup (both Keycloak + Database)
./scripts/setup-real-data.sh

# Only create Keycloak users
./scripts/setup-real-data.sh keycloak-only

# Only create database data
./scripts/setup-real-data.sh db-only
```

---

## 📝 Test Accounts Created

### Admins
| Username | Password | Email | Role |
|----------|----------|-------|------|
| admin | admin123 | admin@myb.com | coproperty-admin |
| nidhal.admin | nidhal123 | nidhal.admin@myb.com | coproperty-admin |

### Employees
| Username | Password | Email | Role |
|----------|----------|-------|------|
| employee1 | emp123 | employee1@myb.com | MYB_EMPLOYEE |
| employee2 | emp123 | employee2@myb.com | MYB_EMPLOYEE |

### Managers
| Username | Password | Email | Role |
|----------|----------|-------|------|
| manager1 | mgr123 | manager1@myb.com | MYB_MANAGER |
| manager2 | mgr123 | manager2@myb.com | MYB_MANAGER |

### Project Lead
| Username | Password | Email | Role |
|----------|----------|-------|------|
| project_lead | proj123 | project@myb.com | MYB_PROJECT_RW |

### Property Owners
| Username | Password | Email | Role |
|----------|----------|-------|------|
| owner1 | owner123 | owner1@example.com | coproperty-owner |
| owner2 | owner123 | owner2@example.com | coproperty-owner |
| owner3 | owner123 | owner3@example.com | coproperty-owner |
| owner4 | owner123 | owner4@example.com | coproperty-owner |

---

## 🏢 Coproperties Created

### 1. Résidence Les Jardins (Tunis)
- **Address:** 45 Avenue Habib Bourguiba, Tunis 1000
- **Units:** 12 apartments + penthouses
- **Budget 2026:** 145,000 TND
- **Charges:** Maintenance, Façade Works, Roof

### 2. Villa Minerve Premium (Ariana)
- **Address:** 78 Rue de la Paix, Ariana 2080
- **Units:** 8 villas
- **Budget 2026:** 98,000 TND
- **Charges:** Utilities, Pool Maintenance, Security

### 3. Immeuble Carthage Elite (Carthage)
- **Address:** 12 Boulevard El Amir, Carthage 2070
- **Units:** 10 apartments + penthouses
- **Budget 2026:** 210,000 TND
- **Charges:** Common Areas, Elevator Renovation, Roof Waterproofing

### 4. Complexe Résidentiel Sousse (Sousse)
- **Address:** 33 Avenue de la Plage, Sousse 4000
- **Units:** 6 apartments
- **Budget 2026:** 75,000 TND
- **Charges:** Common Utilities, Green Spaces

---

## 🔄 Typical Workflow After Setup

```bash
# 1. Start development environment
./scripts/dev-local-frontend.sh client

# 2. Login at http://localhost:4200
# Use one of the test accounts above

# 3. View data
# - Admin: See all coproperties, units, users, charges
# - Owner: See only their own properties
# - Employee: See systems based on role

# 4. Test functionality
# - Create maintenance requests
# - View budgets and charges
# - Submit payments
# - View documents
```

---

## 🧪 Testing Different Roles

### As Admin (Full Access)
```
Username: admin
Password: admin123
Expected: Can manage all coproperties, users, budgets
```

### As Property Owner
```
Username: owner1
Password: owner123
Expected: Can view only their own property (Résidence Les Jardins - Unit A01)
```

### As Employee
```
Username: employee1
Password: emp123
Expected: Can see employee-specific features
```

### As Manager
```
Username: manager1
Password: mgr123
Expected: Can access management functions
```

---

## 🔧 Environment Variables

Configure these if needed (defaults work for local dev):

```bash
# Keycloak
KC_URL=http://localhost:8080              # Keycloak URL
KEYCLOAK_ADMIN_USER=admin                 # Admin username
KEYCLOAK_ADMIN_PASSWORD=admin             # Admin password

# Database
PGHOST=localhost                          # PostgreSQL host
PGPORT=5433                               # PostgreSQL port
PGUSER=postgres                           # DB user
PGPASSWORD=postgres                       # DB password
PGDATABASE=copropertyDB                   # Database name
```

---

## 📊 Data Summary

| Type | Count | Details |
|------|-------|---------|
| Coproperties | 4 | Real Tunisian locations |
| Units | 36 | Apartments, Villas, Penthouses |
| Owners | 8 | Linked to Keycloak users |
| Keycloak Users | 11 | With 5 different roles |
| Budgets | 4 | For 2026 |
| Charges | 11 | Maintenance + Special works |

---

## 🐛 Troubleshooting

### Error: "Failed to get admin token"
**Cause:** Keycloak not running or wrong credentials
```bash
# Check if Keycloak is running
docker compose -f docker-compose.dev.yml ps keycloak

# Restart if needed
docker compose -f docker-compose.dev.yml up -d keycloak
```

### Error: "Database connection refused"
**Cause:** PostgreSQL not running or wrong credentials
```bash
# Check if database is running
docker compose -f docker-compose.dev.yml ps postgresql

# Restart if needed
docker compose -f docker-compose.dev.yml up -d postgresql
```

### Error: "role X already exists"
**Not an error!** The script handles existing data gracefully. Safe to run multiple times.

### Error: "Client 'MYB-client' not found"
**Cause:** Need to run Keycloak setup first
```bash
# Run keycloak-setup-roles-users.sh first
./scripts/keycloak-setup-roles-users.sh

# Then run real data setup
./scripts/setup-real-data.sh
```

---

## 🗄️ Database Schema Used

The script populates:
- `Coproperties` - Main property buildings
- `Owners` - Property owners (linked to Keycloak users)
- `Units` - Individual apartments/villas
- `OwnerUnits` - Unit ownership relationships
- `Budgets` - Annual budgets per coproperty
- `Charges` - Maintenance and special charges

---

## 📝 Next Steps

1. **Run the script:**
   ```bash
   ./scripts/setup-real-data.sh
   ```

2. **Start the app:**
   ```bash
   ./scripts/dev-local-frontend.sh client
   ```

3. **Login with test account:**
   - Go to http://localhost:4200
   - Use `admin` / `admin123`

4. **Explore features:**
   - View coproperties
   - Check budgets and charges
   - Test role-based access
   - Submit payments as owner

---

## 💡 Tips

- **Safe to run multiple times:** The script checks for existing data and won't duplicate
- **All passwords are in plaintext:** This is test data only, NEVER use in production
- **Data is realistic:** Uses real Tunisian addresses and property types
- **Keycloak integration:** Users created in Keycloak can log in to the application immediately

---

## 📚 Related Documentation

- **Keycloak Setup:** `docs/KEYCLOAK_CONFIGURATION.md`
- **User Mapping:** `docs/KEYCLOAK_USER_MAPPING.md`
- **Development Guide:** `docs/DEV_QUICKSTART.md`
