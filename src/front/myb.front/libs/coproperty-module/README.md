# Coproperty Management Module

Complete property management solution for MYB platform with admin (syndic) and owner (proprietaire) interfaces.

## 🚀 Quick Start

### Start Development

```bash
# Use the interactive helper
./scripts/coproperty-complete-dev.sh

# Or start manually
cd src/front/myb.front
npx nx serve admin

# Navigate to:
# - Admin: http://localhost:4200/coproperty
# - Owner: http://localhost:4200/coproperty/owner
```

### Backend Service

```bash
cd src/services/coproperty-management/Myb.Coproperty
dotnet run

# GraphQL Playground: http://localhost:8088/graphql
```

## 📁 Project Structure

```
coproperty-module/
├── src/lib/
│   ├── components/
│   │   ├── dashboard/              # Admin dashboard with charts
│   │   ├── owner-portal/           # Owner portal (NEW)
│   │   │   ├── owner-dashboard.component.ts
│   │   │   └── invoice-payment-dialog.component.ts
│   │   ├── coproperty-list.component.ts
│   │   ├── coproperty-detail.component.ts
│   │   ├── unit-management/
│   │   ├── owner-management/
│   │   ├── charge-distribution/
│   │   └── maintenance-requests/
│   ├── services/
│   │   ├── coproperty.service.ts   # Admin operations
│   │   ├── owner.service.ts        # Owner operations (NEW)
│   │   ├── unit.service.ts
│   │   ├── charge.service.ts
│   │   └── maintenance.service.ts
│   ├── models/
│   │   └── coproperty.models.ts    # All TypeScript interfaces
│   └── index.ts
```

## ✨ Features

### ✅ Completed Features

#### Backend (100%)
- [x] Full CRUD for coproperties, units, owners
- [x] Charge distribution (ByShares, ByArea, Equal)
- [x] Invoice generation from charges
- [x] Payment recording with status tracking
- [x] Maintenance request workflow
- [x] Financial reporting and dashboards
- [x] GraphQL API (HotChocolate 13.x)

#### Owner Portal (100%)
- [x] My Units dashboard
- [x] Pending invoices with overdue detection
- [x] Payment processing (Credit Card, Bank Transfer, Check)
- [x] Payment history
- [x] Maintenance request viewing
- [x] Responsive Material Design UI

#### Admin Dashboard (80%)
- [x] KPI cards (Treasury, Charges, Units, Maintenance)
- [x] Treasury evolution chart (Chart.js line chart)
- [x] Charges distribution chart (Chart.js pie chart)
- [x] Quick actions (Fund Call, Assembly, Reports)
- [ ] Recent activity feed (TODO)

### ⏳ Pending Features

#### Admin UI
- [ ] Coproperty detail page with tabs
- [ ] Unit management CRUD
- [ ] Owner management CRUD
- [ ] Charge management UI
- [ ] Invoice management UI
- [ ] Maintenance request management UI

#### Integrations
- [ ] Stripe payment processing
- [ ] Notification service integration
- [ ] Document service integration
- [ ] RBAC with Keycloak

## 🎯 Usage Examples

### Owner Portal

```typescript
// Navigate to owner portal
this.router.navigate(['/coproperty/owner']);

// Access from navigation menu
<a mat-button routerLink="/coproperty/owner">
  <mat-icon>home</mat-icon>
  My Properties
</a>
```

### GraphQL Queries

```typescript
// Get owner's units
this.ownerService.getMyUnits(userId).subscribe(units => {
  console.log('My units:', units);
});

// Get pending invoices
this.ownerService.getMyInvoices(ownerId).subscribe(invoices => {
  const pending = invoices.filter(i => i.status === 'Pending');
  console.log('Pending invoices:', pending);
});

// Record payment
this.ownerService.recordPayment({
  invoiceId: 'uuid',
  amount: 150.00,
  paymentMethod: 'CreditCard',
  notes: 'Online payment'
}).subscribe(payment => {
  console.log('Payment recorded:', payment);
});
```

### Dashboard Stats

```typescript
// Load dashboard statistics
this.copropertyService.getDashboardStats().subscribe(stats => {
  console.log('Total coproperties:', stats.totalCoproperties);
  console.log('Total balance:', stats.totalBalance);
});

// Load treasury evolution
this.copropertyService.getTreasuryEvolution(copropertyId, 12)
  .subscribe(data => {
    // data = [{ month: 1, year: 2026, balance: 35000, ... }]
  });
```

## 🔧 Development

### Install Dependencies

```bash
cd src/front/myb.front
npm install
```

### Run Tests

```bash
# Unit tests
npx nx test coproperty-module

# With coverage
npx nx test coproperty-module --coverage

# E2E tests
npx nx e2e coproperty-module-e2e
```

### Build Module

```bash
# Development build
npx nx build coproperty-module

# Production build
npx nx build coproperty-module --configuration=production
```

### Lint & Format

```bash
# Lint
npx nx lint coproperty-module

# Lint with auto-fix
npx nx lint coproperty-module --fix
```

## 📊 API Reference

### OwnerService

```typescript
class OwnerService {
  // Get owner's units
  getMyUnits(userId: string): Observable<Unit[]>
  
  // Get owner's invoices
  getMyInvoices(ownerId: string): Observable<CopropertyInvoice[]>
  
  // Get invoice details
  getInvoiceDetails(invoiceId: string): Observable<InvoiceWithDetails>
  
  // Get maintenance requests
  getMyMaintenanceRequests(userId: string): Observable<MaintenanceRequest[]>
  
  // Record payment
  recordPayment(input: RecordPaymentInput): Observable<Payment>
  
  // Create maintenance request
  createMaintenanceRequest(input: CreateMaintenanceRequestInput): Observable<MaintenanceRequest>
}
```

### CopropertyService

```typescript
class CopropertyService {
  // CRUD operations
  getCoproperties(): Observable<Coproperty[]>
  getCoproperty(id: string): Observable<Coproperty>
  createCoproperty(input: CreateCopropertyInput): Observable<Coproperty>
  deleteCoproperty(id: string): Observable<boolean>
  
  // Dashboard
  getDashboardStats(copropertyId?: string): Observable<DashboardStats>
  getTreasuryEvolution(copropertyId: string, months: number): Observable<TreasuryDataPoint[]>
  getChargesDistribution(copropertyId: string): Observable<ChargeDistributionData[]>
  getFinancialReport(copropertyId: string, year: number): Observable<FinancialReport>
  
  // Fund calls
  createFundCall(input: CreateFundCallInput): Observable<FundCall>
}
```

## 🎨 Components

### OwnerDashboardComponent

Complete owner portal dashboard with:
- My Units grid
- Pending Invoices table
- Payment History list
- Maintenance Requests grid
- Create new maintenance request action

**Route**: `/coproperty/owner`

```html
<app-owner-dashboard></app-owner-dashboard>
```

### InvoicePaymentDialogComponent

Payment processing dialog with:
- Invoice details display
- Payment method selection (Credit Card, Bank Transfer, Check)
- Amount input with partial payment support
- Credit card form (Stripe-ready)
- Form validation

```typescript
// Open payment dialog
const dialogRef = this.dialog.open(InvoicePaymentDialogComponent, {
  width: '600px',
  data: { invoice }
});

dialogRef.afterClosed().subscribe(result => {
  if (result) {
    // Payment successful, refresh data
  }
});
```

### CopropertyDashboardComponent

Admin dashboard with:
- KPI cards (Treasury, Charges, Units, Maintenance)
- Treasury evolution chart (Chart.js)
- Charges distribution chart (Chart.js)
- Quick actions panel
- Recent activity feed (TODO)

**Route**: `/coproperty`

```html
<myb-coproperty-dashboard></myb-coproperty-dashboard>
```

## 🔐 Security

### Authentication

Uses Keycloak JWT tokens. Current user ID should be obtained from AuthService:

```typescript
// TODO: Integrate AuthService
private getCurrentUserId(): string {
  return this.authService.getCurrentUser().id;
}
```

### Authorization

Planned roles:
- `coproperty-admin` - Full access
- `coproperty-syndic` - Property manager access
- `coproperty-owner` - Owner portal access

### Payment Security

- Credit card processing via Stripe (PCI-compliant)
- Never store card details on server
- Use Stripe Elements for card input
- Server receives payment token only

## 📚 Documentation

- **[Progress Report](../../docs/COPROPERTY_PROGRESS_REPORT.md)** - Detailed task list and progress
- **[Implementation Guide](../../docs/COPROPERTY_COMPLETE_IMPLEMENTATION_GUIDE.md)** - Complete implementation guide
- **[Owner Portal Guide](../../docs/OWNER_PORTAL_IMPLEMENTATION.md)** - Owner portal technical docs
- **[Quick Start](../../docs/OWNER_PORTAL_QUICKSTART.md)** - Testing and integration guide
- **[Implementation Status](../../docs/COPROPERTY_IMPLEMENTATION_STATUS.md)** - Current status overview

## 🧪 Testing

### Test Data Creation

Use GraphQL Playground (`http://localhost:8088/graphql`):

```graphql
# 1. Create coproperty
mutation {
  createCoproperty(input: {
    name: "Test Building"
    address: "123 Main St"
    city: "Paris"
    postalCode: "75001"
    country: "France"
    totalUnits: 10
    totalShares: 1000
    managerId: "USER_ID"
  }) { id }
}

# 2. Create unit
mutation {
  createUnit(unit: {
    copropertyId: "COPROPERTY_ID"
    unitNumber: "A101"
    floor: 1
    area: 75.5
    shares: 100
  }) { id }
}

# 3. Create owner
mutation {
  createOwner(owner: {
    userId: "USER_ID"
    unitId: "UNIT_ID"
    ownershipPercentage: 100
    startDate: "2026-01-01"
    isMainOwner: true
  }) { id }
}

# 4. Create charge and generate invoices
mutation {
  createCharge(charge: {
    copropertyId: "COPROPERTY_ID"
    name: "Monthly Maintenance"
    chargeType: MAINTENANCE
    frequency: MONTHLY
    totalAmount: 150.00
    distributionMethod: BY_SHARES
    startDate: "2026-01-01"
    createdBy: "USER_ID"
  }) { id }
}

mutation {
  distributeCharge(chargeId: "CHARGE_ID") {
    unitId amount
  }
}

mutation {
  generateInvoicesFromCharge(chargeId: "CHARGE_ID") {
    id invoiceNumber totalAmount
  }
}
```

## 🚀 Deployment

### Build for Production

```bash
# Build module
npx nx build coproperty-module --configuration=production

# Build app with module
npx nx build admin --configuration=production
```

### Environment Variables

```typescript
// environment.prod.ts
export const environment = {
  production: true,
  graphqlUri: 'https://api.myb.com/graphql',
  stripePublicKey: 'pk_live_...',
  keycloakUrl: 'https://auth.myb.com',
  // ...
};
```

## 📞 Support

### Development Helper

```bash
# Interactive menu with all common tasks
./scripts/coproperty-complete-dev.sh
```

### Common Issues

#### Chart.js not found
- Check: `npm list chart.js`
- Fix: `npm install chart.js@4.5.1`

#### GraphQL query fails
- Check backend is running on port 8088
- Verify GraphQL endpoint: `http://localhost:8088/graphql`
- Check browser console for errors

#### Owner portal shows empty data
- Create test data using GraphQL mutations above
- Verify user ID is correct
- Check database for owner records

## 📈 Roadmap

### Version 1.0 (Current)
- [x] Backend API complete
- [x] Owner portal
- [x] Admin dashboard with charts
- [ ] Admin CRUD UIs
- [ ] Payment integration (Stripe)

### Version 1.1 (Planned)
- [ ] Assembly management
- [ ] Voting system
- [ ] Document management integration
- [ ] Advanced reporting

### Version 2.0 (Future)
- [ ] Mobile app (Ionic/React Native)
- [ ] Advanced analytics
- [ ] AI-powered insights
- [ ] Multi-language support

## 🎉 Success Metrics

**Completed**:
- Backend: 100% (5/5 tasks)
- Owner Portal: 100% (2/2 tasks)
- Admin Dashboard: 80% (charts complete)

**Overall Progress**: 35% (7/20 tasks)

**Estimated Completion**: 1-2 weeks

---

**Built with**: Angular 17, Chart.js 4.5, Apollo Client 6.0, Material Design  
**Backend**: .NET 10, HotChocolate GraphQL, PostgreSQL 16  
**License**: MIT
