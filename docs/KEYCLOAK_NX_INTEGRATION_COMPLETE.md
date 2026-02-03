# ✅ MYB Coproperty Module - Keycloak & Nx Integration Complete

## 🎯 Summary

The coproperty module has been successfully updated to integrate with:
- ✅ **Keycloak authentication** with realm role mapping
- ✅ **Nx workspace** with client (4200) and admin (4201) apps
- ✅ **Role-based routing** with automatic user redirection
- ✅ **JWT token processing** with custom claims

---

## 📦 What Was Updated

### 1. Authentication Service (`AuthRoleService`)
**Updated:** `libs/coproperty-module/services/auth-role.service.ts`

**New Features:**
- ✅ `initializeFromKeycloak(token)` - Extracts roles from Keycloak JWT
- ✅ `mapKeycloakRoles()` - Maps realm roles to CopropertyRole enum
- ✅ `mapKeycloakPermissions()` - Generates permissions from roles
- ✅ Supports custom claims: `managed_coproperties`, `owned_units`

**Keycloak Role Mapping:**
```typescript
'coproperty-syndic' → CopropertyRole.SYNDIC
'coproperty-owner' → CopropertyRole.OWNER
'coproperty-council' → CopropertyRole.COUNCIL
'coproperty-accountant' → CopropertyRole.ACCOUNTANT
'system-admin' → CopropertyRole.ADMIN
```

### 2. Documentation Updates

**Created:**
- ✅ `docs/NX_WORKSPACE_QUICKSTART.sh` - Complete Nx setup guide
- ✅ `docs/KEYCLOAK_CONFIGURATION.md` - Full Keycloak config guide
- ✅ Updated `docs/COPROPERTY_IMPLEMENTATION_README.md` - Added Keycloak integration
- ✅ Updated `docs/COPROPERTY_USER_SCENARIOS.md` - Added authentication flows

---

## 🚀 How to Run Both Apps

### Option 1: Parallel Execution (Recommended)
```bash
cd src/front/myb.front
npx nx run-many --target=serve --projects=client,admin --parallel
```
- **Client app:** http://localhost:4200 (Owner portal)
- **Admin app:** http://localhost:4201 (Management interfaces)

### Option 2: Separate Terminals
```bash
# Terminal 1 - Client App
cd src/front/myb.front
npx nx serve client

# Terminal 2 - Admin App
cd src/front/myb.front
npx nx serve admin --port 4201
```

---

## 🔐 Keycloak Setup

### Test Users

| User | Email | Role | Password | App | Dashboard |
|------|-------|------|----------|-----|-----------|
| Marie Dubois | syndic@myb.local | coproperty-syndic | Syndic123! | Admin (4201) | /admin/coproperties/syndic/dashboard |
| Jean Martin | owner@myb.local | coproperty-owner | Owner123! | Client (4200) | /coproperty/owner/dashboard |
| Pierre Rousseau | council@myb.local | coproperty-council | Council123! | Admin (4201) | /admin/coproperties/council/dashboard |
| Sophie Bernard | accountant@myb.local | coproperty-accountant | Accountant123! | Admin (4201) | /admin/coproperties/accountant/dashboard |

### Required Keycloak Configuration

**Realm:** MYB  
**Client ID:** MYB-client  
**Redirect URIs:**
- http://localhost:4200/*
- http://localhost:4201/*

**Realm Roles:**
- coproperty-syndic
- coproperty-owner
- coproperty-council
- coproperty-accountant
- system-admin

**Custom Mappers:**
- `managed_coproperties` (User Attribute → Token Claim)
- `owned_units` (User Attribute → Token Claim)

📖 **Full guide:** `docs/KEYCLOAK_CONFIGURATION.md`

---

## 📋 Authentication Flow

```
1. User navigates to app (Client or Admin)
   ↓
2. authGuard checks authentication
   ↓
3. Redirect to Keycloak login
   http://localhost:8080/realms/MYB/protocol/openid-connect/auth
   ↓
4. User logs in with credentials
   ↓
5. Keycloak returns JWT token with roles
   {
     "realm_access": { "roles": ["coproperty-syndic"] },
     "email": "syndic@myb.local",
     "managed_coproperties": ["copro-1", "copro-2"]
   }
   ↓
6. AuthRoleService.initializeFromKeycloak(token)
   ├── Map realm roles to CopropertyRole
   ├── Generate permissions
   ├── Store user data
   └── Navigate to default route
   ↓
7. User lands on role-specific dashboard
```

---

## 🎨 App Architecture

### Client App (Port 4200)
**Purpose:** Owner portal  
**Primary Users:** Copropriétaires  
**Routes:**
- `/coproperty/owner/dashboard`
- `/coproperty/owner/my-units`
- `/coproperty/owner/invoices`
- `/coproperty/owner/maintenance`
- `/coproperty/owner/documents`

### Admin App (Port 4201)
**Purpose:** Management interfaces  
**Primary Users:** Syndic, Council, Accountant, Admin  
**Routes:**
- `/admin/coproperties/syndic/*`
- `/admin/coproperties/council/*`
- `/admin/coproperties/accountant/*`
- `/admin/system/*`

---

## 📚 Quick Reference Commands

### View Nx Workspace Guide
```bash
./docs/NX_WORKSPACE_QUICKSTART.sh
```

### View Keycloak Configuration
```bash
cat docs/KEYCLOAK_CONFIGURATION.md
```

### View Implementation Summary
```bash
./docs/COPROPERTY_IMPLEMENTATION_SUMMARY.sh
```

### View Complete README
```bash
cat docs/COPROPERTY_IMPLEMENTATION_README.md
```

---

## 🧪 Testing the Integration

### Test 1: Owner Login (Client App)
```bash
1. Navigate to http://localhost:4200
2. Should redirect to Keycloak
3. Login as: owner@myb.local / Owner123!
4. Should land on: /coproperty/owner/dashboard
5. Verify: Can see owned units and invoices
6. Verify: Cannot access /admin routes
```

### Test 2: Syndic Login (Admin App)
```bash
1. Navigate to http://localhost:4201
2. Should redirect to Keycloak
3. Login as: syndic@myb.local / Syndic123!
4. Should land on: /admin/coproperties/syndic/dashboard
5. Verify: Can access all management features
6. Verify: Can see managed coproperties
```

### Test 3: Role-Based Access Control
```bash
# Try accessing syndic route as owner
1. Login as owner@myb.local
2. Navigate to /coproperty/syndic/dashboard
3. Should be blocked by RoleGuard
4. Should redirect to /coproperty/owner/dashboard
```

---

## 🔍 Debugging

### Check Authentication Status
```typescript
// In browser console
const authService = inject(AuthRoleService);
console.log('Authenticated:', authService.isAuthenticated());
console.log('User:', authService.getUser());
console.log('Roles:', authService.userRoles());
console.log('Permissions:', authService.userPermissions());
```

### Check Keycloak Token
```javascript
// In browser console
localStorage.getItem('kc_token');
// Copy and decode at jwt.io
```

### Common Issues

**Problem:** Apps won't start on specified ports  
**Solution:**
```bash
# Kill processes on ports
lsof -ti:4200 -ti:4201 | xargs kill -9
```

**Problem:** Keycloak redirect not working  
**Solution:** Verify redirect URIs in Keycloak client config

**Problem:** Roles not mapping correctly  
**Solution:** Check `realm_access.roles` in JWT token

---

## 📊 Project Statistics

| Category | Count |
|----------|-------|
| Total Files Created | 23 |
| Services Updated | 1 (AuthRoleService) |
| Documentation Files | 4 |
| Nx Apps | 2 (client, admin) |
| User Roles | 5 |
| Test Users | 4 |

---

## ✨ What's Next?

1. **Configure Keycloak** using `docs/KEYCLOAK_CONFIGURATION.md`
2. **Create test users** with appropriate roles
3. **Start both apps** using Nx commands
4. **Test authentication** flow for each role
5. **Implement child routes** for specific features
6. **Connect to GraphQL backend**

---

## 📖 Documentation Index

1. **NX_WORKSPACE_QUICKSTART.sh** - How to run both apps
2. **KEYCLOAK_CONFIGURATION.md** - Complete Keycloak setup
3. **COPROPERTY_IMPLEMENTATION_README.md** - Full implementation guide
4. **COPROPERTY_IMPLEMENTATION_SUMMARY.sh** - Visual summary
5. **COPROPERTY_USER_SCENARIOS.md** - Updated with Keycloak flows

---

**Status:** ✅ Keycloak & Nx Integration Complete  
**Date:** January 30, 2026  
**Ready for:** Testing & Development  
**Next Phase:** Child route implementation & backend integration
