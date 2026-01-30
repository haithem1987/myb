# Coproperty Management - Complete Implementation Summary

## 📋 Overview

This document provides a **complete implementation plan** for the MYB Coproperty Management module with **20 prioritized tasks** covering:

- ✅ **Admin Interface (Syndic):** Full property management, charges, invoices, maintenance
- ✅ **Owner Portal (Proprietaire):** View units, pay invoices, create maintenance requests  
- ✅ **Backend APIs:** GraphQL mutations & queries for all operations
- ✅ **Integrations:** Payments (Stripe), Notifications, Documents

---

## 🎯 Implementation Status

### ✅ Already Complete (Verified)

**Backend:**
- ✅ Models: Coproperty, Unit, Owner, Charge, ChargeDistribution, FundCall, CopropertyInvoice, Payment, MaintenanceRequest
- ✅ CopropertyService: CRUD operations
- ✅ UnitService: CRUD + GetByOwnerId
- ✅ ChargeService: CRUD + DistributeCharge (ByShares, ByArea, Equal algorithms implemented!)
- ✅ FinanceService: GetDashboardStats, GetTreasuryEvolution, GetFinancialReport
- ✅ FundCallService: CRUD operations
- ✅ MaintenanceService: Basic operations
- ✅ GraphQL Queries: GetCoproperties, GetUnits, GetOwners, GetCharges, GetFundCalls, GetMaintenanceRequests
- ✅ GraphQL Mutations: CreateCoproperty, UpdateCoproperty (just added!), DeleteCoproperty, Create/Update/Delete for all entities

**Frontend:**
- ✅ Dashboard component (partial - needs completion)
- ✅ Coproperty list component
- ✅ Coproperty service with GraphQL
- ✅ Basic routing

---

## 📝 TODO List (20 Tasks)

### 🔴 HIGH PRIORITY - Core Functionality

#### ✅ Task 1: UpdateCoproperty mutation ✓ DONE
**Status:** COMPLETED  
**What:** Added UpdateCoproperty mutation to CopropertyMutations.cs

#### 🔵 Task 2: Charge Distribution Algorithms  
**Status:** ALREADY IMPLEMENTED (Verified in ChargeService.cs)
**What's there:**
- ✅ ByShares: `amount = (totalAmount * unit.Shares) / totalShares`
- ✅ ByArea: `amount = (totalAmount * unit.Area) / totalArea`
- ✅ Equal: `amount = totalAmount / unitCount`
- ⚠️ Custom: Not implemented (can be done later)

**Action:** Mark as completed, add Custom distribution in future if needed.

---

#### 🟡 Task 3: Invoice Generation from FundCalls
**Priority:** HIGH  
**File:** `FinanceMutations.cs`  
**What to do:**

```csharp
public async Task<List<CopropertyInvoice>> GenerateInvoicesFromFundCall(
    Guid fundCallId, 
    [Service] IFundCallService fundCallService,
    [Service] IChargeService chargeService,
    [Service] IOwnerService ownerService)
{
    // 1. Get FundCall
    var fundCall = await fundCallService.GetByIdAsync(fundCallId);
    
    // 2. Get ChargeDistributions for the associated charge
    var distributions = await chargeService.GetDistributionsByChargeIdAsync(fundCall.ChargeId);
    
    // 3. For each distribution, create an invoice
    var invoices = new List<CopropertyInvoice>();
    foreach (var dist in distributions)
    {
        // Get unit owner(s)
        var owners = await ownerService.GetByUnitIdAsync(dist.UnitId);
        var mainOwner = owners.FirstOrDefault(o => o.IsMainOwner) ?? owners.First();
        
        var invoice = new CopropertyInvoice
        {
            InvoiceNumber = $"FC-{fundCall.Id}-{dist.UnitId}",
            FundCallId = fundCallId,
            UnitId = dist.UnitId,
            OwnerId = mainOwner.Id,
            Amount = dist.Amount,
            TaxAmount = 0, // Or calculate tax
            TotalAmount = dist.Amount,
            InvoiceDate = DateTime.UtcNow,
            DueDate = fundCall.DueDate,
            Status = InvoiceStatus.Pending
        };
        
        // Save invoice (using invoice repository)
        invoices.Add(invoice);
    }
    
    return invoices;
}
```

**Files to create/modify:**
- Add `GenerateInvoicesFromFundCall` to `FinanceMutations.cs`
- Update `IChargeService` to add `GetDistributionsByChargeIdAsync`
- Update `IOwnerService` to add `GetByUnitIdAsync`

---

#### 🟡 Task 4: Payment Recording & Status Updates
**Priority:** HIGH  
**File:** `FinanceMutations.cs`  
**What to do:**

```csharp
public async Task<Payment> RecordPayment(
    Guid invoiceId,
    decimal amount,
    string paymentMethod,
    string? transactionId,
    [Service] IPaymentService paymentService,
    [Service] IInvoiceService invoiceService)
{
    // 1. Create payment record
    var payment = new Payment
    {
        InvoiceId = invoiceId,
        Amount = amount,
        PaymentDate = DateTime.UtcNow,
        PaymentMethod = paymentMethod,
        TransactionId = transactionId
    };
    
    await paymentService.CreateAsync(payment);
    
    // 2. Update invoice status
    var invoice = await invoiceService.GetByIdAsync(invoiceId);
    var totalPaid = await paymentService.GetTotalPaidForInvoiceAsync(invoiceId);
    
    if (totalPaid >= invoice.TotalAmount)
    {
        invoice.Status = InvoiceStatus.Paid;
        invoice.PaidDate = DateTime.UtcNow;
    }
    else if (totalPaid > 0)
    {
        invoice.Status = InvoiceStatus.PartiallyPaid;
    }
    
    await invoiceService.UpdateAsync(invoice);
    
    return payment;
}
```

---

#### 🟡 Task 5: Maintenance Workflow Mutations
**Priority:** MEDIUM  
**File:** `MaintenanceMutations.cs`  
**What to do:**

```csharp
// Already have CreateMaintenanceRequest, need to add:

public async Task<MaintenanceRequest> AssignMaintenance(
    Guid id,
    Guid technicianId,
    [Service] IMaintenanceService service)
{
    var request = await service.GetByIdAsync(id);
    request.AssignedTo = technicianId;
    request.Status = MaintenanceStatus.Assigned;
    request.UpdatedAt = DateTime.UtcNow;
    await service.UpdateAsync(request);
    return request;
}

public async Task<MaintenanceRequest> UpdateMaintenanceStatus(
    Guid id,
    MaintenanceStatus status,
    [Service] IMaintenanceService service)
{
    var request = await service.GetByIdAsync(id);
    request.Status = status;
    request.UpdatedAt = DateTime.UtcNow;
    
    if (status == MaintenanceStatus.Completed)
    {
        request.CompletedDate = DateTime.UtcNow;
    }
    
    await service.UpdateAsync(request);
    return request;
}

public async Task<MaintenanceRequest> CompleteMaintenance(
    Guid id,
    decimal? actualCost,
    [Service] IMaintenanceService service)
{
    var request = await service.GetByIdAsync(id);
    request.Status = MaintenanceStatus.Completed;
    request.CompletedDate = DateTime.UtcNow;
    request.ActualCost = actualCost;
    request.UpdatedAt = DateTime.UtcNow;
    await service.UpdateAsync(request);
    return request;
}
```

---

### 🎨 FRONTEND - Admin Interface

#### 🟢 Task 7: Complete Admin Dashboard
**Priority:** HIGH  
**File:** `coproperty-dashboard.component.ts`  
**What to do:**

1. **Fix KPIs** - Already have signals, ensure data loads correctly
2. **Add Treasury Evolution Chart:**

```typescript
import { Chart, registerables } from 'chart.js';

// In ngAfterViewInit:
private initTreasuryChart(): void {
  const ctx = document.getElementById('treasuryChart') as HTMLCanvasElement;
  
  this.copropertyService.getTreasuryEvolution(copropertyId, 12)
    .subscribe(data => {
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.map(d => `${d.month}/${d.year}`),
          datasets: [{
            label: 'Balance',
            data: data.map(d => d.balance),
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
          }]
        }
      });
    });
}
```

3. **Add Charges Distribution Pie Chart:**

```typescript
private initChargesChart(): void {
  const ctx = document.getElementById('chargesChart') as HTMLCanvasElement;
  
  this.copropertyService.getFinancialReport(copropertyId, currentYear)
    .subscribe(report => {
      new Chart(ctx, {
        type: 'pie',
        data: {
          labels: report.chargesBreakdown.map(c => c.chargeType),
          datasets: [{
            data: report.chargesBreakdown.map(c => c.amount),
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
          }]
        }
      });
    });
}
```

4. **Add Recent Activity Feed:**

```html
<div class="recent-activity">
  <h3>Recent Activity</h3>
  <ul>
    <li *ngFor="let activity of recentActivities()">
      <span class="icon">{{ getActivityIcon(activity.type) }}</span>
      <span class="description">{{ activity.description }}</span>
      <span class="date">{{ activity.date | date:'short' }}</span>
    </li>
  </ul>
</div>
```

---

#### 🟢 Task 8: Coproperty Detail Page
**Priority:** HIGH  
**File:** Create `coproperty-detail.component.ts`  
**Structure:**

```html
<mat-tab-group>
  <mat-tab label="Basic Info">
    <!-- Show coproperty details: name, address, manager, total units/shares -->
  </mat-tab>
  
  <mat-tab label="Units">
    <!-- Unit list table for this coproperty -->
    <app-unit-list [copropertyId]="copropertyId()"></app-unit-list>
  </mat-tab>
  
  <mat-tab label="Owners">
    <!-- Owner list for this coproperty -->
    <app-owner-list [copropertyId]="copropertyId()"></app-owner-list>
  </mat-tab>
  
  <mat-tab label="Financial">
    <!-- Financial overview, charges, fund calls -->
    <app-financial-overview [copropertyId]="copropertyId()"></app-financial-overview>
  </mat-tab>
  
  <mat-tab label="Maintenance">
    <!-- Maintenance requests list -->
    <app-maintenance-list [copropertyId]="copropertyId()"></app-maintenance-list>
  </mat-tab>
</mat-tab-group>
```

---

#### 🟢 Task 9-16: CRUD Components (Medium Priority)

Create these components following Angular Material patterns:

**9. Unit Management:**
- `unit-list.component.ts` - Table with filters
- `unit-form.component.ts` - Create/edit form
- GraphQL: `units(copropertyId)`, `createUnit`, `updateUnit`, `deleteUnit`

**10. Owner Management:**
- `owner-list.component.ts` - Table
- `owner-form.component.ts` - Form
- `assign-owner-dialog.component.ts` - Link owner to unit
- GraphQL: `owners(copropertyId)`, `createOwner`, `addOwnerToUnit`

**11. Charge Management:**
- `charge-list.component.ts` - Table
- `charge-form.component.ts` - Form with distribution method selector
- `charge-distribution-preview.component.ts` - Show distribution breakdown
- GraphQL: `charges(copropertyId)`, `createCharge`, `distributeCharge`

**12. FundCall Wizard:**
- `fundcall-wizard.component.ts` - Stepper component
- Steps: Select coproperty → Create/select charge → Preview → Confirm

**13. Invoice & Payment:**
- `invoice-list.component.ts` - Table with filters
- `payment-form-dialog.component.ts` - Record payment
- GraphQL: `invoices(copropertyId)`, `recordPayment`

---

### 👤 FRONTEND - Owner Portal

#### 🔵 Task 14: Owner Portal Dashboard
**Priority:** HIGH  
**File:** Create `owner-dashboard.component.ts`  
**What to show:**

```html
<div class="owner-dashboard">
  <!-- My Units -->
  <section>
    <h2>My Units</h2>
    <div class="unit-cards">
      <mat-card *ngFor="let unit of myUnits()">
        <mat-card-header>
          <mat-card-title>Unit {{unit.unitNumber}}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>{{unit.coproperty.name}}</p>
          <p>{{unit.area}}m² - {{unit.shares}} shares</p>
        </mat-card-content>
      </mat-card>
    </div>
  </section>
  
  <!-- Pending Invoices -->
  <section>
    <h2>Pending Invoices</h2>
    <table mat-table [dataSource]="pendingInvoices()">
      <ng-container matColumnDef="invoiceNumber">
        <th mat-header-cell *matHeaderCellDef>Invoice #</th>
        <td mat-cell *cdkCellDef="let invoice">{{invoice.invoiceNumber}}</td>
      </ng-container>
      <ng-container matColumnDef="amount">
        <th mat-header-cell *matHeaderCellDef>Amount</th>
        <td mat-cell *cdkCellDef="let invoice">{{invoice.totalAmount | currency:'EUR'}}</td>
      </ng-container>
      <ng-container matColumnDef="dueDate">
        <th mat-header-cell *matHeaderCellDef>Due Date</th>
        <td mat-cell *cdkCellDef="let invoice">{{invoice.dueDate | date}}</td>
      </ng-container>
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>Actions</th>
        <td mat-cell *cdkCellDef="let invoice">
          <button mat-button (click)="payInvoice(invoice)">Pay Now</button>
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
    </table>
  </section>
  
  <!-- Payment History -->
  <section>
    <h2>Payment History</h2>
    <!-- Show past payments -->
  </section>
  
  <!-- My Maintenance Requests -->
  <section>
    <h2>My Maintenance Requests</h2>
    <button mat-raised-button (click)="createRequest()">New Request</button>
    <!-- List of requests -->
  </section>
</div>
```

**GraphQL queries needed:**
```graphql
query MyUnits($userId: UUID!) {
  myUnits(userId: $userId) {
    id
    unitNumber
    area
    shares
    coproperty {
      name
      address
    }
  }
}

query MyInvoices($userId: UUID!) {
  myInvoices(userId: $userId, status: PENDING) {
    id
    invoiceNumber
    totalAmount
    dueDate
    status
  }
}
```

---

#### 🔵 Task 15: Owner Payment Flow
**Priority:** HIGH  
**File:** Create `invoice-payment-dialog.component.ts`  
**Flow:**

1. Owner selects invoice(s) to pay
2. Shows total amount
3. Chooses payment method:
   - Credit Card (Stripe)
   - Bank Transfer (manual)
4. For Stripe:
   - Collect card details with Stripe Elements
   - Create payment intent
   - Process payment
   - Show confirmation
5. Record payment via GraphQL

**Integration with Stripe:**
```typescript
import { StripeService } from '@stripe/stripe-js';

async processStripePayment(invoiceId: string, amount: number) {
  // Create payment intent on backend
  const { clientSecret } = await this.paymentService.createPaymentIntent(amount);
  
  // Confirm payment with Stripe
  const result = await this.stripe.confirmCardPayment(clientSecret, {
    payment_method: {
      card: this.cardElement,
      billing_details: { name: this.ownerName }
    }
  });
  
  if (result.error) {
    // Show error
  } else {
    // Record payment
    await this.paymentService.recordPayment({
      invoiceId,
      amount,
      paymentMethod: 'Stripe',
      transactionId: result.paymentIntent.id
    });
    
    // Show success & download receipt
  }
}
```

---

### 🔐 SECURITY & INTEGRATIONS

#### 🟡 Task 17: RBAC with Keycloak
**Priority:** HIGH  
**What to do:**

1. **Define roles in Keycloak:**
   - `coproperty-admin`: Full access
   - `coproperty-syndic`: Manage assigned coproperties
   - `coproperty-owner`: View own data only
   - `coproperty-council`: Read-only reports

2. **Backend authorization:**

```csharp
[Authorize(Roles = "coproperty-admin,coproperty-syndic")]
public async Task<Models.Coproperty> CreateCoproperty(...) { }

[Authorize(Roles = "coproperty-owner")]
public async Task<List<Invoice>> MyInvoices([User] ClaimsPrincipal user, ...) 
{
    var userId = user.GetUserId();
    return await _invoiceService.GetByOwnerUserIdAsync(userId);
}
```

3. **Frontend route guards:**

```typescript
// admin.routes.ts
{
  path: 'coproperties',
  canActivate: [RoleGuard],
  data: { roles: ['coproperty-admin', 'coproperty-syndic'] }
}

// owner.routes.ts
{
  path: 'my-invoices',
  canActivate: [RoleGuard],
  data: { roles: ['coproperty-owner'] }
}
```

---

#### 🟡 Task 18: Notifications Integration
**Priority:** MEDIUM  
**What to do:**

Send notifications via existing Notification Service for:

```csharp
// After creating fund call
await _notificationService.SendAsync(new Notification
{
    UserId = owner.UserId,
    Type = "FundCallCreated",
    Title = "New Fund Call",
    Message = $"A new fund call for {amount} EUR is due on {dueDate}",
    Data = new { FundCallId = fundCall.Id }
});

// Payment reminder (J+10)
await _notificationService.SendAsync(new Notification
{
    UserId = owner.UserId,
    Type = "PaymentReminder",
    Title = "Payment Reminder",
    Message = $"Invoice {invoiceNumber} is due in 10 days"
});

// Maintenance request update
await _notificationService.SendAsync(new Notification
{
    UserId = requester.UserId,
    Type = "MaintenanceUpdate",
    Title = "Maintenance Request Updated",
    Message = $"Your request #{requestId} status changed to {status}"
});
```

---

#### 🟡 Task 19: Document Management Integration
**Priority:** MEDIUM  
**What to do:**

Link coproperty documents to existing Document Service:

```typescript
// Upload document
async uploadDocument(file: File, copropertyId: string, category: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  formData.append('entityType', 'Coproperty');
  formData.append('entityId', copropertyId);
  
  return this.documentService.upload(formData);
}

// List documents
async getCopropertyDocuments(copropertyId: string) {
  return this.documentService.getByEntity('Coproperty', copropertyId);
}
```

---

## 📊 Testing Strategy

### Unit Tests (Task 26)
```csharp
[Fact]
public async Task DistributeCharge_ByShares_ShouldCalculateCorrectly()
{
    // Arrange
    var charge = new Charge { TotalAmount = 1000, DistributionMethod = DistributionMethod.ByShares };
    var units = new List<Unit> {
        new Unit { Shares = 50 },
        new Unit { Shares = 30 },
        new Unit { Shares = 20 }
    };
    
    // Act
    var distributions = await _chargeService.DistributeChargeAsync(charge.Id);
    
    // Assert
    Assert.Equal(500, distributions[0].Amount); // 1000 * 50/100
    Assert.Equal(300, distributions[1].Amount); // 1000 * 30/100
    Assert.Equal(200, distributions[2].Amount); // 1000 * 20/100
}
```

### E2E Tests (Task 28)
```typescript
describe('Coproperty Full Workflow', () => {
  it('should complete fund call to payment flow', () => {
    // 1. Login as admin
    cy.login('admin@example.com');
    
    // 2. Create coproperty
    cy.visit('/coproperties/create');
    cy.fillCopropertyForm({name: 'Test Building'});
    cy.get('[data-cy=save]').click();
    
    // 3. Add units
    cy.get('[data-cy=add-unit]').click();
    cy.fillUnitForm({unitNumber: 'A101', shares: 50});
    
    // 4. Create charge
    cy.visit('/charges/create');
    cy.fillChargeForm({amount: 1000, method: 'ByShares'});
    
    // 5. Generate fund call
    cy.get('[data-cy=generate-fundcall]').click();
    
    // 6. Verify invoice created
    cy.visit('/invoices');
    cy.contains('FC-').should('exist');
    
    // 7. Login as owner
    cy.login('owner@example.com');
    
    // 8. Pay invoice
    cy.visit('/my-invoices');
    cy.get('[data-cy=pay-invoice]').click();
    cy.fillStripeCard();
    cy.get('[data-cy=confirm-payment]').click();
    
    // 9. Verify payment success
    cy.contains('Payment successful').should('exist');
  });
});
```

---

## 🚀 Deployment Checklist

- [ ] Database migrations applied
- [ ] Seed test data for development
- [ ] Environment variables configured (Stripe keys, Keycloak, DB connection)
- [ ] Docker compose updated with coproperty service
- [ ] CORS configured for frontend domains
- [ ] SSL certificates for production
- [ ] Monitoring and logging enabled
- [ ] Backup strategy in place

---

## 📚 Next Steps (Prioritized)

### Week 1: Core Backend
1. ✅ UpdateCoproperty mutation (DONE)
2. ✅ Charge distribution (DONE - already implemented)
3. Implement GenerateInvoicesFromFundCall
4. Implement RecordPayment
5. Complete Maintenance workflow mutations

### Week 2: Admin UI
6. Complete Admin Dashboard (charts, KPIs)
7. Build Coproperty Detail page
8. Create Unit Management UI
9. Create Owner Management UI

### Week 3: Owner Portal & Payments
10. Build Owner Dashboard
11. Implement Invoice Payment Flow (Stripe)
12. Create Maintenance Request UI (both sides)

### Week 4: Security & Integrations
13. Implement RBAC
14. Integrate Notifications
15. Integrate Document Service
16. Add Financial Reports UI

### Week 5: Testing & Polish
17. Unit tests for services
18. E2E tests
19. Performance optimization
20. Documentation

---

## 📖 Resources

- **Backend:** `/src/services/coproperty-management/Myb.Coproperty/`
- **Frontend:** `/src/front/myb.front/libs/coproperty-module/`
- **Docs:** `/docs/COPROPERTY_MANAGEMENT_DOC.md`
- **Spec:** `/docs/COPROPERTY_MANAGEMENT_SPEC.md`

---

**Total Estimated Time:** 4-5 weeks (1 developer full-time)

**Current Progress:** ~15% complete (basic structure + charge distribution)

**Next Action:** Implement Task 3 (Invoice Generation) in FinanceMutations.cs
