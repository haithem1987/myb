# Keycloak Configuration for MYB Coproperty Module

## 🔐 Overview

This guide explains how to configure Keycloak for the MYB Coproperty module with proper realm roles, client settings, and user management.

---

## 📋 Prerequisites

- Keycloak running on `http://localhost:8080`
- Realm: `MYB`
- Client ID: `MYB-client`

---

## 🏗️ Realm Configuration

### 1. Create Realm Roles

Navigate to: **Realm Settings → Roles → Create Role**

Create the following roles:

| Role Name | Description |
|-----------|-------------|
| `coproperty-syndic` | Property manager with full management access |
| `coproperty-owner` | Property owner with limited access |
| `coproperty-council` | Council member with oversight access |
| `coproperty-accountant` | Accountant with financial access |
| `system-admin` | System administrator with all access |

```json
{
  "roles": {
    "realm": [
      {
        "name": "coproperty-syndic",
        "description": "Syndic - Full coproperty management",
        "composite": false
      },
      {
        "name": "coproperty-owner",
        "description": "Owner - Personal space access",
        "composite": false
      },
      {
        "name": "coproperty-council",
        "description": "Council - Oversight and control",
        "composite": false
      },
      {
        "name": "coproperty-accountant",
        "description": "Accountant - Financial operations",
        "composite": false
      },
      {
        "name": "system-admin",
        "description": "System Administrator",
        "composite": false
      }
    ]
  }
}
```

---

## 🔧 Client Configuration

### 1. Create/Update Client

Navigate to: **Clients → MYB-client**

**Settings:**
```json
{
  "clientId": "MYB-client",
  "enabled": true,
  "protocol": "openid-connect",
  "publicClient": true,
  "redirectUris": [
    "http://localhost:4200/*",
    "http://localhost:4201/*",
    "http://localhost:3000/*"
  ],
  "webOrigins": ["+"],
  "standardFlowEnabled": true,
  "implicitFlowEnabled": false,
  "directAccessGrantsEnabled": true,
  "attributes": {
    "pkce.code.challenge.method": "S256"
  }
}
```

### 2. Client Scopes

Add custom claims for coproperty-specific data:

**Create Mapper: `managed-coproperties`**
- Name: `managed-coproperties`
- Mapper Type: `User Attribute`
- User Attribute: `managedCoproperties`
- Token Claim Name: `managed_coproperties`
- Claim JSON Type: `JSON`

**Create Mapper: `owned-units`**
- Name: `owned-units`
- Mapper Type: `User Attribute`
- User Attribute: `ownedUnits`
- Token Claim Name: `owned_units`
- Claim JSON Type: `JSON`

---

## 👥 User Configuration

### Test User: Syndic

**User Details:**
- Username: `marie.dubois`
- Email: `marie.dubois@gestion-dubois.fr`
- First Name: `Marie`
- Last Name: `Dubois`
- Email Verified: `true`

**Role Mappings:**
- Assign: `coproperty-syndic`

**Attributes:**
```json
{
  "managedCoproperties": "[\"copro-1\", \"copro-2\", \"copro-3\"]"
}
```

**Password:**
- Temporary: `false`
- Password: `Syndic123!`

### Test User: Owner

**User Details:**
- Username: `jean.martin`
- Email: `jean.martin@email.fr`
- First Name: `Jean`
- Last Name: `Martin`
- Email Verified: `true`

**Role Mappings:**
- Assign: `coproperty-owner`

**Attributes:**
```json
{
  "ownedUnits": "[\"unit-a101\", \"unit-p12\"]"
}
```

**Password:**
- Temporary: `false`
- Password: `Owner123!`

### Test User: Council

**User Details:**
- Username: `pierre.rousseau`
- Email: `pierre.rousseau@conseil.fr`
- First Name: `Pierre`
- Last Name: `Rousseau`

**Role Mappings:**
- Assign: `coproperty-council`

**Password:**
- Temporary: `false`
- Password: `Council123!`

### Test User: Accountant

**User Details:**
- Username: `sophie.bernard`
- Email: `sophie.bernard@compta.fr`
- First Name: `Sophie`
- Last Name: `Bernard`

**Role Mappings:**
- Assign: `coproperty-accountant`

**Password:**
- Temporary: `false`
- Password: `Accountant123!`

---

## 🔑 JWT Token Structure

After authentication, the JWT token will contain:

```json
{
  "sub": "uuid-user-id",
  "email": "jean.martin@email.fr",
  "given_name": "Jean",
  "family_name": "Martin",
  "realm_access": {
    "roles": [
      "coproperty-owner"
    ]
  },
  "owned_units": ["unit-a101", "unit-p12"],
  "managed_coproperties": []
}
```

---

## 🔌 Frontend Integration

### Initialize Keycloak in Angular

**app.config.ts:**
```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://localhost:8080',
  realm: 'MYB',
  clientId: 'MYB-client'
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    {
      provide: 'KEYCLOAK_INSTANCE',
      useValue: keycloak
    }
  ]
};
```

### Initialize on App Start

**main.ts:**
```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { inject } from '@angular/core';
import { AuthRoleService } from '@myb-front/coproperty-module';

const keycloak = new Keycloak({
  url: 'http://localhost:8080',
  realm: 'MYB',
  clientId: 'MYB-client'
});

keycloak.init({
  onLoad: 'login-required',
  checkLoginIframe: false
}).then((authenticated) => {
  if (authenticated) {
    bootstrapApplication(AppComponent, appConfig).then((appRef) => {
      const authService = appRef.injector.get(AuthRoleService);
      authService.initializeFromKeycloak(keycloak.tokenParsed);
      authService.navigateToDefaultRoute();
    });
  } else {
    console.error('Authentication failed');
  }
});
```

### Use in Components

```typescript
import { Component, inject } from '@angular/core';
import { AuthRoleService, CopropertyRole } from '@myb-front/coproperty-module';

@Component({
  selector: 'app-dashboard',
  template: `
    <div *ngIf="isSyndic()">
      <h1>Syndic Dashboard</h1>
      <!-- Syndic-specific content -->
    </div>
    
    <div *ngIf="isOwner()">
      <h1>Owner Dashboard</h1>
      <!-- Owner-specific content -->
    </div>
  `
})
export class DashboardComponent {
  private authService = inject(AuthRoleService);
  
  isSyndic = computed(() => 
    this.authService.hasRole(CopropertyRole.SYNDIC)
  );
  
  isOwner = computed(() => 
    this.authService.hasRole(CopropertyRole.OWNER)
  );
}
```

---

## 🧪 Testing Authentication Flow

### 1. Test Syndic Login

```bash
# Navigate to admin app
open http://localhost:4201/admin

# Should redirect to Keycloak
# Login with: marie.dubois@gestion-dubois.fr / Syndic123!

# After authentication, should land on:
# http://localhost:4201/admin/coproperties/syndic/dashboard
```

### 2. Test Owner Login

```bash
# Navigate to client app
open http://localhost:4200/coproperty

# Should redirect to Keycloak
# Login with: jean.martin@email.fr / Owner123!

# After authentication, should land on:
# http://localhost:4200/coproperty/owner/dashboard
```

### 3. Test Role-Based Access

```bash
# Try accessing syndic route as owner
open http://localhost:4200/coproperty/syndic/dashboard

# Should be blocked by RoleGuard
# Should redirect to /coproperty/owner/dashboard
```

---

## 🔍 Debugging

### Check Token in Browser

```javascript
// In browser console
localStorage.getItem('kc_token');

// Decode at jwt.io
// Verify:
// - realm_access.roles contains expected role
// - email matches user
// - owned_units or managed_coproperties are present
```

### Check Authentication Status

```typescript
// In component
const authService = inject(AuthRoleService);

console.log('Authenticated:', authService.isAuthenticated());
console.log('User:', authService.getUser());
console.log('Roles:', authService.userRoles());
console.log('Permissions:', authService.userPermissions());
```

---

## 📊 Role Priority

When a user has multiple roles, the system uses this priority:

1. **ADMIN** (system-admin) - Highest
2. **SYNDIC** (coproperty-syndic)
3. **COUNCIL** (coproperty-council)
4. **ACCOUNTANT** (coproperty-accountant)
5. **OWNER** (coproperty-owner) - Lowest

**Example:**
- User with `[coproperty-owner, coproperty-council]`
- Primary role: `COUNCIL`
- Redirects to: `/coproperty/council/dashboard`
- Has access to both council and owner features

---

## 🔐 Security Best Practices

1. **Use HTTPS in production**
   ```json
   {
     "redirectUris": [
       "https://myb.app/*"
     ]
   }
   ```

2. **Enable PKCE** (already configured)
   ```json
   {
     "attributes": {
       "pkce.code.challenge.method": "S256"
     }
   }
   ```

3. **Set token expiration**
   - Access Token: 5 minutes
   - Refresh Token: 30 minutes
   - SSO Session: 10 hours

4. **Use refresh tokens**
   ```typescript
   keycloak.updateToken(30).then((refreshed) => {
     if (refreshed) {
       console.log('Token refreshed');
     }
   });
   ```

---

## 📚 Additional Resources

- **Keycloak Admin Console:** http://localhost:8080/admin
- **Realm:** MYB
- **Default Admin:** admin / admin
- **Documentation:** https://www.keycloak.org/docs/latest/

---

## ✅ Configuration Checklist

- [ ] Realm `MYB` created
- [ ] 5 realm roles created
- [ ] Client `MYB-client` configured
- [ ] Redirect URIs set for both apps
- [ ] Custom mappers created
- [ ] Test users created with appropriate roles
- [ ] User attributes set (owned_units, managed_coproperties)
- [ ] Frontend integrated with Keycloak
- [ ] Authentication flow tested
- [ ] Role-based routing verified

---

**Status:** Ready for Development ✅  
**Last Updated:** January 30, 2026
