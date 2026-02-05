# User Management Architecture - Keycloak vs Application Users

## Overview

The MYB Coproperty Management System uses **two distinct user concepts**:

1. **Keycloak Users** (Authentication Layer)
2. **Application Users** (Business Layer - Copropriétaires, Syndics, etc.)

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Authentication Layer                      │
│                        (Keycloak)                           │
│                                                             │
│  User: nidhalbm                                             │
│  Email: nidhal@example.com                                  │
│  Roles: [copropriétaire, syndic, admin]                     │
│  Realm: myb-realm                                           │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    │ JWT Token with Claims
                    │ (sub, email, roles, etc.)
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                         │
│            (MYB Coproperty Services)                        │
│                                                             │
│  Business Entities:                                         │
│  ┌──────────────────────────────────────────────┐          │
│  │ Copropriétaire: Jean Martin                  │          │
│  │ - FirstName: Jean                            │          │
│  │ - LastName: Martin                           │          │
│  │ - Email: jean.martin@email.com               │          │
│  │ - Phone: +33 6 12 34 56 78                   │          │
│  │ - Units: [A101, B205]                        │          │
│  │ - Coproperty: Résidence Les Jardins          │          │
│  │ - KeycloakUserId: "auth-user-123-xyz"        │          │
│  └──────────────────────────────────────────────┘          │
│                                                             │
│  Mapping:                                                   │
│  keycloak:nidhalbm → app:Jean Martin (Copropriétaire)      │
└─────────────────────────────────────────────────────────────┘
```

## Why Two Separate Systems?

### 1. **Keycloak (Authentication & Authorization)**
- **Purpose**: Handles login, security, and access control
- **Manages**: 
  - User credentials (username/password)
  - OAuth2/OIDC tokens
  - Roles and permissions
  - Single Sign-On (SSO)
  - Multi-factor authentication
- **Example User**:
  ```json
  {
    "username": "nidhalbm",
    "email": "nidhal@myb.com",
    "roles": ["copropriétaire", "syndic"],
    "sub": "550e8400-e29b-41d4-a716-446655440000"
  }
  ```

### 2. **Application Database (Business Logic)**
- **Purpose**: Stores business-specific information
- **Manages**:
  - Copropriétaire personal information
  - Property ownership details
  - Unit assignments
  - Invoices, charges, maintenance requests
  - Coproperty-specific data
- **Example Entity**:
  ```json
  {
    "id": "copro-001",
    "firstName": "Jean",
    "lastName": "Martin",
    "email": "jean.martin@email.com",
    "phone": "+33 6 12 34 56 78",
    "keycloakUserId": "550e8400-e29b-41d4-a716-446655440000",
    "units": [
      {
        "unitNumber": "A101",
        "shares": 75,
        "copropertyId": "jardins-001"
      }
    ]
  }
  ```

## User Flow Example

### Scenario: You log in as `nidhalbm` but see "Jean Martin" in the UI

1. **Login (Keycloak)**:
   ```
   User enters: username = "nidhalbm", password = "******"
   ↓
   Keycloak validates credentials
   ↓
   Returns JWT Token with:
   - sub: "550e8400-e29b-41d4-a716-446655440000"
   - email: "nidhal@myb.com"
   - roles: ["copropriétaire"]
   ```

2. **Application Lookup**:
   ```
   Frontend sends JWT to backend
   ↓
   Backend extracts: sub = "550e8400-e29b-41d4-a716-446655440000"
   ↓
   Database query:
   SELECT * FROM Coproprietaires 
   WHERE KeycloakUserId = "550e8400-e29b-41d4-a716-446655440000"
   ↓
   Returns: {
     firstName: "Jean",
     lastName: "Martin",
     email: "jean.martin@email.com",
     ...
   }
   ```

3. **UI Display**:
   ```
   Display name: "Jean Martin"
   Display email: "jean.martin@email.com"
   Show units owned by Jean Martin
   Show invoices for Jean Martin
   ```

## Data Flow

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│   Browser   │─────▶│   Keycloak   │─────▶│  JWT Token      │
│             │      │   (Login)    │      │  {sub, roles}   │
└─────────────┘      └──────────────┘      └────────┬────────┘
                                                     │
                                                     ▼
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│   Angular   │◀─────│  Backend API │◀─────│  Database       │
│   (UI)      │      │  (GraphQL)   │      │  Copropriétaire │
│             │      │              │      │  WHERE          │
│Display:     │      │Lookup by     │      │  KeycloakUserId │
│Jean Martin  │      │sub from JWT  │      │  = "550e8..."   │
└─────────────┘      └──────────────┘      └─────────────────┘
```

## Implementation Details

### Backend Entity (C#)

```csharp
public class Coproprietaire : BaseEntity<Guid>
{
    // Business information
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    public string Phone { get; set; }
    
    // Link to Keycloak
    public string KeycloakUserId { get; set; }  // Maps to Keycloak's 'sub' claim
    
    // Business relationships
    public List<Unit> Units { get; set; }
    public Guid CopropertyId { get; set; }
    public Coproperty Coproperty { get; set; }
}
```

### GraphQL Query

```graphql
query GetCurrentUser {
  currentUser {
    id
    firstName
    lastName
    email
    phone
    units {
      unitNumber
      shares
      coproperty {
        name
        address
      }
    }
  }
}
```

### Authentication Middleware

```csharp
public class AuthenticationService
{
    public async Task<Coproprietaire> GetCurrentUser(HttpContext context)
    {
        // Extract Keycloak user ID from JWT
        var keycloakUserId = context.User.FindFirst("sub")?.Value;
        
        // Lookup in database
        return await _dbContext.Coproprietaires
            .Include(c => c.Units)
            .ThenInclude(u => u.Coproperty)
            .FirstOrDefaultAsync(c => c.KeycloakUserId == keycloakUserId);
    }
}
```

## User Management Workflow

### Creating a New Copropriétaire

1. **Syndic creates business entity** (in MYB application):
   ```
   POST /api/coproprietaires
   {
     "firstName": "Marie",
     "lastName": "Dupont",
     "email": "marie.dupont@email.com",
     "phone": "+33 6 98 76 54 32",
     "unitId": "unit-A205"
   }
   ```

2. **System creates Keycloak user** (automated):
   ```javascript
   // Backend creates Keycloak user via Admin API
   const keycloakUser = await keycloakAdmin.createUser({
     username: "marie.dupont@email.com",
     email: "marie.dupont@email.com",
     firstName: "Marie",
     lastName: "Dupont",
     enabled: true,
     emailVerified: false,
     credentials: [{
       type: "password",
       value: generateTemporaryPassword(),
       temporary: true  // Force password change on first login
     }],
     realmRoles: ["copropriétaire"]
   });
   
   // Update database with Keycloak ID
   await updateCoproprietaire({
     id: "copro-new-001",
     keycloakUserId: keycloakUser.id
   });
   ```

3. **User receives email**:
   ```
   Subject: Bienvenue sur MYB Copropriété
   
   Bonjour Marie Dupont,
   
   Votre compte a été créé. Vous pouvez vous connecter avec:
   - Nom d'utilisateur: marie.dupont@email.com
   - Mot de passe temporaire: TempPass123!
   
   Vous devrez changer votre mot de passe lors de votre première connexion.
   ```

## Benefits of This Architecture

### ✅ Security
- Authentication is handled by industry-standard Keycloak
- Passwords never stored in application database
- OAuth2/OIDC compliance
- MFA support

### ✅ Separation of Concerns
- **Keycloak**: Who you are (identity)
- **Application**: What you own and what you can do (business logic)

### ✅ Flexibility
- Same Keycloak user can have different roles in different coproperties
- Easy to add/remove business permissions without touching auth
- Support for multiple authentication methods (social login, LDAP, etc.)

### ✅ Data Privacy
- Minimal personal data in application database
- Sensitive auth data isolated in Keycloak
- Easier GDPR compliance

## Common Scenarios

### Scenario 1: User with Multiple Roles

```
Keycloak User: nidhalbm
├── Role: copropriétaire
│   └── Application Entity: Jean Martin (owns unit A101)
│
└── Role: syndic
    └── Application Entity: Syndic Admin (manages Résidence Les Jardins)
```

### Scenario 2: User Transfers Property

```
Before:
Jean Martin (copro-001) → Unit A101 → Keycloak:nidhalbm

Transfer:
1. Update Unit A101 owner: copro-001 → copro-002
2. Update new owner with Keycloak mapping
3. Send invitation to new owner
4. Jean Martin still has Keycloak account but no units

After:
Sophie Bernard (copro-002) → Unit A101 → Keycloak:sophie.b
Jean Martin (copro-001) → (no units) → Keycloak:nidhalbm (can be disabled)
```

### Scenario 3: Admin Creating Users

```
Admin Flow:
1. Admin logs in (Keycloak: admin@myb.com)
2. Creates copropriétaire "Thomas Petit" in UI
3. Backend:
   a. Creates Copropriétaire entity in DB
   b. Calls Keycloak API to create user
   c. Links KeycloakUserId in Copropriétaire table
   d. Sends welcome email
4. Thomas receives credentials
5. Thomas logs in and sees his profile
```

## Summary

| Aspect | Keycloak | Application DB |
|--------|----------|----------------|
| **Purpose** | Authentication | Business Logic |
| **Stores** | Credentials, roles | Personal info, units, invoices |
| **Example** | `nidhalbm` | `Jean Martin` |
| **Primary Key** | `sub` (UUID) | `Id` (Guid) |
| **Link** | N/A | `KeycloakUserId` field |
| **Who manages** | Keycloak Admin or API | Syndic via MYB UI |

**Key Point**: When you log in as `nidhalbm`, the system looks up which copropriétaire (Jean Martin) is linked to that Keycloak account and displays Jean Martin's information throughout the application.
