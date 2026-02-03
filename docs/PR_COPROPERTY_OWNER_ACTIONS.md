# Pull Request: Coproperty Owner Actions Implementation

## Summary

This PR implements the complete coproperty owner portal functionality requested in [prompt.md](../prompt.md), including meeting/agenda management, calendar integration, maintenance request creation, and comprehensive Keycloak user mapping documentation.

## Features Implemented

### ✅ Owner UI Actions (Détails, voir ordre de jours, ajouter aux calendrier, Nouvelle Demande)

1. **Détails (Property Details)**
   - Owner dashboard displays all owned units
   - Unit details: number, floor, area, shares, ownership percentage
   - Real-time data from GraphQL API

2. **Voir ordre de jours (View Meeting Agendas)**
   - New `OwnerAssembliesComponent` displays upcoming and past meetings
   - View full agenda text
   - View meeting minutes (for completed meetings)
   - Filter by assembly type (Ordinary/Extraordinary)

3. **Ajouter aux calendrier (Add to Calendar)**
   - ICS file generation for calendar events
   - Compatible with Google Calendar, Outlook, Apple Calendar
   - Includes meeting date, time, location, and agenda
   - One-click download functionality

4. **Nouvelle Demande (New Maintenance Request)**
   - Material Dialog component for request creation
   - Form fields: title, description, unit, category, priority, scheduled date
   - Full validation and type safety
   - Auto-refresh dashboard after creation

### ✅ Owner Management Features (Détails de copropriété, Gérer les travaux, créer facture, calculate distribution)

1. **Détails de copropriété (Full Property Details)**
   - Comprehensive coproperty information in owner dashboard
   - Statistics: total units, total shares, active status
   - Manager information
   - Created/updated timestamps

2. **Gérer les travaux (Manage Works/Maintenance)**
   - View all maintenance requests (already implemented)
   - Create new requests via dialog
   - Track status: Pending → Assigned → In Progress → Completed
   - Estimated vs actual costs
   - Priority and category classification

3. **Créer facture (Create Invoice)**
   - Invoice creation already implemented in `FinanceService`
   - Owner dashboard displays pending invoices table
   - Payment dialog integration (already exists)
   - Invoice status tracking

4. **Calculate Distribution**
   - Backend GraphQL mutation: `calculateChargeDistribution`
   - Distributes charges based on unit shares
   - Already implemented in `FinanceService.cs`

### ✅ Keycloak User Mapping Explanation

**Documentation:** [docs/KEYCLOAK_USER_MAPPING.md](../docs/KEYCLOAK_USER_MAPPING.md)

**Explains:**
- Why login username (`nidhalbm`) differs from display name (`Jean Martin`)
- Keycloak token structure and claims
- Frontend token processing
- How to verify and fix user mapping
- Best practices for production vs development

**Key Insight:**
Keycloak separates authentication identity (username) from profile information (display name):
```json
{
  "preferred_username": "nidhalbm",  // Login credential
  "given_name": "Jean",              // Display first name
  "family_name": "Martin"            // Display last name
}
```

## Technical Changes

### Backend (.NET/C#)

**New Files:**
- `Models/Assembly.cs` - Assembly and AssemblyAttendance models
- `Infrastructure/Repositories/AssemblyRepository.cs` - Assembly data access
- `Services/AssemblyService.cs` - Assembly business logic
- `GraphQL/Queries/AssemblyQueries.cs` - GraphQL query resolvers
- `GraphQL/Mutations/AssemblyMutations.cs` - GraphQL mutation resolvers

**Modified Files:**
- `Infrastructure/Data/CopropertyDbContext.cs` - Added Assembly DbSets and configuration
- `Program.cs` - Registered Assembly services and GraphQL types

**Database:**
- New tables: `Assemblies`, `AssemblyAttendances`
- Indexes on: `CopropertyId`, `MeetingDate`, `Status`

### Frontend (Angular/TypeScript)

**New Components:**
- `owner-assemblies.component.ts` - Meeting/agenda viewing with calendar export
- `new-maintenance-request-dialog.component.ts` - Request creation dialog

**Updated Components:**
- `owner-dashboard.component.ts` - Enhanced with assemblies section and tabs

**New Services:**
- `assembly.service.ts` - Assembly GraphQL operations

**New GraphQL:**
- `graphql/queries/assembly.queries.ts` - GET_ASSEMBLIES, GET_UPCOMING_ASSEMBLIES
- `graphql/mutations/assembly.mutations.ts` - CREATE_ASSEMBLY, UPDATE_ASSEMBLY, etc.

**Updated Models:**
- `models/assembly.model.ts` - Full Assembly type definitions with enums

### Scripts

**New Scripts:**
- `scripts/db-add-assembly-migration.sh` - Create EF Core migrations
- `scripts/db-update-coproperty.sh` - Apply database migrations

**Usage:**
```bash
./scripts/db-add-assembly-migration.sh
./scripts/db-update-coproperty.sh
```

### Documentation

**New Documentation:**
- `docs/KEYCLOAK_USER_MAPPING.md` - Comprehensive Keycloak explanation
- `docs/COPROPERTY_OWNER_ACTIONS_IMPLEMENTATION.md` - Full implementation guide

## Testing Instructions

### 1. Database Setup

```bash
# Apply migrations
./scripts/db-add-assembly-migration.sh
./scripts/db-update-coproperty.sh
```

### 2. Start Services

```bash
docker-compose up -d
```

### 3. Test Owner Dashboard

1. Navigate to `http://localhost:4200`
2. Login as owner user (e.g., `nidhalbm`)
3. Go to "My Properties" / Owner Dashboard

**Expected Results:**
- ✅ See owned units in "My Units" section
- ✅ View pending invoices
- ✅ See maintenance requests
- ✅ View upcoming assemblies/meetings

### 4. Test Add to Calendar

1. Find an upcoming assembly in the dashboard
2. Click "Add to Calendar" button
3. ICS file downloads
4. Open with calendar application

**Expected Result:**
- ✅ Calendar event created with meeting details

### 5. Test Create Maintenance Request

1. Click "New Request" button in maintenance section
2. Fill in form:
   - Title: "Test Request"
   - Description: "Testing maintenance creation"
   - Category: PLUMBING
   - Priority: NORMAL
3. Click "Submit Request"

**Expected Results:**
- ✅ Dialog closes
- ✅ Request appears in maintenance list
- ✅ GraphQL mutation succeeds

### 6. Test GraphQL API

Navigate to `http://localhost:5003/graphql`

**Test Query:**
```graphql
query TestAssemblies {
  getUpcomingAssemblies(copropertyId: "your-id-here") {
    id
    title
    meetingDate
    agenda
  }
}
```

**Test Mutation:**
```graphql
mutation TestCreateAssembly {
  createAssembly(assembly: {
    copropertyId: "your-id-here"
    title: "Test Meeting"
    meetingDate: "2026-03-01T14:00:00Z"
    assemblyType: ORDINARY
  }) {
    id
    title
  }
}
```

## Breaking Changes

**None.** All changes are additive:
- New database tables (backward compatible)
- New GraphQL types (existing queries still work)
- New frontend components (don't affect existing routes)

## Migration Guide

### For Existing Installations

1. **Backup database:**
```bash
pg_dump coproperty_db > backup_$(date +%Y%m%d).sql
```

2. **Pull changes:**
```bash
git fetch origin
git checkout feature/coproperty-owner-actions
```

3. **Run migrations:**
```bash
./scripts/db-add-assembly-migration.sh
./scripts/db-update-coproperty.sh
```

4. **Rebuild services:**
```bash
docker-compose build coproperty-service
docker-compose up -d
```

5. **Verify:**
```bash
docker-compose logs -f coproperty-service
```

## Rollback Plan

If issues occur:

1. **Database rollback:**
```bash
cd src/services/coproperty-management/Myb.Coproperty
dotnet ef database update PreviousMigration
```

2. **Code rollback:**
```bash
git checkout main
docker-compose down
docker-compose up -d
```

## Code Quality

### TypeScript
- ✅ No compilation errors
- ✅ Strict type checking enabled
- ✅ All imports properly typed
- ✅ Signal-based reactivity (Angular 21)

### C#
- ✅ Nullable reference types enabled
- ✅ EF Core best practices followed
- ✅ Repository pattern implemented
- ✅ Service layer separation

### GraphQL
- ✅ Input types for mutations
- ✅ Proper error handling
- ✅ Type safety with HotChocolate

## Performance Considerations

- Database indexes on frequently queried columns
- GraphQL `fetchPolicy: 'network-only'` for fresh data
- Lazy loading for dialogs (reduces initial bundle size)
- Efficient queries with `.Include()` for related data

## Security

- Owner can only access their own units
- Assembly viewing restricted to coproperty members
- Input validation on all forms
- GraphQL authentication (existing infrastructure)

## Screenshots/Demo

(Add screenshots here when available)

## Related Issues

Resolves tasks from [prompt.md](../prompt.md):
- ✅ Complete coproperty owner actions (Détails, voir ordre de jours, ajouter aux calendrier, Nouvelle Demande)
- ✅ Complete owner management features (Détails de copropriété, Gérer les travaux, créer facture, calculate distribution)
- ✅ Explain Keycloak user mapping (why nidhalbm shows as Jean Martin)

## Next Steps (Future Enhancements)

1. Email notifications for new assemblies
2. Real-time updates via WebSocket
3. PDF export for agendas and minutes
4. E-voting functionality for assemblies
5. Document attachments for meetings
6. Multi-language support (i18n)
7. Google Calendar API direct integration

## Checklist

- [x] All requested features implemented
- [x] Backend GraphQL operations created
- [x] Frontend components and services added
- [x] Database migrations scripts created
- [x] Keycloak documentation written
- [x] Implementation guide documented
- [x] No compilation errors
- [x] Code follows project conventions
- [x] Git commits are clear and descriptive
- [x] Ready for code review

## Review Focus Areas

1. **Assembly Model Design** - Does the structure support future features?
2. **ICS Calendar Format** - Is the format standards-compliant?
3. **GraphQL Schema** - Are the types well-designed?
4. **Keycloak Explanation** - Is it clear and accurate?
5. **Database Indexes** - Are they optimal for queries?

---

**Branch:** `feature/coproperty-owner-actions`  
**Author:** GitHub Copilot  
**Date:** February 3, 2026  
**Status:** Ready for Review ✅
