#!/bin/bash

# MYB Coproperty Module - Nx Workspace Quick Start
# For running both Admin and Client applications

set -e

cat << 'EOF'
╔══════════════════════════════════════════════════════════════════════╗
║  MYB COPROPERTY - NX WORKSPACE QUICK START                           ║
║  Keycloak Authentication Integrated                                  ║
╚══════════════════════════════════════════════════════════════════════╝

📦 NX WORKSPACE STRUCTURE
========================

src/front/myb.front/
├── apps/
│   ├── admin/           # Admin interface (Port 4201)
│   │   └── Syndic, Council, Accountant, Admin interfaces
│   │
│   └── client/          # Client interface (Port 4200)
│       └── Owner portal, general access
│
└── libs/
    ├── coproperty-module/    # Shared coproperty module
    ├── auth/                 # Keycloak authentication
    └── shared-ui/            # Shared components

═══════════════════════════════════════════════════════════════════════

🚀 RUNNING THE APPLICATIONS
===========================

Option 1: Run Both Apps in Parallel
────────────────────────────────────
npx nx run-many --target=serve --projects=client,admin --parallel

Client app: http://localhost:4200
Admin app:  http://localhost:4201

Option 2: Run Apps in Separate Terminals
────────────────────────────────────────
Terminal 1 (Client):
  cd src/front/myb.front
  npx nx serve client

Terminal 2 (Admin):
  cd src/front/myb.front
  npx nx serve admin --port 4201

Option 3: Production Build
──────────────────────────
npx nx build client --prod
npx nx build admin --prod

Outputs:
  dist/apps/client/
  dist/apps/admin/

═══════════════════════════════════════════════════════════════════════

🔐 KEYCLOAK INTEGRATION
=======================

Keycloak Server: http://localhost:8080
Realm: MYB
Client ID: MYB-client

Realm Roles → Coproperty Roles Mapping:
├── coproperty-syndic     → CopropertyRole.SYNDIC
├── coproperty-owner      → CopropertyRole.OWNER
├── coproperty-council    → CopropertyRole.COUNCIL
├── coproperty-accountant → CopropertyRole.ACCOUNTANT
└── system-admin          → CopropertyRole.ADMIN

═══════════════════════════════════════════════════════════════════════

👥 USER SCENARIOS BY APP
========================

CLIENT APP (Port 4200) - Owner Portal
──────────────────────────────────────
Primary Users: Copropriétaires (Owners)

Routes:
✓ /coproperty/owner/dashboard
✓ /coproperty/owner/my-units
✓ /coproperty/owner/invoices
✓ /coproperty/owner/maintenance
✓ /coproperty/owner/documents
✓ /coproperty/owner/general-assembly

Test User (Keycloak):
  Email: owner@myb.local
  Role: coproperty-owner
  Access: Owner portal only

ADMIN APP (Port 4201) - Management Interfaces
──────────────────────────────────────────────
Primary Users: Syndic, Council, Accountant, Admin

Routes:
✓ /admin/coproperties/syndic/dashboard
✓ /admin/coproperties/syndic/coproperties
✓ /admin/coproperties/syndic/charges
✓ /admin/coproperties/syndic/invoices
✓ /admin/coproperties/council/dashboard
✓ /admin/coproperties/accountant/dashboard

Test Users (Keycloak):
  Syndic:
    Email: syndic@myb.local
    Role: coproperty-syndic
    Access: Full management
  
  Council:
    Email: council@myb.local
    Role: coproperty-council
    Access: Oversight & control
  
  Accountant:
    Email: accountant@myb.local
    Role: coproperty-accountant
    Access: Financial operations

═══════════════════════════════════════════════════════════════════════

🔧 DEVELOPMENT WORKFLOW
======================

1. Start Keycloak
   ──────────────
   docker-compose up keycloak
   
   Wait for: http://localhost:8080

2. Start Backend Services
   ──────────────────────
   docker-compose up userservice documentservice invoiceservice
   
   Verify GraphQL: http://localhost:5001/graphql

3. Start Frontend Apps
   ───────────────────
   # Option A: Both apps parallel
   npx nx run-many --target=serve --projects=client,admin --parallel
   
   # Option B: Individual apps
   npx nx serve client        # Port 4200
   npx nx serve admin --port 4201

4. Access Applications
   ───────────────────
   Client (Owner Portal):  http://localhost:4200
   Admin (Management):     http://localhost:4201
   Keycloak Admin:         http://localhost:8080

5. Login Flow
   ──────────
   → Navigate to app
   → Redirect to Keycloak login
   → Enter credentials
   → Redirect back with token
   → AuthRoleService.initializeFromKeycloak()
   → Navigate to role-specific dashboard

═══════════════════════════════════════════════════════════════════════

📋 AUTHENTICATION FLOW
=====================

1. App Initialization
   ──────────────────
   app.config.ts → Initialize Keycloak
   authGuard → Check authentication
   
2. Keycloak Authentication
   ──────────────────────
   Redirect to: http://localhost:8080/realms/MYB/protocol/openid-connect/auth
   Login with credentials
   Receive JWT token with realm roles
   
3. Role Mapping
   ────────────
   AuthRoleService.initializeFromKeycloak(token)
   ├── Extract realm_access.roles
   ├── Map to CopropertyRole enum
   ├── Generate permissions array
   └── Store user in signal
   
4. Route Protection
   ───────────────
   authGuard → Is user authenticated?
   roleGuard → Does user have required role?
   permissionsGuard → Does user have specific permission?
   
5. Navigation
   ──────────
   AuthRoleService.navigateToDefaultRoute()
   ├── SYNDIC → /syndic/dashboard
   ├── OWNER → /owner/dashboard
   ├── COUNCIL → /council/dashboard
   ├── ACCOUNTANT → /accountant/dashboard
   └── ADMIN → /admin/system

═══════════════════════════════════════════════════════════════════════

🧪 TESTING SCENARIOS
===================

Scenario 1: Owner Login (Client App)
────────────────────────────────────
1. Navigate to http://localhost:4200
2. Login as owner@myb.local
3. Should redirect to /coproperty/owner/dashboard
4. Verify access to:
   ✓ My units
   ✓ Invoices (read-only)
   ✓ Maintenance requests
   ✓ Documents
5. Verify NO access to:
   ✗ Admin routes
   ✗ Syndic management
   ✗ Financial configuration

Scenario 2: Syndic Login (Admin App)
────────────────────────────────────
1. Navigate to http://localhost:4201
2. Login as syndic@myb.local
3. Should redirect to /admin/coproperties/syndic/dashboard
4. Verify access to:
   ✓ All coproperties
   ✓ Charges management
   ✓ Invoice creation
   ✓ Fund calls
   ✓ Reports
5. Verify full CRUD operations

Scenario 3: Multi-Role User
───────────────────────────
1. Create user with roles: [coproperty-owner, coproperty-council]
2. Primary role = COUNCIL (higher priority)
3. Should redirect to /admin/coproperties/council/dashboard
4. Can access both council and owner features

═══════════════════════════════════════════════════════════════════════

📊 PORT CONFIGURATION
====================

Service              Port    URL
────────────────────────────────────────────────────
Frontend Client      4200    http://localhost:4200
Frontend Admin       4201    http://localhost:4201
Keycloak            8080    http://localhost:8080
User Service        5001    http://localhost:5001
Document Service    5002    http://localhost:5002
Invoice Service     5003    http://localhost:5003
PostgreSQL          5432    localhost:5432

═══════════════════════════════════════════════════════════════════════

🔍 TROUBLESHOOTING
=================

Problem: Apps won't start
Solution: Check if ports are available
  lsof -ti:4200 -ti:4201 | xargs kill -9

Problem: Keycloak redirect fails
Solution: Verify redirect URIs in Keycloak client config
  http://localhost:4200/*
  http://localhost:4201/*

Problem: Role not mapping correctly
Solution: Check Keycloak token
  localStorage.getItem('kc_token')
  Decode at jwt.io
  Verify realm_access.roles array

Problem: Guard blocking access
Solution: Check console logs
  AuthGuard: Authentication status
  RoleGuard: Required roles vs user roles
  PermissionsGuard: Required permissions

═══════════════════════════════════════════════════════════════════════

📚 USEFUL COMMANDS
=================

# Nx Commands
npx nx graph                          # View dependency graph
npx nx list                           # List all projects
npx nx affected:apps                  # Show affected apps
npx nx test coproperty-module         # Run tests

# Build Commands
npx nx build client --configuration=production
npx nx build admin --configuration=production

# Lint & Format
npx nx lint client
npx nx lint admin
npx nx format:write

# Clear Cache
npx nx reset

═══════════════════════════════════════════════════════════════════════

✨ QUICK START SUMMARY
=====================

1. Start Services:
   docker-compose up

2. Start Apps:
   npx nx run-many --target=serve --projects=client,admin --parallel

3. Access:
   Client: http://localhost:4200
   Admin:  http://localhost:4201

4. Login:
   Use Keycloak credentials

5. Navigate:
   Automatic redirect based on role

EOF

echo ""
echo "🚀 Ready to start? Run:"
echo "   npx nx run-many --target=serve --projects=client,admin --parallel"
echo ""
