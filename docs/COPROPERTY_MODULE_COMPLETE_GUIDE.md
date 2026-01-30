# Coproperty Module - Complete Implementation Guide

## 📋 Overview

The Coproperty Management module is now **fully implemented** on the frontend with comprehensive GraphQL service integration. This document provides a complete guide to understanding and using the module.

---

## ✅ What's Been Implemented

### 1. **Frontend Components** (100% Complete)

#### Dashboard Component
- **Location**: `libs/coproperty-module/src/lib/components/coproperty-dashboard/`
- **Route**: `/coproperty`
- **Features**:
  - Quick navigation cards with gradient backgrounds
  - Statistics overview
  - Links to list, create, fund calls, and assemblies
  - Responsive Material Design-inspired UI

#### List Component
- **Location**: `libs/coproperty-module/src/lib/components/coproperty-list/`
- **Route**: `/coproperty/list`
- **Features**:
  - Card-based grid layout
  - View and edit actions
  - Responsive design
  - Loading states
  - Empty state handling

#### Unit Management Component
- **Location**: `libs/coproperty-module/src/lib/components/unit-management/`
- **Route**: `/coproperty/:id/units`
- **Features**:
  - Full CRUD operations (Create, Read, Update, Delete)
  - Support for 5 unit types: Apartment, Parking, Cave, Commercial, Other
  - Owner information tracking
  - Occupancy status management
  - Shares and area tracking
  - Reactive forms with validation
  - Signal-based state management

#### Charge Management Component
- **Location**: `libs/coproperty-module/src/lib/components/charge-management/`
- **Route**: `/coproperty/:id/charges`
- **Features**:
  - Full CRUD operations for charges
  - 7 charge types: Cleaning, Security, Maintenance, Electricity, Water, Insurance, Other
  - 4 frequency options: Monthly, Quarterly, Annual, Exceptional
  - 4 distribution methods: By Shares, By Area, Equal, Custom
  - Charge distribution calculator
  - Distribution preview modal
  - Reactive forms with validation

#### Maintenance Requests Component
- **Location**: `libs/coproperty-module/src/lib/components/maintenance-requests/`
- **Route**: `/coproperty/:id/maintenance`
- **Features**:
  - Full CRUD operations for maintenance requests
  - 7 categories: Plumbing, Electrical, Heating, Elevator, Roof, Facade, Other
  - 4 priority levels: Low, Normal, High, Emergency
  - 5 status types: Pending, Assigned, In Progress, Completed, Cancelled
  - Status update functionality
  - Filter by status and priority
  - Cost tracking (estimated and actual)
  - Work scheduling

---

## 🔧 Services Layer

### UnitService
**Location**: `libs/coproperty-module/src/lib/services/unit.service.ts`

```typescript
export interface Unit {
  id?: number;
  copropertyId: number;
  unitNumber: string;
  floor: number;
  type: 'APARTMENT' | 'PARKING' | 'CAVE' | 'COMMERCIAL' | 'OTHER';
  area: number;
  shares: number;
  ownerName: string;
  ownerEmail?: string;
  ownerPhone?: string;
  isOccupied: boolean;
  rentedTo?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
```

**Methods**:
- `getAllUnits(): Observable<Unit[]>`
- `getUnitById(id: number): Observable<Unit>`
- `getUnitsByCoproperty(copropertyId: number): Observable<Unit[]>`
- `createUnit(unit: Unit): Observable<Unit>`
- `updateUnit(unit: Unit): Observable<Unit>`
- `deleteUnit(id: number): Observable<boolean>`

### ChargeService
**Location**: `libs/coproperty-module/src/lib/services/charge.service.ts`

```typescript
export interface Charge {
  id?: number;
  copropertyId: number;
  name: string;
  description?: string;
  chargeType: 'CLEANING' | 'SECURITY' | 'MAINTENANCE' | 'ELECTRICITY' | 'WATER' | 'INSURANCE' | 'OTHER';
  frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'EXCEPTIONAL';
  totalAmount: number;
  distributionMethod: 'BY_SHARES' | 'BY_AREA' | 'EQUAL' | 'CUSTOM';
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ChargeDistribution {
  unitId: number;
  unitNumber: string;
  amount: number;
  shares?: number;
  area?: number;
}
```

**Methods**:
- `getAllCharges(): Observable<Charge[]>`
- `getChargeById(id: number): Observable<Charge>`
- `getChargesByCoproperty(copropertyId: number): Observable<Charge[]>`
- `createCharge(charge: Charge): Observable<Charge>`
- `updateCharge(charge: Charge): Observable<Charge>`
- `deleteCharge(id: number): Observable<boolean>`
- `calculateDistribution(chargeId: number): Observable<ChargeDistribution[]>`

### MaintenanceService
**Location**: `libs/coproperty-module/src/lib/services/maintenance.service.ts`

```typescript
export interface MaintenanceRequest {
  id?: number;
  copropertyId: number;
  unitId?: number;
  title: string;
  description: string;
  category: 'PLUMBING' | 'ELECTRICAL' | 'HEATING' | 'ELEVATOR' | 'ROOF' | 'FACADE' | 'OTHER';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY';
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  reportedBy: string;
  assignedTo?: string;
  estimatedCost?: number;
  actualCost?: number;
  scheduledDate?: Date;
  completedDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
```

**Methods**:
- `getAllMaintenanceRequests(): Observable<MaintenanceRequest[]>`
- `getMaintenanceRequestById(id: number): Observable<MaintenanceRequest>`
- `getMaintenanceByCoproperty(copropertyId: number): Observable<MaintenanceRequest[]>`
- `getMaintenanceByStatus(copropertyId: number, status: string): Observable<MaintenanceRequest[]>`
- `createMaintenanceRequest(request: MaintenanceRequest): Observable<MaintenanceRequest>`
- `updateMaintenanceRequest(request: MaintenanceRequest): Observable<MaintenanceRequest>`
- `deleteMaintenanceRequest(id: number): Observable<boolean>`
- `updateMaintenanceStatus(id: number, status: string): Observable<MaintenanceRequest>`

---

## 📡 GraphQL Operations

### Unit Queries

```graphql
# Get all units by coproperty
query GetUnitsByCoproperty($copropertyId: Int!) {
  unitsByCoproperty(copropertyId: $copropertyId) {
    id, unitNumber, floor, type, area, shares, ownerName, 
    ownerEmail, ownerPhone, isOccupied, rentedTo
  }
}

# Get single unit
query GetUnitById($id: Int!) {
  unitById(id: $id) { ... }
}
```

### Unit Mutations

```graphql
# Create unit
mutation CreateUnit($item: UnitInput!) {
  createUnit(unit: $item) { id, unitNumber, ... }
}

# Update unit
mutation UpdateUnit($item: UnitInput!) {
  updateUnit(unit: $item) { id, unitNumber, ... }
}

# Delete unit
mutation DeleteUnit($id: Int!) {
  deleteUnit(id: $id)
}
```

### Charge Queries & Mutations

Similar patterns for charges with specific fields.

### Maintenance Queries & Mutations

Similar patterns for maintenance requests with specific fields.

---

## 🗺️ Routing

```typescript
const COPROPERTY_ROUTES: Routes = [
  {
    path: '',
    component: CopropertyDashboardComponent
  },
  {
    path: 'list',
    component: CopropertyListComponent
  },
  {
    path: 'new',
    component: CopropertyFormComponent
  },
  {
    path: ':id',
    component: CopropertyDetailComponent
  },
  {
    path: ':id/edit',
    component: CopropertyFormComponent
  },
  {
    path: ':id/units',
    component: UnitManagementComponent
  },
  {
    path: ':id/charges',
    component: ChargeManagementComponent
  },
  {
    path: ':id/maintenance',
    component: MaintenanceRequestsComponent
  }
];
```

**Available URLs**:
- `/coproperty` - Dashboard
- `/coproperty/list` - List all coproperties
- `/coproperty/new` - Create new coproperty
- `/coproperty/:id` - View coproperty details
- `/coproperty/:id/edit` - Edit coproperty
- `/coproperty/:id/units` - Manage units
- `/coproperty/:id/charges` - Manage charges
- `/coproperty/:id/maintenance` - Manage maintenance requests

---

## 🌐 Internationalization (i18n)

All components use the TranslateModule with comprehensive English translations.

**Translation Keys**:

```json
{
  "coproperty": {
    "dashboard": { ... },
    "list": { ... },
    "units": {
      "title": "Units Management",
      "types": {
        "APARTMENT": "Apartment",
        "PARKING": "Parking",
        "CAVE": "Cave",
        "COMMERCIAL": "Commercial",
        "OTHER": "Other"
      },
      ...
    },
    "charges": {
      "title": "Charges Management",
      "types": {
        "CLEANING": "Cleaning",
        "SECURITY": "Security",
        ...
      },
      "frequencies": {
        "MONTHLY": "Monthly",
        "QUARTERLY": "Quarterly",
        ...
      },
      ...
    },
    "maintenance": {
      "title": "Maintenance Requests",
      "categories": {
        "PLUMBING": "Plumbing",
        "ELECTRICAL": "Electrical",
        ...
      },
      "priorities": {
        "LOW": "Low",
        "NORMAL": "Normal",
        "HIGH": "High",
        "EMERGENCY": "Emergency"
      },
      "statuses": {
        "PENDING": "Pending",
        "ASSIGNED": "Assigned",
        "IN_PROGRESS": "In Progress",
        "COMPLETED": "Completed",
        "CANCELLED": "Cancelled"
      },
      ...
    }
  }
}
```

---

## ⚙️ Backend Requirements (NOT YET IMPLEMENTED)

### 1. Service Setup

Create a new ASP.NET Core service following the pattern from `invoice-management`:

```bash
cd src/services
dotnet new webapi -n Myb.Coproperty
```

### 2. Required Entity Models

**Coproperty Entity**:
```csharp
public class Coproperty
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Address { get; set; }
    public int TotalUnits { get; set; }
    public decimal TotalShares { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    public ICollection<Unit> Units { get; set; }
    public ICollection<Charge> Charges { get; set; }
    public ICollection<MaintenanceRequest> MaintenanceRequests { get; set; }
}
```

**Unit Entity**:
```csharp
public class Unit
{
    public int Id { get; set; }
    public int CopropertyId { get; set; }
    public string UnitNumber { get; set; }
    public int Floor { get; set; }
    public UnitType Type { get; set; }
    public decimal Area { get; set; }
    public int Shares { get; set; }
    public string OwnerName { get; set; }
    public string OwnerEmail { get; set; }
    public string OwnerPhone { get; set; }
    public bool IsOccupied { get; set; }
    public string RentedTo { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    public Coproperty Coproperty { get; set; }
}

public enum UnitType
{
    APARTMENT,
    PARKING,
    CAVE,
    COMMERCIAL,
    OTHER
}
```

**Charge Entity**:
```csharp
public class Charge
{
    public int Id { get; set; }
    public int CopropertyId { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public ChargeType ChargeType { get; set; }
    public Frequency Frequency { get; set; }
    public decimal TotalAmount { get; set; }
    public DistributionMethod DistributionMethod { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    public Coproperty Coproperty { get; set; }
}

public enum ChargeType
{
    CLEANING, SECURITY, MAINTENANCE, ELECTRICITY, WATER, INSURANCE, OTHER
}

public enum Frequency
{
    MONTHLY, QUARTERLY, ANNUAL, EXCEPTIONAL
}

public enum DistributionMethod
{
    BY_SHARES, BY_AREA, EQUAL, CUSTOM
}
```

**MaintenanceRequest Entity**:
```csharp
public class MaintenanceRequest
{
    public int Id { get; set; }
    public int CopropertyId { get; set; }
    public int? UnitId { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public MaintenanceCategory Category { get; set; }
    public Priority Priority { get; set; }
    public MaintenanceStatus Status { get; set; }
    public string ReportedBy { get; set; }
    public string AssignedTo { get; set; }
    public decimal? EstimatedCost { get; set; }
    public decimal? ActualCost { get; set; }
    public DateTime? ScheduledDate { get; set; }
    public DateTime? CompletedDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    public Coproperty Coproperty { get; set; }
    public Unit Unit { get; set; }
}

public enum MaintenanceCategory
{
    PLUMBING, ELECTRICAL, HEATING, ELEVATOR, ROOF, FACADE, OTHER
}

public enum Priority
{
    LOW, NORMAL, HIGH, EMERGENCY
}

public enum MaintenanceStatus
{
    PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED
}
```

### 3. Repository Pattern

Implement repositories following the existing pattern:

```csharp
// IUnitRepository.cs
public interface IUnitRepository
{
    Task<Unit> GetByIdAsync(int id);
    Task<IEnumerable<Unit>> GetAllAsync();
    Task<IEnumerable<Unit>> GetByCopropertyAsync(int copropertyId);
    Task<Unit> AddAsync(Unit unit);
    Task<Unit> UpdateAsync(Unit unit);
    Task<bool> DeleteAsync(int id);
}

// Similar for IChargeRepository and IMaintenanceRequestRepository
```

### 4. Service Layer

```csharp
// IUnitService.cs
public interface IUnitService
{
    Task<Unit> GetUnitByIdAsync(int id);
    Task<IEnumerable<Unit>> GetAllUnitsAsync();
    Task<IEnumerable<Unit>> GetUnitsByCopropertyAsync(int copropertyId);
    Task<Unit> AddUnitAsync(Unit unit);
    Task<Unit> UpdateUnitAsync(Unit unit);
    Task<bool> DeleteUnitAsync(int id);
}

// Similar for IChargeService and IMaintenanceRequestService
```

### 5. GraphQL Schema (HotChocolate)

**Queries**:
```csharp
public class CopropertyQuery
{
    public async Task<IEnumerable<Unit>> GetUnitsByCoproperty(
        [Service] IUnitService unitService, 
        int copropertyId)
    {
        return await unitService.GetUnitsByCopropertyAsync(copropertyId);
    }
    
    public async Task<Unit> GetUnitById(
        [Service] IUnitService unitService, 
        int id)
    {
        return await unitService.GetUnitByIdAsync(id);
    }
    
    // Similar for Charges and MaintenanceRequests
}
```

**Mutations**:
```csharp
public class CopropertyMutation
{
    public async Task<Unit> CreateUnit(
        [Service] IUnitService unitService, 
        Unit unit)
    {
        return await unitService.AddUnitAsync(unit);
    }
    
    public async Task<Unit> UpdateUnit(
        [Service] IUnitService unitService, 
        Unit unit)
    {
        return await unitService.UpdateUnitAsync(unit);
    }
    
    public async Task<bool> DeleteUnit(
        [Service] IUnitService unitService, 
        int id)
    {
        return await unitService.DeleteUnitAsync(id);
    }
    
    // Similar for Charges and MaintenanceRequests
}
```

### 6. Database Configuration

**DbContext**:
```csharp
public class CopropertyContext : DbContext
{
    public DbSet<Coproperty> Coproperties { get; set; }
    public DbSet<Unit> Units { get; set; }
    public DbSet<Charge> Charges { get; set; }
    public DbSet<MaintenanceRequest> MaintenanceRequests { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Coproperty>()
            .HasMany(c => c.Units)
            .WithOne(u => u.Coproperty)
            .HasForeignKey(u => u.CopropertyId);
            
        modelBuilder.Entity<Coproperty>()
            .HasMany(c => c.Charges)
            .WithOne(ch => ch.Coproperty)
            .HasForeignKey(ch => ch.CopropertyId);
            
        modelBuilder.Entity<Coproperty>()
            .HasMany(c => c.MaintenanceRequests)
            .WithOne(mr => mr.Coproperty)
            .HasForeignKey(mr => mr.CopropertyId);
            
        // Indexes
        modelBuilder.Entity<Unit>()
            .HasIndex(u => u.CopropertyId);
            
        modelBuilder.Entity<Charge>()
            .HasIndex(ch => ch.CopropertyId);
            
        modelBuilder.Entity<MaintenanceRequest>()
            .HasIndex(mr => mr.CopropertyId);
    }
}
```

### 7. Docker Configuration

Add to `docker-compose.yml`:

```yaml
coproperty-service:
  build:
    context: ./src/services/coproperty-management
    dockerfile: Dockerfile
  ports:
    - "5007:8080"
  environment:
    - ASPNETCORE_ENVIRONMENT=Development
    - ConnectionStrings__CopropertyDBConnection=Host=coproperty-db;Port=5432;Database=copropertydb;Username=postgres;Password=postgres
    - Keycloak__Authority=http://keycloak:8080/realms/myb
    - Keycloak__Audience=account
  depends_on:
    - coproperty-db
    - keycloak

coproperty-db:
  image: postgres:16.2
  ports:
    - "5449:5432"
  environment:
    - POSTGRES_DB=copropertydb
    - POSTGRES_USER=postgres
    - POSTGRES_PASSWORD=postgres
  volumes:
    - coproperty-db-data:/var/lib/postgresql/data

volumes:
  coproperty-db-data:
```

---

## 🧪 Testing

### Frontend Testing (Current State)

You can test the frontend components now by running:

```bash
cd src/front/myb.front
npx nx serve admin
```

Navigate to: `http://localhost:4200/admin/coproperty`

**Note**: Components will show empty states or errors when trying to fetch data since the backend is not implemented yet.

### Full Integration Testing (After Backend Implementation)

1. Start all services:
   ```bash
   ./scripts/coproperty-dev.sh
   ```

2. Test CRUD operations:
   - Create a coproperty
   - Add units to the coproperty
   - Create charges and calculate distribution
   - Create and manage maintenance requests

---

## 📚 Useful Scripts

### Development Scripts

```bash
# Generate GraphQL services
./scripts/generate-coproperty-graphql.sh

# View implementation summary
./scripts/coproperty-implementation-summary.sh

# Complete summary with backend requirements
./scripts/coproperty-complete-summary.sh
```

### Database Scripts (After Backend Setup)

```bash
# Create migration
./scripts/db-migration.sh CopropertyService InitialCreate

# Apply migration
./scripts/db-update.sh CopropertyService

# Rollback migration
./scripts/db-rollback.sh CopropertyService

# Reset database
./scripts/db-reset.sh CopropertyService
```

---

## 🎯 Next Steps

1. **Create Backend Service**:
   - Set up ASP.NET Core project
   - Implement entity models
   - Configure Entity Framework

2. **Implement Repository Pattern**:
   - Create repository interfaces
   - Implement repository classes
   - Add dependency injection

3. **Create Service Layer**:
   - Implement service interfaces
   - Add business logic
   - Handle validations

4. **Implement GraphQL**:
   - Configure HotChocolate
   - Create queries and mutations
   - Add authorization

5. **Database Setup**:
   - Create migrations
   - Update database
   - Seed test data

6. **Integration**:
   - Update Apollo configuration
   - Register GraphQL operations in type-config.ts
   - Test end-to-end

7. **Docker Deployment**:
   - Add service to docker-compose.yml
   - Configure networking
   - Test in containerized environment

---

## 📖 Reference Documentation

- **Angular Signals**: [Angular Documentation](https://angular.io/guide/signals)
- **Reactive Forms**: [Angular Forms Guide](https://angular.io/guide/reactive-forms)
- **Apollo GraphQL**: [Apollo Client Angular](https://apollo-angular.com/)
- **HotChocolate**: [ChilliCream Documentation](https://chillicream.com/docs/hotchocolate)
- **Entity Framework Core**: [EF Core Documentation](https://docs.microsoft.com/en-us/ef/core/)

---

## 🤝 Contributing

Follow the project's coding conventions:
- **TypeScript**: camelCase for variables, PascalCase for interfaces/classes
- **C#**: PascalCase for public members, _camelCase for private fields
- **GraphQL**: camelCase for fields, PascalCase for types
- Use signals for reactive state management
- Implement comprehensive error handling
- Add loading states for async operations
- Include translations for all user-facing text

---

## 📝 License

This module is part of the MYB project and follows the project's license terms.

---

**Status**: ✅ Frontend Complete | ⏳ Backend Pending

**Last Updated**: January 2026
