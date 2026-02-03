# Coproperty Owner Actions - Implementation Summary

## Overview

This feature branch implements complete owner portal functionality for coproperty management, including:
- View property details
- View meeting agendas (ordre de jours)
- Add meetings to calendar (ICS export)
- Create new maintenance requests (Nouvelle Demande)
- Manage works/maintenance (Gérer les travaux)
- View and pay invoices (créer facture)
- Calculate cost distributions

## Features Implemented

### 1. Assembly/Meetings Management (Backend)

**New Models:**
- `Assembly`: Represents general assembly meetings
- `AssemblyAttendance`: Tracks meeting attendance
- Enums: `AssemblyType` (Ordinary/Extraordinary), `AssemblyStatus`

**Files Created:**
- [Models/Assembly.cs](../src/services/coproperty-management/Myb.Coproperty/Models/Assembly.cs)
- [Infrastructure/Repositories/IAssemblyRepository.cs](../src/services/coproperty-management/Myb.Coproperty/Infrastructure/Repositories/IAssemblyRepository.cs)
- [Infrastructure/Repositories/AssemblyRepository.cs](../src/services/coproperty-management/Myb.Coproperty/Infrastructure/Repositories/AssemblyRepository.cs)
- [Services/AssemblyService.cs](../src/services/coproperty-management/Myb.Coproperty/Services/AssemblyService.cs)
- [GraphQL/Queries/AssemblyQueries.cs](../src/services/coproperty-management/Myb.Coproperty/GraphQL/Queries/AssemblyQueries.cs)
- [GraphQL/Mutations/AssemblyMutations.cs](../src/services/coproperty-management/Myb.Coproperty/GraphQL/Mutations/AssemblyMutations.cs)

**GraphQL Operations:**
```graphql
# Queries
getAssemblies(copropertyId: UUID!): [Assembly!]!
getUpcomingAssemblies(copropertyId: UUID!): [Assembly!]!
getAssemblyById(id: UUID!): Assembly

# Mutations
createAssembly(assembly: AssemblyInput!): Assembly!
updateAssembly(id: UUID!, assembly: AssemblyInput!): Assembly!
updateAssemblyStatus(id: UUID!, status: AssemblyStatus!): Assembly!
deleteAssembly(id: UUID!): Boolean!
```

**Database Changes:**
- DbContext updated with `Assemblies` and `AssemblyAttendances` DbSets
- EF Core configuration for new entities
- Migration scripts created

### 2. Assembly/Meetings Management (Frontend)

**New Components:**
- [owner-assemblies.component.ts](../src/front/myb.front/libs/coproperty-module/src/lib/components/owner-portal/owner-assemblies.component.ts)
  - Displays upcoming and past meetings
  - View agenda details
  - Add to calendar (ICS download)
  - View minutes

**New Services:**
- [assembly.service.ts](../src/front/myb.front/libs/coproperty-module/src/lib/services/assembly.service.ts)

**GraphQL Integration:**
- [assembly.queries.ts](../src/front/myb.front/libs/coproperty-module/src/lib/graphql/queries/assembly.queries.ts)
- [assembly.mutations.ts](../src/front/myb.front/libs/coproperty-module/src/lib/graphql/mutations/assembly.mutations.ts)

**Model Updates:**
- [assembly.model.ts](../src/front/myb.front/libs/coproperty-module/src/lib/models/assembly.model.ts) - Enhanced with full types

### 3. Maintenance Request Creation

**New Component:**
- [new-maintenance-request-dialog.component.ts](../src/front/myb.front/libs/coproperty-module/src/lib/components/owner-portal/new-maintenance-request-dialog.component.ts)
  - Material Dialog for creating requests
  - Form validation
  - Unit selection
  - Category and priority selection
  - Optional scheduling

**Features:**
- Fully typed with MaintenanceRequestExtended interface
- Reactive forms with validation
- Integration with existing maintenance service
- Auto-refresh on creation

### 4. Owner Dashboard Enhancements

**Updated Component:**
- [owner-dashboard.component.ts](../src/front/myb.front/libs/coproperty-module/src/lib/components/owner-portal/owner-dashboard.component.ts)

**New Features:**
- Assembly/meetings section with OwnerAssembliesComponent
- "New Request" button opens dialog
- Primary coproperty ID tracking
- Material Tabs for better organization

**Sections:**
1. My Units - property ownership details
2. Pending Invoices - payment management
3. Payment History - transaction records
4. Maintenance Requests - work orders
5. Assemblies/Meetings - agenda and calendar

### 5. Calendar Integration

**ICS File Generation:**
- Implemented in `OwnerAssembliesComponent.addToCalendar()`
- Standards-compliant iCalendar format
- Includes: title, date/time, location, description
- Auto-download functionality

**Format:**
```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MYB Coproperty//EN
BEGIN:VEVENT
DTSTART:20260210T140000
DTEND:20260210T160000
SUMMARY:General Assembly Meeting
LOCATION:Conference Room A
DESCRIPTION:Discuss annual budget and maintenance
END:VEVENT
END:VCALENDAR
```

### 6. Existing Features Enhanced

**Invoice Management:**
- Already implemented in owner dashboard
- Payment dialog integration
- Status tracking (Pending, Paid, Overdue)

**Cost Distribution:**
- Implemented in FinanceService backend
- GraphQL mutation: `calculateChargeDistribution`
- Distributes charges based on shares

**Property Details:**
- Unit information display
- Ownership percentage
- Share calculation

## GraphQL Schema Additions

### Assembly Types

```graphql
type Assembly {
  id: UUID!
  copropertyId: UUID!
  title: String!
  meetingDate: DateTime!
  location: String
  agenda: String
  minutes: String
  assemblyType: AssemblyType!
  status: AssemblyStatus!
  isActive: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
  attendances: [AssemblyAttendance!]
}

type AssemblyAttendance {
  id: UUID!
  assemblyId: UUID!
  ownerId: UUID!
  isPresent: Boolean!
  hasProxy: Boolean!
  proxyHolderName: String
  checkInTime: DateTime
  createdAt: DateTime!
}

enum AssemblyType {
  ORDINARY
  EXTRAORDINARY
}

enum AssemblyStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

input AssemblyInput {
  copropertyId: UUID
  title: String!
  meetingDate: DateTime!
  location: String
  agenda: String
  assemblyType: AssemblyType
}
```

## Database Schema Changes

### New Tables

**Assemblies:**
```sql
CREATE TABLE "Assemblies" (
    "Id" UUID PRIMARY KEY,
    "CopropertyId" UUID NOT NULL,
    "Title" VARCHAR(200) NOT NULL,
    "MeetingDate" TIMESTAMP NOT NULL,
    "Location" VARCHAR(500),
    "Agenda" VARCHAR(5000),
    "Minutes" VARCHAR(10000),
    "AssemblyType" VARCHAR(50) NOT NULL,
    "Status" VARCHAR(50) NOT NULL,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("CopropertyId") REFERENCES "Coproperties"("Id") ON DELETE CASCADE
);

CREATE INDEX "IX_Assemblies_CopropertyId" ON "Assemblies" ("CopropertyId");
CREATE INDEX "IX_Assemblies_MeetingDate" ON "Assemblies" ("MeetingDate");
CREATE INDEX "IX_Assemblies_Status" ON "Assemblies" ("Status");
```

**AssemblyAttendances:**
```sql
CREATE TABLE "AssemblyAttendances" (
    "Id" UUID PRIMARY KEY,
    "AssemblyId" UUID NOT NULL,
    "OwnerId" UUID NOT NULL,
    "IsPresent" BOOLEAN NOT NULL DEFAULT FALSE,
    "HasProxy" BOOLEAN NOT NULL DEFAULT FALSE,
    "ProxyHolderName" VARCHAR(200),
    "CheckInTime" TIMESTAMP,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("AssemblyId") REFERENCES "Assemblies"("Id") ON DELETE CASCADE
);

CREATE INDEX "IX_AssemblyAttendances_AssemblyId" ON "AssemblyAttendances" ("AssemblyId");
CREATE INDEX "IX_AssemblyAttendances_OwnerId" ON "AssemblyAttendances" ("OwnerId");
```

## Scripts Created

### 1. Database Migration Scripts

**[scripts/db-add-assembly-migration.sh](../scripts/db-add-assembly-migration.sh)**
- Creates EF Core migration for Assembly tables
- Usage: `./scripts/db-add-assembly-migration.sh`

**[scripts/db-update-coproperty.sh](../scripts/db-update-coproperty.sh)**
- Applies pending migrations to coproperty database
- Usage: `./scripts/db-update-coproperty.sh`

### Running Migrations

```bash
# Navigate to project root
cd /Volumes/NidhalSSD/Projects/myb

# Create migration
./scripts/db-add-assembly-migration.sh

# Apply migration
./scripts/db-update-coproperty.sh
```

## Testing the Features

### 1. View Assemblies/Agendas

```bash
# Start the application
docker-compose up -d

# Navigate to owner portal
http://localhost:4200/coproperty/owner
```

**Test Steps:**
1. Login as an owner (e.g., `nidhalbm`)
2. Navigate to "My Properties" dashboard
3. Scroll to "Assemblies/Meetings" section
4. View upcoming meetings

### 2. Add to Calendar

**Test Steps:**
1. Find an upcoming assembly
2. Click "Add to Calendar" button
3. ICS file downloads automatically
4. Open with calendar app (Google Calendar, Outlook, etc.)

### 3. Create Maintenance Request

**Test Steps:**
1. In owner dashboard, find "My Maintenance Requests" section
2. Click "New Request" button
3. Fill in the form:
   - Title: "Fix leaking faucet"
   - Description: "Kitchen faucet is leaking"
   - Unit: Select from dropdown
   - Category: Plumbing
   - Priority: Normal
4. Click "Submit Request"
5. Request appears in the list

### 4. View Property Details

**Test Steps:**
1. View "My Units" section
2. See unit number, shares, area, floor
3. Check ownership percentage

### 5. View and Pay Invoices

**Test Steps:**
1. View "Pending Invoices" table
2. Click "Pay Now" button
3. Complete payment in dialog

## GraphQL Testing

### Sample Queries

**Get Upcoming Assemblies:**
```graphql
query GetUpcomingAssemblies {
  getUpcomingAssemblies(copropertyId: "your-coproperty-id") {
    id
    title
    meetingDate
    location
    agenda
    assemblyType
    status
  }
}
```

**Create Assembly:**
```graphql
mutation CreateAssembly {
  createAssembly(assembly: {
    copropertyId: "your-coproperty-id"
    title: "Annual General Meeting 2026"
    meetingDate: "2026-03-15T14:00:00Z"
    location: "Conference Room A"
    agenda: "1. Budget Review\n2. Maintenance Plans\n3. Elections"
    assemblyType: ORDINARY
  }) {
    id
    title
    meetingDate
  }
}
```

**Create Maintenance Request:**
```graphql
mutation CreateMaintenanceRequest {
  createMaintenanceRequestWithDates(requestInput: {
    copropertyId: "your-coproperty-id"
    title: "Heating System Repair"
    description: "Heating not working in unit 12"
    category: HEATING
    priority: HIGH
    status: PENDING
    requestedBy: "user-id"
  }) {
    id
    title
    status
    createdAt
  }
}
```

## Keycloak User Mapping

**Documentation:** [docs/KEYCLOAK_USER_MAPPING.md](./KEYCLOAK_USER_MAPPING.md)

### Summary

**Why `nidhalbm` shows as "Jean Martin":**

Keycloak separates:
1. **Authentication identity** (username: `nidhalbm`)
2. **Profile information** (display name: Jean Martin)

**Token Claims:**
```json
{
  "preferred_username": "nidhalbm",  // Login username
  "given_name": "Jean",              // Display first name
  "family_name": "Martin"            // Display last name
}
```

**Frontend Usage:**
```typescript
// From token
firstName: keycloakToken.given_name  // "Jean"
lastName: keycloakToken.family_name  // "Martin"
// Displayed as: "Jean Martin"
```

**To Fix:** Update Keycloak user profile fields to match desired display name.

## Architecture Decisions

### 1. Assembly Model Design

**Why separate Assembly and AssemblyAttendance:**
- Supports attendance tracking
- Enables proxy voting
- Allows check-in timestamps
- Maintains historical records

### 2. ICS Calendar Format

**Why ICS over direct calendar API:**
- Universal compatibility (Google, Outlook, Apple)
- No API authentication required
- Works offline
- User controls which calendar

### 3. Material Dialog for Maintenance Requests

**Why dialog instead of page:**
- Faster interaction
- Maintains context
- Responsive design
- Better UX for simple forms

### 4. GraphQL Service Layer

**Why GraphQL over REST:**
- Single endpoint
- Type safety
- Efficient data fetching
- Frontend flexibility

## File Structure

```
myb/
├── docs/
│   └── KEYCLOAK_USER_MAPPING.md          # New: Keycloak explanation
├── scripts/
│   ├── db-add-assembly-migration.sh      # New: Create migration
│   └── db-update-coproperty.sh           # New: Apply migration
├── src/
│   ├── front/myb.front/libs/coproperty-module/
│   │   ├── components/owner-portal/
│   │   │   ├── owner-assemblies.component.ts            # New
│   │   │   ├── new-maintenance-request-dialog.component.ts  # New
│   │   │   └── owner-dashboard.component.ts             # Updated
│   │   ├── graphql/
│   │   │   ├── queries/assembly.queries.ts              # New
│   │   │   └── mutations/assembly.mutations.ts          # New
│   │   ├── models/
│   │   │   └── assembly.model.ts                        # Updated
│   │   └── services/
│   │       └── assembly.service.ts                      # New
│   └── services/coproperty-management/Myb.Coproperty/
│       ├── Models/
│       │   └── Assembly.cs                              # New
│       ├── Infrastructure/
│       │   ├── Data/CopropertyDbContext.cs              # Updated
│       │   └── Repositories/
│       │       ├── IAssemblyRepository.cs               # New
│       │       └── AssemblyRepository.cs                # New
│       ├── Services/
│       │   └── AssemblyService.cs                       # New
│       ├── GraphQL/
│       │   ├── Queries/AssemblyQueries.cs               # New
│       │   └── Mutations/AssemblyMutations.cs           # New
│       └── Program.cs                                   # Updated
```

## Dependencies

### Backend
- EF Core (migrations)
- HotChocolate GraphQL
- PostgreSQL database

### Frontend
- Angular 21
- Apollo Angular (GraphQL client)
- Angular Material (UI components)
- RxJS (reactive programming)

## Performance Considerations

### Backend
- Indexed columns: CopropertyId, MeetingDate, Status
- Eager loading with `.Include()` for related data
- Pagination ready (can add `skip`/`take` parameters)

### Frontend
- Signal-based reactivity (Angular 21)
- `fetchPolicy: 'network-only'` for fresh data
- Lazy loading for dialogs
- Optimistic UI updates

## Security

### Access Control
- Owner can only see their own units
- Owner can only create requests for their units
- Assembly viewing restricted to coproperty members

### Data Validation
- Required fields enforced
- Date/time validation
- Category/Priority/Status enums (type-safe)

## Known Limitations & Future Improvements

### Current Limitations
1. Calendar integration is download-only (no sync)
2. No email notifications for new assemblies
3. No real-time updates (requires refresh)
4. Single language (French labels hardcoded)

### Planned Improvements
1. WebSocket for real-time updates
2. Email/SMS notifications
3. Google Calendar API integration
4. Multi-language support (i18n)
5. PDF export for agendas and minutes
6. E-voting for assemblies
7. Document attachments for assemblies

## Migration Path

### For Existing Installations

1. **Stop Services:**
```bash
docker-compose down
```

2. **Pull Latest Code:**
```bash
git checkout feature/coproperty-owner-actions
git pull
```

3. **Run Migrations:**
```bash
./scripts/db-add-assembly-migration.sh
./scripts/db-update-coproperty.sh
```

4. **Rebuild and Restart:**
```bash
docker-compose build coproperty-service
docker-compose up -d
```

5. **Verify:**
- Check logs: `docker-compose logs -f coproperty-service`
- Test GraphQL: Navigate to `http://localhost:5003/graphql`

## Support & Troubleshooting

### Common Issues

**Issue:** Migration fails with "pending model changes"
**Solution:** Database and model are out of sync. Create and apply migration.

**Issue:** Calendar download doesn't work
**Solution:** Check browser's download settings and popup blockers.

**Issue:** Can't create maintenance request
**Solution:** Verify user has associated units. Check GraphQL errors in browser console.

### Debugging

**Enable verbose logging:**
```json
// appsettings.Development.json
{
  "Logging": {
    "LogLevel": {
      "Myb.Coproperty": "Debug"
    }
  }
}
```

**Check GraphQL Schema:**
```bash
curl http://localhost:5003/graphql?sdl
```

## Conclusion

This implementation provides a complete owner portal experience with:
- ✅ Meeting/agenda viewing
- ✅ Calendar integration
- ✅ Maintenance request creation
- ✅ Property details
- ✅ Invoice management
- ✅ Cost distribution calculation

All features are production-ready, type-safe, and follow Angular/ASP.NET best practices.

---

**Branch:** `feature/coproperty-owner-actions`
**Last Updated:** February 3, 2026
**Status:** Ready for Review
