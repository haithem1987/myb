# Payment Views & Filtering Implementation

## Overview
This document describes the implementation of the Payment Views & Filtering features for the Coproperty Management Module, including role-based access control and separate views for property managers (Syndicat) and owners (Propriétaires).

## Implementation Date
January 16, 2026

## Features Implemented

### 1. Role-Based Access Control (RBAC)

**Location:** `libs/coproperty-module/src/lib/guards/role.guard.ts`

**User Roles:**
- `SYNDICAT` - Property Manager (Admin View)
- `PROPRIETAIRE` - Owner (User View)
- `ADMIN` - Full Access

**Functionality:**
- Guards routes based on user roles
- Automatically redirects users to appropriate portal
- Integrates with authentication system

### 2. Updated Routing Configuration

**Location:** `libs/coproperty-module/src/lib/components/coproperty.routes.ts`

**New Routes:**

#### Admin Routes (Syndicat)
- `/admin/dashboard` - Admin Dashboard
- `/admin/charges` - Charge Management with Payment Status
- `/admin/payments` - Payment Management

#### Owner Routes (Propriétaire)
- `/owner-portal/dashboard` - Owner Dashboard
- `/owner-portal/my-payments` - Personal Payment History
- `/owner-portal/my-documents` - Personal Documents

### 3. Admin Charge Management Component

**Location:** `libs/coproperty-module/src/lib/components/admin/charges/`

**Files:**
- `charge-list.component.ts` - Component logic
- `charge-list.component.html` - Template
- `charge-list.component.scss` - Styles

**Features:**
- **Period Filtering:**
  - Current Month
  - Current Quarter
  - Current Year
  - Custom Date Range

- **Status Filtering:**
  - Paid
  - Partially Paid
  - Unpaid
  - Overdue

- **Summary Cards:**
  - Total Charges Amount
  - Total Paid Amount
  - Total Unpaid Amount
  - Collection Rate Percentage

- **Data Table Columns:**
  - Charge Name
  - Due Date
  - Total Amount
  - Paid Amount
  - Unpaid Amount
  - Payment Status (with colored chips)
  - Unit Statistics (Paid Units / Total Units)
  - Actions Menu

- **Actions:**
  - View charge details
  - Send payment reminders
  - Export to Excel/CSV
  - Individual charge export

### 4. Owner Payment Component

**Location:** `libs/coproperty-module/src/lib/components/owner/payments/`

**Files:**
- `owner-payments.component.ts` - Component logic
- `owner-payments.component.html` - Template
- `owner-payments.component.scss` - Styles

**Features:**
- **Summary Cards:**
  - Total to Pay (with Pay Now button)
  - Total Paid
  - My Units count and list

- **Period Filtering:**
  - This Month
  - This Quarter
  - This Year
  - Custom Date Range

- **Status Filtering:**
  - All
  - Paid
  - Unpaid
  - Overdue

- **Unit Filtering:**
  - All Units
  - Individual Unit Selection (for multi-unit owners)

- **Data Table Columns:**
  - Unit Number
  - Charge Name
  - Amount
  - Due Date
  - Paid Date
  - Status
  - Actions

- **Actions:**
  - Pay Now (redirects to payment gateway)
  - Download Invoice
  - Download Receipt (if payment completed)

- **Visual Indicators:**
  - Overdue payments highlighted in red
  - Empty state message when no payments found

### 5. Enhanced ChargeService

**Location:** `libs/coproperty-module/src/lib/services/charge.service.ts`

**New Methods:**

```typescript
// Get charges with payment status for a date range
getChargesWithPaymentStatus(startDate: Date, endDate: Date): Observable<ChargeWithStatus[]>

// Export charges report to CSV/Excel
exportChargesReport(charges: ChargeWithStatus[], period: PaymentPeriod): void

// Send payment reminders for a specific charge
sendPaymentReminders(chargeId: string): Observable<boolean>
```

**Features:**
- Mock data implementation (ready for GraphQL integration)
- CSV export functionality
- Payment status aggregation

### 6. OwnerPaymentService

**Location:** `libs/coproperty-module/src/lib/services/owner-payment.service.ts`

**Methods:**

```typescript
// Get owner payments for a date range
getOwnerPayments(ownerId: string, startDate: Date, endDate: Date): Observable<OwnerPayment[]>

// Initiate single payment
initiatePayment(paymentId: string): Observable<string>

// Initiate multiple payments at once
initiateMultiplePayments(paymentIds: string[]): Observable<string>
```

**Features:**
- Mock data with realistic scenarios
- Payment gateway integration ready
- Support for bulk payments

### 7. Internationalization (i18n)

**Files Updated:**
- `apps/client/src/assets/i18n/en.json`
- `apps/client/src/assets/i18n/fr.json`

**New Translation Keys:**

#### Coproperty Section
- `coproperty.charges.management`
- `coproperty.charge.*` (paidAmount, unpaidAmount, dueDate, status, unitStats)
- `coproperty.filters.*` (period, status, date ranges)
- `coproperty.status.*` (paid, partiallyPaid, unpaid, overdue)
- `coproperty.summary.*` (totals, collection rate)
- `coproperty.actions.*` (export, sendReminders)

#### Owner Section
- `owner.payments.*` (title, totals, actions)
- `owner.payment.*` (table columns)
- `owner.filters.*` (period, status, unit)
- `owner.status.*` (payment statuses)
- `owner.actions.*` (payNow, downloadInvoice, downloadReceipt)

#### Common Section
- `common.view`
- `common.export`

## Data Models

### ChargeWithStatus Interface
```typescript
interface ChargeWithStatus {
  id: string;
  name: string;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  status: PaymentStatus;
  dueDate: Date;
  unitCount: number;
  paidUnits: number;
  unpaidUnits: number;
}
```

### OwnerPayment Interface
```typescript
interface OwnerPayment {
  id: string;
  chargeName: string;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: PaymentStatus;
  invoiceUrl: string;
  receiptUrl?: string;
  unitNumber: string;
  paymentMethod?: string;
}
```

### Enums

#### PaymentStatus
- `PAID` - Fully paid
- `PARTIALLY_PAID` - Partially paid
- `UNPAID` - Not yet paid
- `OVERDUE` - Past due date and unpaid

#### PaymentPeriod
- `MONTH` - Current month
- `QUARTER` - Current quarter
- `YEAR` - Current year
- `CUSTOM` - Custom date range

## Styling

### Admin Charge List
- Responsive grid layout for summary cards
- Color-coded status chips (paid=green, unpaid=red, partial=orange)
- Flexible filter row with Material Design
- Professional data table with sorting

### Owner Payments
- Larger summary cards with prominent call-to-action
- Overdue row highlighting
- Empty state illustration
- Mobile-responsive design

### Common Patterns
- Material Design components
- Consistent spacing (20px padding, 16px gaps)
- Accessible color contrast
- Icon-enhanced UI elements

## Integration Points

### Backend Integration Required
Both services currently use mock data. To integrate with the backend GraphQL API:

1. **ChargeService:**
   - Add GraphQL query for charges with payment status
   - Implement actual export functionality (use library like `xlsx`)
   - Add mutation for sending reminders

2. **OwnerPaymentService:**
   - Add GraphQL query for owner payments
   - Implement payment gateway integration (Stripe)
   - Add payment confirmation webhook handling

### Authentication Integration
The `RoleGuard` currently reads from localStorage. Update to:
- Integrate with Keycloak/Auth service
- Read user role from JWT token
- Handle role changes dynamically

## Testing Recommendations

### Unit Tests
- Test date range calculations
- Test filtering logic
- Test status color/label methods
- Test CSV generation

### Integration Tests
- Test role-based routing
- Test payment initiation flow
- Test export functionality
- Test reminder sending

### E2E Tests
- Admin can filter charges by period and status
- Admin can export reports
- Owner can view and pay charges
- Owner can filter by unit and status
- Payment gateway redirection works

## Next Steps

1. **Backend Integration:**
   - Create GraphQL queries/mutations
   - Connect to payment service
   - Implement notification service for reminders

2. **Additional Features:**
   - Payment history charts
   - Automated payment scheduling
   - Payment receipt generation
   - Email notifications

3. **Enhancements:**
   - Advanced filtering (by charge type, amount range)
   - Bulk actions (mark as paid, send reminders)
   - Payment plan support
   - Payment method preferences

## Files Created/Modified

### New Files
1. `libs/coproperty-module/src/lib/guards/role.guard.ts`
2. `libs/coproperty-module/src/lib/guards/index.ts`
3. `libs/coproperty-module/src/lib/components/admin/charges/charge-list.component.ts`
4. `libs/coproperty-module/src/lib/components/admin/charges/charge-list.component.html`
5. `libs/coproperty-module/src/lib/components/admin/charges/charge-list.component.scss`
6. `libs/coproperty-module/src/lib/components/owner/payments/owner-payments.component.ts`
7. `libs/coproperty-module/src/lib/components/owner/payments/owner-payments.component.html`
8. `libs/coproperty-module/src/lib/components/owner/payments/owner-payments.component.scss`
9. `libs/coproperty-module/src/lib/services/owner-payment.service.ts`

### Modified Files
1. `libs/coproperty-module/src/lib/components/coproperty.routes.ts`
2. `libs/coproperty-module/src/lib/services/charge.service.ts`
3. `apps/client/src/assets/i18n/en.json`
4. `apps/client/src/assets/i18n/fr.json`

## Dependencies

All required Angular Material modules are already imported:
- MatTableModule
- MatChipsModule
- MatButtonModule
- MatSelectModule
- MatDatepickerModule
- MatCardModule
- MatFormFieldModule
- MatIconModule
- MatToolbarModule
- MatMenuModule
- MatSortModule

**Note:** If you encounter module not found errors for Angular Material, ensure it's installed:
```bash
cd src/front/myb.front
npm install @angular/material @angular/cdk
```

## Known Issues / To Fix

### TypeScript Errors
The following minor TypeScript errors may appear and need to be resolved:

1. **Implicit 'any' types in subscriptions:**
   - Add explicit types to subscription callbacks
   - Example: `.subscribe((payments: OwnerPayment[]) => { ... })`

2. **Module import path:**
   - If `owner-payment.service` import fails, verify the service file exists
   - Check TypeScript path mappings in tsconfig.json

### Quick Fixes
```typescript
// In owner-payments.component.ts, update subscription callbacks:

// Line 108 - Add type
).subscribe((payments: OwnerPayment[]) => {

// Line 193 - Add type  
this.paymentService.initiatePayment(paymentId).subscribe((paymentUrl: string) => {

// Line 204 - Add type
this.paymentService.initiateMultiplePayments(pendingIds).subscribe((paymentUrl: string) => {
```

Similarly in charge-list.component.ts:
```typescript
// Add type to subscription
).subscribe((charges: ChargeWithStatus[]) => {
```

## Notes

- All components use Angular signals for reactive state management
- Components are standalone for better tree-shaking
- Mock data is included for development/testing
- Ready for backend GraphQL integration
- Fully internationalized (EN/FR)
- Follows MYB project conventions and coding standards
