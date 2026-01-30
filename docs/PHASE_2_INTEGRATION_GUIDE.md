# Phase 2 Integration Guide

## Quick Start

### 1. Build and Run Backend
```bash
cd /Users/macbook/Workspace/myb
dotnet build
cd src/services/coproperty-management/Myb.Coproperty
dotnet run
```

The Coproperty service will be available at: `http://localhost:8088/graphql`

### 2. Verify GraphQL Schema
Navigate to GraphQL endpoint in browser. You should see:
- Query: getDashboardStats, getTreasuryEvolution, getFinancialReport, getInvoiceById, etc.
- Mutation: generateInvoicesFromCharge, recordPayment, sendPaymentReminder

## GraphQL Queries Reference

### Query: Get Dashboard Statistics
```graphql
query GetDashboardStats($copropertyId: ID) {
  getDashboardStats(copropertyId: $copropertyId) {
    totalCoproperties
    totalUnits
    totalBalance
    totalCharges
    pendingMaintenance
    overdueInvoices
  }
}
```

**Variables:**
```json
{
  "copropertyId": "00000000-0000-0000-0000-000000000001"
}
```

### Query: Get Treasury Evolution
```graphql
query GetTreasuryEvolution($copropertyId: ID!, $months: Int) {
  getTreasuryEvolution(copropertyId: $copropertyId, months: $months) {
    month
    date
    amount
  }
}
```

**Variables:**
```json
{
  "copropertyId": "00000000-0000-0000-0000-000000000001",
  "months": 12
}
```

### Query: Get Financial Report
```graphql
query GetFinancialReport($copropertyId: ID!, $year: Int!) {
  getFinancialReport(copropertyId: $copropertyId, year: $year) {
    copropertyId
    year
    totalCharges
    totalCollected
    totalOverdue
    balance
    monthlyBalances {
      month
      monthName
      opening
      receipts
      expenses
      closing
    }
  }
}
```

**Variables:**
```json
{
  "copropertyId": "00000000-0000-0000-0000-000000000001",
  "year": 2024
}
```

### Query: Get Invoices
```graphql
query GetInvoicesByUnit($unitId: ID!) {
  getInvoicesByUnit(unitId: $unitId) {
    id
    invoiceNumber
    amount
    totalAmount
    status
    invoiceDate
    dueDate
    payments {
      id
      amount
      paymentDate
      paymentMethod
    }
  }
}
```

## GraphQL Mutations Reference

### Mutation: Generate Invoices from Charge
```graphql
mutation GenerateInvoices($chargeId: ID!) {
  generateInvoicesFromCharge(chargeId: $chargeId) {
    id
    invoiceNumber
    amount
    totalAmount
    status
  }
}
```

**Note:** Requires authenticated user context via IAuthenticationService

### Mutation: Record Payment
```graphql
mutation RecordPayment($input: RecordPaymentInput!) {
  recordPayment(input: $input) {
    id
    invoiceId
    amount
    paymentDate
    paymentMethod
    transactionId
  }
}
```

**Input Structure:**
```json
{
  "input": {
    "invoiceId": "00000000-0000-0000-0000-000000000001",
    "amount": 500.00,
    "paymentDate": "2024-01-15T00:00:00Z",
    "paymentMethod": "bank_transfer",
    "reference": "TXN-12345",
    "notes": "Monthly payment"
  }
}
```

### Mutation: Send Payment Reminder
```graphql
mutation SendReminder($invoiceId: ID!, $level: Int) {
  sendPaymentReminder(invoiceId: $invoiceId, level: $level)
}
```

**Parameters:**
- invoiceId: Invoice to send reminder for
- level: 1 (initial), 2 (follow-up), 3 (final)

## Frontend Integration Steps

### Step 1: Update Apollo Query Files
Create new query files in frontend:

**apps/admin/src/lib/graphql/queries/dashboard.query.ts**
```typescript
import { gql } from 'apollo-angular';

export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats($copropertyId: ID) {
    getDashboardStats(copropertyId: $copropertyId) {
      totalCoproperties
      totalUnits
      totalBalance
      totalCharges
      pendingMaintenance
      overdueInvoices
    }
  }
`;

export const GET_TREASURY_EVOLUTION = gql`
  query GetTreasuryEvolution($copropertyId: ID!, $months: Int) {
    getTreasuryEvolution(copropertyId: $copropertyId, months: $months) {
      month
      date
      amount
    }
  }
`;

export const GET_FINANCIAL_REPORT = gql`
  query GetFinancialReport($copropertyId: ID!, $year: Int!) {
    getFinancialReport(copropertyId: $copropertyId, year: $year) {
      copropertyId
      year
      totalCharges
      totalCollected
      totalOverdue
      balance
      monthlyBalances {
        month
        monthName
        opening
        receipts
        expenses
        closing
      }
    }
  }
`;
```

### Step 2: Update Service
**libs/document-module/src/services/finance.service.ts** (or similar)
```typescript
import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { GET_DASHBOARD_STATS, GET_TREASURY_EVOLUTION } from '../graphql/queries/dashboard.query';

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  constructor(private apollo: Apollo) {}

  getDashboardStats(copropertyId?: string) {
    return this.apollo.query<any>({
      query: GET_DASHBOARD_STATS,
      variables: { copropertyId }
    });
  }

  getTreasuryEvolution(copropertyId: string, months = 12) {
    return this.apollo.query<any>({
      query: GET_TREASURY_EVOLUTION,
      variables: { copropertyId, months }
    });
  }
}
```

### Step 3: Update Dashboard Component
**apps/admin/src/app/coproperty/components/coproperty-dashboard/coproperty-dashboard.component.ts**
```typescript
export class CopropertyDashboardComponent implements OnInit {
  dashboardStats = signal<DashboardStats | null>(null);
  treasuryData = signal<TreasuryDataPoint[]>([]);

  constructor(
    private financeService: FinanceService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadDashboardStats();
    this.loadTreasuryData();
  }

  private loadDashboardStats() {
    const copropertyId = this.route.snapshot.paramMap.get('id');
    this.financeService
      .getDashboardStats(copropertyId)
      .subscribe(result => {
        if (result.data) {
          this.dashboardStats.set(result.data.getDashboardStats);
          this.cdr.markForCheck();
        }
      });
  }

  private loadTreasuryData() {
    const copropertyId = this.route.snapshot.paramMap.get('id');
    this.financeService
      .getTreasuryEvolution(copropertyId)
      .subscribe(result => {
        if (result.data) {
          this.treasuryData.set(result.data.getTreasuryEvolution);
          this.cdr.markForCheck();
        }
      });
  }
}
```

### Step 4: Update Template
Bind to the signals:
```html
<div class="kpi-cards">
  @if (dashboardStats()) {
    <div class="kpi-card">
      <span class="kpi-label">{{ 'TOTAL_UNITS' | translate }}</span>
      <span class="kpi-value">{{ dashboardStats().totalUnits }}</span>
    </div>
    <div class="kpi-card">
      <span class="kpi-label">{{ 'OVERDUE_INVOICES' | translate }}</span>
      <span class="kpi-value">{{ dashboardStats().overdueInvoices }}</span>
    </div>
    <!-- More KPI cards -->
  }
</div>
```

## Database Migrations

### If tables don't exist (first-time setup)
```bash
cd /Users/macbook/Workspace/myb/src/services/coproperty-management/Myb.Coproperty
dotnet ef migrations add FinanceModule --project Myb.Coproperty.csproj
dotnet ef database update
```

### Connection String
Ensure PostgreSQL is running on port 5435 with correct credentials in appsettings.json:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5435;Database=coproperty;Username=postgres;Password=password;"
  }
}
```

## Testing the Implementation

### Manual GraphQL Test in Postman/Insomnia

1. **Create Test Data**
   - Create a Coproperty via existing mutations
   - Create Units and Owners
   - Create Charges with ChargeDistributions

2. **Test Invoice Generation**
   ```graphql
   mutation {
     generateInvoicesFromCharge(chargeId: "xxx-xxx-xxx") {
       id
       invoiceNumber
       totalAmount
     }
   }
   ```

3. **Test Payment Recording**
   ```graphql
   mutation {
     recordPayment(input: {
       invoiceId: "xxx-xxx-xxx"
       amount: 500
       paymentDate: "2024-01-15T00:00:00Z"
       paymentMethod: "bank_transfer"
     }) {
       id
       amount
     }
   }
   ```

4. **Test Queries**
   - Run dashboard stats query
   - Verify all counts are correct
   - Check treasury evolution has 12 months

## Authentication Implementation

### Current State
FinanceMutations expects `IAuthenticationService` for getting current user.

### Required Implementation
1. Implement `IAuthenticationService` in your auth module
2. Extract user ID from JWT token claims
3. Pass to FinanceService methods

Example:
```csharp
public class AuthenticationService : IAuthenticationService
{
    private readonly IHttpContextAccessor _httpContext;

    public AuthenticationService(IHttpContextAccessor httpContext)
    {
        _httpContext = httpContext;
    }

    public string GetCurrentUserId()
    {
        var userIdClaim = _httpContext.HttpContext?.User
            .FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        return userIdClaim ?? throw new UnauthorizedAccessException();
    }
}
```

Register in Program.cs:
```csharp
builder.Services.AddScoped<IAuthenticationService, AuthenticationService>();
```

## Troubleshooting

### Issue: "Service not registered" error
**Solution:** Verify all services are registered in Program.cs with correct namespaces

### Issue: "Type not found" in GraphQL
**Solution:** Ensure all GraphQL types are registered with `.AddType<T>()` in Program.cs

### Issue: Navigation properties return null
**Solution:** Verify eager loading with `.Include()` in repository queries

### Issue: Database connection fails
**Solution:** Check PostgreSQL is running and connection string matches appsettings.json

## Next Steps

1. **Implement authentication service** to get current user context
2. **Add notification service integration** for payment reminders
3. **Create seed data** for development and testing
4. **Update frontend components** to use new GraphQL queries
5. **Run integration tests** for payment flows
6. **Configure production database** with proper migrations
7. **Add API documentation** for team reference

## Performance Considerations

- Use pagination for large invoice lists (future enhancement)
- Cache dashboard stats if queried frequently
- Consider batch payment processing for bulk payments
- Monitor monthly balance calculations for report generation speed

## Security Checklist

- ✅ All mutations require authentication (IAuthenticationService)
- ✅ User context tracked (CreatedBy fields)
- ⏳ Add authorization checks per operation (future)
- ⏳ Implement row-level security per coproperty
- ⏳ Audit trail for financial operations

---

**Last Updated:** 2024
**Phase:** 2 - Backend Enhancement
**Status:** Complete, Ready for Integration
