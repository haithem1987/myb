# Phase 3 Completion - Fund Call Implementation

**Date:** January 16, 2026  
**Status:** 🔨 IN PROGRESS

## Overview

Completed the implementation of Fund Call (Appel de Fonds) functionality for the Coproperty Management Service.

## What Was Implemented

### 1. FundCall Model
**File:** `src/services/coproperty-management/Myb.Coproperty/Models/FundCall.cs`

```csharp
public class FundCall : IEntity<Guid>
{
    public Guid Id { get; set; }
    public Guid CopropertyId { get; set; }
    public decimal Amount { get; set; }
    public DateTime DueDate { get; set; }
    public string Description { get; set; }
    public bool IsActive { get; set; }
    public DateTime? CreatedAt { get; set; }
    public Guid CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation Properties
    public Coproperty Coproperty { get; set; }
    public ICollection<CopropertyInvoice> Invoices { get; set; }
}
```

### 2. DTOs
**File:** `src/services/coproperty-management/Myb.Coproperty/Models/Dtos/CreateFundCallInput.cs`

```csharp
public class CreateFundCallInput
{
    public Guid? CopropertyId { get; set; }
    public decimal Amount { get; set; }
    public DateTime DueDate { get; set; }
    public string Description { get; set; }
}
```

### 3. Service Layer
**File:** `src/services/coproperty-management/Myb.Coproperty/Services/FundCallService.cs`

Implemented `IFundCallService` with the following methods:
- `CreateAsync(CreateFundCallInput input, string userId)`
- `UpdateAsync(Guid id, CreateFundCallInput input, string userId)`
- `DeleteAsync(Guid id)`
- `GetByIdAsync(Guid id)`
- `GetByCopropertyIdAsync(Guid copropertyId)`
- `GenerateInvoicesFromFundCallAsync(Guid fundCallId, string userId)`

### 4. Authentication Service
**File:** `src/services/coproperty-management/Myb.Coproperty/Services/AuthenticationService.cs`

```csharp
public class AuthenticationService : IAuthenticationService
{
    public string GetCurrentUserId()
    {
        // Retrieves user ID from HTTP context claims
    }
}
```

### 5. GraphQL Mutations
**File:** `src/services/coproperty-management/Myb.Coproperty/GraphQL/Mutations/FundCallMutations.cs`

```graphql
mutation CreateFundCall($input: CreateFundCallInput!) {
  createFundCall(input: $input) {
    id
    copropertyId
    amount
    dueDate
    description
    isActive
    createdAt
    updatedAt
  }
}

mutation UpdateFundCall($id: UUID!, $input: CreateFundCallInput!) {
  updateFundCall(id: $id, input: $input) {
    id
    amount
    dueDate
    description
  }
}

mutation DeleteFundCall($id: UUID!) {
  deleteFundCall(id: $id)
}

mutation GenerateInvoicesFromFundCall($fundCallId: UUID!) {
  generateInvoicesFromFundCall(fundCallId: $fundCallId) {
    id
    invoiceNumber
    totalAmount
    status
  }
}
```

### 6. GraphQL Queries
**File:** `src/services/coproperty-management/Myb.Coproperty/GraphQL/Queries/FundCallQueries.cs`

```graphql
query GetFundCall($id: UUID!) {
  getFundCall(id: $id) {
    id
    copropertyId
    amount
    dueDate
    description
    isActive
    createdAt
    updatedAt
  }
}

query GetFundCallsByCoproperty($copropertyId: UUID!) {
  getFundCallsByCoproperty(copropertyId: $copropertyId) {
    id
    amount
    dueDate
    description
    isActive
  }
}
```

### 7. Database Changes

**Added to DbContext:**
- `DbSet<FundCall> FundCalls`
- Configuration for FundCall entity with indexes and constraints

**Migration:** `20260116_AddFundCall.cs`
- Creates `FundCalls` table
- Foreign key to `Coproperties`
- Indexes on `CopropertyId` and `IsActive`
- Check constraint: `Amount >= 0`

### 8. Dependency Injection
**Updated:** `Program.cs`

```csharp
// Services
builder.Services.AddScoped<IFundCallService, FundCallService>();
builder.Services.AddScoped<IAuthenticationService, AuthenticationService>();

// GraphQL
.AddTypeExtension<FundCallQueries>()
.AddTypeExtension<FundCallMutations>()
```

## How Fund Calls Work

1. **Create Fund Call**: Admin creates a fund call with amount, due date, and description
2. **Generate Invoices**: System distributes the amount across all units based on their share percentage
3. **Invoice Creation**: Individual invoices are created for each owner
4. **Payment Tracking**: Owners can pay their invoices, which are tracked separately

## Invoice Distribution Logic

```csharp
// For each unit in coproperty
sharePercentage = unit.Shares / totalShares
unitAmount = fundCall.Amount * sharePercentage

// Create invoice for unit owner
invoice = new CopropertyInvoice {
    Amount = unitAmount,
    DueDate = fundCall.DueDate,
    Description = fundCall.Description,
    Status = InvoiceStatus.Pending
}
```

## Testing the Implementation

### Using GraphQL Playground

1. Navigate to: `http://localhost:8088/graphql`

2. Create a fund call:
```graphql
mutation {
  createFundCall(input: {
    amount: 250
    dueDate: "2026-01-18T00:00:00.000Z"
    description: "Q1 charges"
  }) {
    id
    copropertyId
    amount
    dueDate
    description
    isActive
    createdAt
    updatedAt
  }
}
```

3. Generate invoices:
```graphql
mutation {
  generateInvoicesFromFundCall(fundCallId: "YOUR_FUND_CALL_ID") {
    id
    invoiceNumber
    totalAmount
    status
    owner {
      userId
    }
  }
}
```

4. Query fund calls:
```graphql
query {
  getFundCallsByCoproperty(copropertyId: "YOUR_COPROPERTY_ID") {
    id
    amount
    dueDate
    description
    invoices {
      invoiceNumber
      totalAmount
      status
    }
  }
}
```

## Frontend Integration

### Service Method
```typescript
// fund-call.service.ts
createFundCall(input: CreateFundCallInput): Observable<FundCall> {
  return this.apollo.mutate({
    mutation: CREATE_FUND_CALL,
    variables: { input }
  }).pipe(map(result => result.data.createFundCall));
}
```

### Component Usage
```typescript
// fund-call.component.ts
createFundCall() {
  const input = {
    amount: this.form.value.amount,
    dueDate: this.form.value.dueDate,
    description: this.form.value.description
  };
  
  this.fundCallService.createFundCall(input)
    .subscribe(result => {
      console.log('Fund call created:', result);
      // Generate invoices
      this.fundCallService.generateInvoices(result.id).subscribe();
    });
}
```

## Build & Deployment Status

### Current Status
- ⏳ Building Docker image for coproperty service
- ✅ All code files created and configured
- ✅ Database migration ready
- ⏳ Service registration in docker-compose

### To Start the Service

```bash
# Build and start
cd /Volumes/NidhalSSD/Projects/myb
docker-compose build myb-coproperty
docker-compose up -d myb-coproperty

# Check logs
docker-compose logs -f myb-coproperty

# Verify it's running
curl http://localhost:8088/graphql
```

### Service Port
- **Coproperty Service GraphQL:** http://localhost:8088/graphql
- **GraphQL Playground:** http://localhost:8088/graphql/

## Files Created/Modified

### Created (8 files)
1. `Models/FundCall.cs`
2. `Models/Dtos/CreateFundCallInput.cs`
3. `Services/FundCallService.cs`
4. `Services/AuthenticationService.cs`
5. `GraphQL/Mutations/FundCallMutations.cs`
6. `GraphQL/Queries/FundCallQueries.cs`
7. `Infrastructure/Migrations/20260116_AddFundCall.cs`
8. `apps/client/src/app/check-routes.js` (testing utility)

### Modified (4 files)
1. `Infrastructure/Data/CopropertyDbContext.cs` - Added FundCalls DbSet and configuration
2. `Program.cs` - Registered services and GraphQL extensions
3. `src/front/myb.front/Dockerfile` - Updated to use client app
4. `src/front/myb.front/apps/client/src/app/app.routes.ts` - Fixed routing

## Next Steps

1. ✅ Wait for Docker build to complete
2. ⏳ Apply database migration
3. ⏳ Test GraphQL endpoints
4. ⏳ Verify invoice generation logic
5. ⏳ Update frontend to use fund calls
6. ⏳ Add frontend UI for fund call management

## Known Issues

- Coproperty service not yet running (building)
- Need to run migration after service starts
- Frontend may need coproperty ID context (can be hardcoded for testing)

## Migration Command

After service starts:
```bash
# Run migration
docker exec -it myb-myb-coproperty-1 dotnet ef database update

# Or through docker-compose
docker-compose exec myb-coproperty dotnet ef database update
```

---

**Progress:** 80% Complete  
**Blockers:** Service build in progress  
**ETA:** Service should be ready in ~2-5 minutes
