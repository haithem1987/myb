# Coproperty User Scenarios - Implementation Guide

## 📋 Overview

This document provides a complete step-by-step implementation of the coproperty management module with role-based user interfaces for:
- **Syndic/Gestionnaire** (Property Manager) - Full management interface
- **Copropriétaire** (Owner) - Simplified owner portal
- **Conseil Syndical** (Council) - Oversight and control interface
- **Comptable** (Accountant) - Financial and accounting interface
- **Administrateur Système** (System Admin) - System administration

## ✅ Implementation Status

### Completed (Step-by-Step)

#### Step 1: Role-Based Authentication Service ✅
- [x] Created `CopropertyRole` enum with 5 roles
- [x] Implemented `UserWithRole` interface
- [x] Built `AuthRoleService` with Angular signals
- [x] Added permission checking system
- [x] Implemented role priority and default routing

**Files Created:**
- `libs/coproperty-module/models/user-role.models.ts`
- `libs/coproperty-module/services/auth-role.service.ts`
- `libs/coproperty-module/services/permissions.service.ts`

#### Step 2: Route Guards ✅
- [x] Created `authGuard` for authentication
- [x] Implemented `roleGuard` for role-based access
- [x] Built `permissionsGuard` for granular permissions
- [x] Used functional guards (Angular 21 pattern)

**Files Created:**
- `libs/coproperty-module/guards/auth.guard.ts`
- `libs/coproperty-module/guards/role.guard.ts`
- `libs/coproperty-module/guards/permissions.guard.ts`

#### Step 3: Syndic Layout & Components ✅
- [x] Professional sidebar layout with navigation
- [x] Dashboard with statistics cards
- [x] Real-time activity feed
- [x] Quick actions menu
- [x] Responsive design with mobile support

**Files Created:**
- `apps/admin/src/app/layouts/syndic-layout/syndic-layout.component.ts`
- `apps/admin/src/app/layouts/syndic-layout/syndic-layout.component.html`
- `apps/admin/src/app/layouts/syndic-layout/syndic-layout.component.scss`
- `apps/admin/src/app/coproperty/syndic/syndic-dashboard/syndic-dashboard.component.ts`
- `apps/admin/src/app/coproperty/syndic/syndic-dashboard/syndic-dashboard.component.html`
- `apps/admin/src/app/coproperty/syndic/syndic-dashboard/syndic-dashboard.component.scss`

#### Step 4: Owner Portal Layout & Components ✅
- [x] Simplified top navigation design
- [x] Owner dashboard with units and invoices
- [x] Mobile-friendly responsive menu
- [x] Quick access to common tasks
- [x] Assembly information display

**Files Created:**
- `apps/admin/src/app/layouts/owner-layout/owner-layout.component.ts`
- `apps/admin/src/app/layouts/owner-layout/owner-layout.component.html`
- `apps/admin/src/app/layouts/owner-layout/owner-layout.component.scss`
- `apps/admin/src/app/coproperty/owner/owner-dashboard/owner-dashboard.component.ts`
- `apps/admin/src/app/coproperty/owner/owner-dashboard/owner-dashboard.component.html`
- `apps/admin/src/app/coproperty/owner/owner-dashboard/owner-dashboard.component.scss`

#### Step 5: Council Layout ✅
- [x] Purple-themed sidebar navigation
- [x] Financial control access
- [x] Contract management
- [x] Assembly oversight

**Files Created:**
- `apps/admin/src/app/layouts/council-layout/council-layout.component.ts`

#### Step 6: Accountant Layout ✅
- [x] Green-themed sidebar navigation
- [x] Accounting entries and journals
- [x] Bank reconciliation
- [x] Financial reports access

**Files Created:**
- `apps/admin/src/app/layouts/accountant-layout/accountant-layout.component.ts`

#### Step 7: Routing Configuration ✅
- [x] Complete route structure for all roles
- [x] Lazy-loaded child modules
- [x] Guard-protected routes
- [x] Permission-based access control

**Files Created:**
- `apps/admin/src/app/coproperty/coproperty.routes.ts`

#### Step 8: Module Organization ✅
- [x] Public API exports
- [x] Barrel exports for easy imports
- [x] Documentation

**Files Created:**
- `libs/coproperty-module/index.ts`
- `docs/COPROPERTY_IMPLEMENTATION_SUMMARY.sh`
- `docs/COPROPERTY_IMPLEMENTATION_README.md`

## 🎨 User Interface Designs

### Syndic Interface
```
┌─────────────────────────────────────────────────────┐
│ ┌─────────┐  ┌─ Header ───────────────────────────┐ │
│ │  Logo   │  │  🔔 Notifications    👤 User       │ │
│ │ Syndic  │  └────────────────────────────────────┘ │
│ ├─────────┤                                          │
│ │Dashboard│  ┌─ Stats ──────────────────────────┐  │
│ │Buildings│  │ 12 Copro │ 450 Units │ €125k     │  │
│ │Charges  │  └──────────────────────────────────┘  │
│ │Invoices │                                          │
│ │Mainten. │  ┌─ Recent Activity ────────────────┐  │
│ │FundCalls│  │ • New invoice created             │  │
│ │Reports  │  │ • Urgent maintenance request      │  │
│ └─────────┘  │ • Payment received                │  │
│              └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Owner Interface
```
┌─────────────────────────────────────────────────────┐
│ Logo │ Dashboard │ Units │ Invoices │ Docs │ 👤    │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Welcome to Your Space                              │
│                                                      │
│  ┌─ My Units ────┐  ┌─ Pending Invoices ────────┐ │
│  │ Apt 3B        │  │ FAC-001  €850  Pay Now    │ │
│  │ 75m² Jardins  │  │ FAC-002  €150  Pay Now    │ │
│  └───────────────┘  └───────────────────────────┘ │
│                                                      │
│  ┌─ Next Assembly ──────────────────────────────┐  │
│  │ 📅 March 15, 2026 at 18:00                    │  │
│  │ 📍 Résidence Les Jardins                      │  │
│  │ [View Agenda]                                 │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## 🔐 Role-Based Access Control

### Role Hierarchy
```
ADMIN (System Administrator)
  └─ Full system access
     ├─ SYNDIC (Property Manager)
     │   └─ Full coproperty management
     ├─ COUNCIL (Council Member)
     │   └─ Oversight and control
     ├─ ACCOUNTANT (Accountant)
     │   └─ Financial operations
     └─ OWNER (Property Owner)
         └─ Personal space only
```

### Permission Matrix

| Feature | SYNDIC | OWNER | COUNCIL | ACCOUNTANT | ADMIN |
|---------|--------|-------|---------|------------|-------|
| Create Coproperty | ✅ | ❌ | ❌ | ❌ | ✅ |
| View Own Units | ✅ | ✅ | ❌ | ❌ | ✅ |
| Manage Charges | ✅ | ❌ | 👁️ View | ✅ | ✅ |
| Create Invoices | ✅ | ❌ | ❌ | ✅ | ✅ |
| Pay Invoices | ❌ | ✅ | ❌ | ❌ | ✅ |
| Request Maintenance | ✅ | ✅ | ❌ | ❌ | ✅ |
| Assign Maintenance | ✅ | ❌ | ❌ | ❌ | ✅ |
| View Reports | ✅ | 👁️ Own | 👁️ All | ✅ | ✅ |
| Create Fund Calls | ✅ | ❌ | 👁️ View | ❌ | ✅ |
| Accounting Entries | ❌ | ❌ | ❌ | ✅ | ✅ |
| System Config | ❌ | ❌ | ❌ | ❌ | ✅ |

## 🚀 Usage Guide

### 1. Nx Workspace Setup

This project runs in an Nx workspace with multiple apps:
- **admin**: `/apps/admin` - Administrative interface
- **client**: `/apps/client` - Client-facing interface

**Run both apps simultaneously:**
```bash
# Terminal 1 - Run client app
npx nx serve client
# Runs on http://localhost:4200

# Terminal 2 - Run admin app
npx nx serve admin --port 4201
# Runs on http://localhost:4201
```

**Or use Nx parallel execution:**
```bash
# Run both apps in parallel
npx nx run-many --target=serve --projects=client,admin --parallel
```

### 2. Keycloak Authentication Integration

This module integrates with **Keycloak** for authentication and role management.

**Keycloak Realm Roles:**
- `coproperty-syndic` → Maps to `CopropertyRole.SYNDIC`
- `coproperty-owner` → Maps to `CopropertyRole.OWNER`
- `coproperty-council` → Maps to `CopropertyRole.COUNCIL`
- `coproperty-accountant` → Maps to `CopropertyRole.ACCOUNTANT`
- `system-admin` → Maps to `CopropertyRole.ADMIN`

**Initialize from Keycloak token:**
```typescript
import { AuthRoleService } from '@libs/coproperty-module';

// In your authentication callback component
const authService = inject(AuthRoleService);

// After Keycloak authentication
keycloak.loadUserProfile().then((profile) => {
  const token = keycloak.tokenParsed;
  authService.initializeFromKeycloak(token);
  authService.navigateToDefaultRoute();
});
```

### 3. Import Routes

**For Admin app** (`apps/admin/src/app/app.routes.ts`):
```typescript
import { COPROPERTY_ROUTES } from './coproperty/coproperty.routes';
import { authGuard } from 'libs/auth/src/lib/auth.guard';

export const routes: Routes = [
  {
    path: 'admin',
    canActivate: [authGuard],
    children: [
      {
        path: 'coproperties',
        children: COPROPERTY_ROUTES
      }
    ]
  }
];
```

**For Client app** (`apps/client/src/app/app.routes.ts`):
```typescript
import { COPROPERTY_ROUTES } from '@myb-front/coproperty-module';
import { authGuard } from 'libs/auth/src/lib/auth.guard';

export const routes: Routes = [
  {
    path: 'coproperty',
    canActivate: [authGuard],
    children: COPROPERTY_ROUTES
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    children: [
      {
        path: 'coproperties',
        loadChildren: () => import('@myb-front/coproperty-module')
          .then(m => m.COPROPERTY_ROUTES)
      },
      {
        path: 'owner',
        loadComponent: () => import('@myb-front/coproperty-module')
          .then(m => m.OwnerDashboardComponent)
      }
    ]
  }
];
```

### 4. Keycloak Configuration

**Keycloak Realm Setup:**
```json
{
  "realm": "MYB",
  "clients": [
    {
      "clientId": "myb-client",
      "redirectUris": [
        "http://localhost:4200/*",
        "http://localhost:4201/*"
      ],
      "webOrigins": ["+"]
    }
  ],
  "roles": {
    "realm": [
      "coproperty-syndic",
      "coproperty-owner",
      "coproperty-council",
      "coproperty-accountant",
      "system-admin"
    ]
  }
}
```

**User Authentication Flow:**
```typescript
import { AuthRoleService } from '@myb-front/coproperty-module';
import Keycloak from 'keycloak-js';

// Initialize Keycloak
const keycloak = new Keycloak({
  url: 'http://localhost:8080',
  realm: 'MYB',
  clientId: 'MYB-client'
});

// In your app initialization
keycloak.init({ onLoad: 'login-required' }).then((authenticated) => {
  if (authenticated) {
    const authService = inject(AuthRoleService);
    
    // Initialize from Keycloak token
    authService.initializeFromKeycloak(keycloak.tokenParsed);
    
    // Navigate to appropriate interface
    authService.navigateToDefaultRoute();
  }
});
```

**Manual user setup (for testing without Keycloak):**
```typescript
import { AuthRoleService, CopropertyRole } from '@myb-front/coproperty-module';

const authService = inject(AuthRoleService);

authorService.setUser({
  id: 'user-123',
  email: 'syndic@example.com',
  firstName: 'Marie',
  lastName: 'Dupont',
  roles: [CopropertyRole.SYNDIC],
  permissions: [
    'coproperty:create',
    'charges:manage',
    'invoices:manage'
  ],
  managedCoproperties: ['copro-1', 'copro-2']
});

authService.navigateToDefaultRoute();
```

### 3. Use in Components

```typescript
import { AuthRoleService, CopropertyRole } from '@libs/coproperty-module';

@Component({...})
export class MyComponent {
  private authService = inject(AuthRoleService);
  
  canManageCharges = computed(() => 
    this.authService.hasPermission('charges:manage')
  );
  
  isSyndic = computed(() => 
    this.authService.hasRole(CopropertyRole.SYNDIC)
  );
}
```

### 4. Protect Routes

```typescript
// Already configured in coproperty.routes.ts
{
  path: 'charges',
  canActivate: [authGuard, roleGuard, permissionsGuard],
  data: {
    roles: [CopropertyRole.SYNDIC, CopropertyRole.ADMIN],
    permission: 'charges:manage'
  },
  component: ChargesComponent
}
```

## 📂 Project Structure

```
src/front/myb.front/
├── apps/admin/src/app/
│   ├── layouts/
│   │   ├── syndic-layout/          # Syndic interface
│   │   ├── owner-layout/           # Owner interface
│   │   ├── council-layout/         # Council interface
│   │   └── accountant-layout/      # Accountant interface
│   │
│   └── coproperty/
│       ├── coproperty.routes.ts    # Main routing config
│       ├── syndic/                 # Syndic modules
│       │   ├── syndic-dashboard/
│       │   ├── coproperties/
│       │   ├── charges/
│       │   ├── invoices/
│       │   └── ...
│       ├── owner/                  # Owner modules
│       │   ├── owner-dashboard/
│       │   ├── my-units/
│       │   ├── invoices/
│       │   └── ...
│       ├── council/                # Council modules
│       ├── accountant/             # Accountant modules
│       └── shared/                 # Shared components
│
└── libs/coproperty-module/
    ├── models/
    │   └── user-role.models.ts     # Role & permission types
    ├── services/
    │   ├── auth-role.service.ts    # Authentication service
    │   └── permissions.service.ts  # Permissions service
    ├── guards/
    │   ├── auth.guard.ts           # Auth guard
    │   ├── role.guard.ts           # Role guard
    │   └── permissions.guard.ts    # Permission guard
    └── index.ts                    # Public API
```

## 🔧 Next Steps for Complete Implementation

### Phase 1: Child Route Components (Priority)
1. Create lazy-loaded modules for each section
2. Implement CRUD components for:
   - Coproperties management
   - Charges management
   - Invoices management
   - Maintenance requests
   - Fund calls

### Phase 2: Backend Integration
1. Set up Apollo Client for GraphQL
2. Create service layer for API calls
3. Implement mutations and queries
4. Add real-time subscriptions
5. Error handling and loading states

### Phase 3: Additional Features
1. Document management system
2. General assembly module
3. Notification system
4. Payment integration
5. User profile management
6. Multi-language support

### Phase 4: Testing & Quality
1. Unit tests for all services
2. Component tests
3. E2E tests for user flows
4. Accessibility audit
5. Performance optimization
6. Security review

## 🎯 Key Features

- ✅ **Role-Based Access**: 5 distinct user roles with specific interfaces
- ✅ **Permission System**: Granular permission control
- ✅ **Modern Angular**: Standalone components, signals, functional guards
- ✅ **Responsive Design**: Mobile-first approach
- ✅ **Lazy Loading**: Optimized bundle sizes
- ✅ **Type Safety**: Full TypeScript coverage
- ✅ **Scalable Architecture**: Easy to extend

## 📝 Testing the Implementation

### Test User Scenarios

```typescript
// Syndic user
authService.setUser({
  id: '1',
  email: 'syndic@example.com',
  firstName: 'Marie',
  lastName: 'Dupont',
  roles: [CopropertyRole.SYNDIC],
  permissions: ['coproperty:*', 'charges:*', 'invoices:*'],
  managedCoproperties: ['copro-1', 'copro-2']
});

// Owner user
authService.setUser({
  id: '2',
  email: 'owner@example.com',
  firstName: 'Jean',
  lastName: 'Martin',
  roles: [CopropertyRole.OWNER],
  permissions: ['invoices:read', 'maintenance:create'],
  ownedUnits: ['unit-1', 'unit-2']
});
```

## 📚 Documentation

- **Full Specification**: `docs/COPROPERTY_USER_SCENARIOS.md`
- **Implementation Summary**: Run `./docs/COPROPERTY_IMPLEMENTATION_SUMMARY.sh`
- **API Documentation**: `libs/coproperty-module/README.md`

## 🤝 Contributing

When adding new features:
1. Follow the existing role-based architecture
2. Add appropriate guards to routes
3. Update permission types in `user-role.models.ts`
4. Create responsive, accessible components
5. Add tests for new functionality

## ✨ Conclusion

The foundation for the coproperty management system is now complete! All core layouts, routing, and authentication are in place. Continue with child route implementation and backend integration to build a fully functional system.

---

**Status**: Foundation Complete ✅  
**Next Phase**: Child Routes & Backend Integration  
**Estimated Time**: 40-60 hours for complete implementation
