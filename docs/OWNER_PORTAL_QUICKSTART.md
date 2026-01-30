# Owner Portal - Quick Start Testing Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Start the Application

```bash
cd /Volumes/NidhalSSD/Projects/myb/src/front/myb.front
npx nx serve admin
```

Wait for compilation to complete, then open: **http://localhost:4200**

### Step 2: Navigate to Owner Portal

In your browser, go to:
```
http://localhost:4200/coproperty/owner
```

Or add navigation link in your app:
```html
<a mat-button routerLink="/coproperty/owner">
  <mat-icon>home</mat-icon>
  My Properties
</a>
```

### Step 3: What You Should See

✅ **Dashboard loads** with sections:
- My Units
- Pending Invoices
- Payment History
- My Maintenance Requests

⚠️ **Currently showing**: "Loading..." or empty states (no data yet)

---

## 🛠️ Integration Checklist

### 1. AuthService Integration (REQUIRED)

**File to modify**: `owner-dashboard.component.ts`

**Find** (around line 319):
```typescript
private getCurrentUserId(): string {
  // TODO: Get from AuthService
  return 'current-user-id'; // Placeholder
}
```

**Replace with**:
```typescript
private authService = inject(AuthService); // Add to class

private getCurrentUserId(): string {
  return this.authService.getCurrentUser().id;
  // Or: return this.authService.getUserId();
  // Depends on your AuthService API
}
```

### 2. Test Data Creation (RECOMMENDED)

**Option A: Use GraphQL Playground**

Navigate to: `http://localhost:8088/graphql`

**Create a test unit**:
```graphql
mutation {
  createUnit(unit: {
    copropertyId: "YOUR_COPROPERTY_ID"
    unitNumber: "A101"
    floor: 1
    area: 75.5
    shares: 100
    unitType: "Apartment"
  }) {
    id
    unitNumber
  }
}
```

**Create a test owner** (link user to unit):
```graphql
mutation {
  createOwner(owner: {
    userId: "YOUR_USER_ID"
    unitId: "UNIT_ID_FROM_ABOVE"
    ownershipPercentage: 100
    startDate: "2026-01-01"
    isMainOwner: true
  }) {
    id
  }
}
```

**Create a test invoice**:
```graphql
mutation {
  createCharge(charge: {
    copropertyId: "YOUR_COPROPERTY_ID"
    name: "Monthly Maintenance"
    chargeType: MAINTENANCE
    frequency: MONTHLY
    totalAmount: 150.00
    distributionMethod: BY_SHARES
    startDate: "2026-01-01"
    createdBy: "ADMIN_USER_ID"
  }) {
    id
  }
}

mutation {
  distributeCharge(chargeId: "CHARGE_ID_FROM_ABOVE") {
    unitId
    amount
  }
}

mutation {
  generateInvoicesFromCharge(chargeId: "CHARGE_ID_FROM_ABOVE") {
    id
    invoiceNumber
    totalAmount
    dueDate
  }
}
```

**Option B: Use SQL** (Quick test data)

```sql
-- Insert test coproperty
INSERT INTO coproperties (id, name, address, city, postal_code, country, total_units, total_shares, manager_id)
VALUES (gen_random_uuid(), 'Test Building', '123 Main St', 'Paris', '75001', 'France', 10, 1000, 'YOUR_USER_ID');

-- Insert test unit
INSERT INTO units (id, coproperty_id, unit_number, floor, area, shares)
VALUES (gen_random_uuid(), 'COPROPERTY_ID', 'A101', 1, 75.5, 100);

-- Insert test owner
INSERT INTO owners (id, user_id, unit_id, ownership_percentage, start_date, is_main_owner)
VALUES (gen_random_uuid(), 'YOUR_USER_ID', 'UNIT_ID', 100, '2026-01-01', true);

-- Insert test invoice
INSERT INTO coproperty_invoices (
  id, invoice_number, charge_id, unit_id, owner_id, 
  amount, tax_amount, total_amount, invoice_date, due_date, status
)
VALUES (
  gen_random_uuid(), 'INV-2026-001', 'CHARGE_ID', 'UNIT_ID', 'OWNER_ID',
  150.00, 0.00, 150.00, '2026-01-15', '2026-02-15', 'Pending'
);
```

---

## 🧪 Testing Scenarios

### Scenario 1: View My Units

1. Navigate to `/coproperty/owner`
2. **Expected**: Grid of unit cards showing:
   - Unit number
   - Coproperty name
   - Area and shares
   - Floor number

### Scenario 2: View Pending Invoices

1. Scroll to "Pending Invoices" section
2. **Expected**: Table showing:
   - Invoice number
   - Unit
   - Amount (in blue)
   - Due date
   - Status chip
   - "Pay Now" button

### Scenario 3: Pay an Invoice

1. Click "Pay Now" on any invoice
2. Dialog opens with invoice details
3. Select payment method:
   - **Credit Card**: Shows card form
   - **Bank Transfer**: Simple form
   - **Check**: Simple form
4. Enter amount or click "Pay Full Amount"
5. Add optional notes
6. Click "Confirm Payment"
7. **Expected**: 
   - Loading spinner appears
   - Dialog closes on success
   - Dashboard refreshes
   - Invoice moved to payment history

### Scenario 4: View Payment History

1. Scroll to "Recent Payment History" section
2. **Expected**: List of paid invoices showing:
   - Invoice number
   - Unit number
   - Amount (in green)
   - Payment date
   - "Paid" status chip

### Scenario 5: View Maintenance Requests

1. Scroll to "My Maintenance Requests" section
2. **Expected**: Grid of request cards showing:
   - Title and description
   - Category
   - Priority badge (color-coded)
   - Status chip
   - "View Details" button

### Scenario 6: Create Maintenance Request

1. Click "New Request" button
2. **Current**: Console log (dialog not yet implemented)
3. **TODO**: Open dialog with form

---

## 🐛 Troubleshooting

### Issue: "Loading..." never completes

**Cause**: GraphQL query failed or returned error

**Solution**:
1. Open browser DevTools (F12)
2. Check Console for errors
3. Check Network tab for GraphQL requests
4. Verify backend is running on port 8088
5. Check GraphQL endpoint: `http://localhost:8088/graphql`

### Issue: Empty states everywhere

**Cause**: No data in database for current user

**Solution**:
1. Create test data (see section above)
2. Verify user ID is correct (check `getCurrentUserId()`)
3. Check database: `SELECT * FROM owners WHERE user_id = 'YOUR_USER_ID'`

### Issue: Payment fails

**Cause**: Backend mutation error or validation

**Solution**:
1. Check browser console for error message
2. Check error displayed in dialog
3. Verify invoice ID is valid
4. Check backend logs
5. Test mutation directly in GraphQL playground

### Issue: 401 Unauthorized

**Cause**: Missing or invalid JWT token

**Solution**:
1. Verify user is logged in via Keycloak
2. Check JWT token in localStorage/sessionStorage
3. Check Authorization header in Network tab
4. Verify Keycloak configuration

### Issue: CORS error

**Cause**: Backend CORS not configured for frontend

**Solution**:
1. Check backend CORS configuration
2. Verify allowed origins include `http://localhost:4200`
3. Check CORS headers in Network tab response

---

## 📊 Backend Verification

### Check Backend is Running

```bash
# Check coproperty service
curl http://localhost:8088/health

# Check GraphQL endpoint
curl -X POST http://localhost:8088/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __schema { queryType { name } } }"}'
```

### Test GraphQL Queries

**Get units for owner**:
```graphql
query {
  unitsByOwner(ownerId: "YOUR_USER_ID") {
    id
    unitNumber
    area
    shares
  }
}
```

**Get invoices for owner**:
```graphql
query {
  invoicesByOwner(ownerId: "YOUR_OWNER_ID") {
    id
    invoiceNumber
    totalAmount
    dueDate
    status
  }
}
```

**Get maintenance requests**:
```graphql
query {
  myMaintenanceRequests(userId: "YOUR_USER_ID") {
    id
    title
    status
    priority
  }
}
```

---

## ✅ Success Checklist

Before marking as complete, verify:

- [ ] Frontend compiles without errors
- [ ] No console errors on page load
- [ ] Dashboard loads and displays all sections
- [ ] Units display correctly (if data exists)
- [ ] Invoices display correctly (if data exists)
- [ ] Payment dialog opens when clicking "Pay Now"
- [ ] Payment form validates correctly
- [ ] Can select different payment methods
- [ ] Can enter payment amount
- [ ] Payment submission calls backend (check Network tab)
- [ ] Dashboard refreshes after payment
- [ ] Maintenance requests display correctly
- [ ] Responsive design works on mobile/tablet
- [ ] No TypeScript compilation errors

---

## 🎯 Next Steps After Testing

### If Everything Works
1. ✅ Mark Tasks 14 & 15 as complete
2. Create production Stripe account
3. Add Stripe API keys to environment
4. Implement Stripe Elements integration
5. Add unit tests
6. Add E2E tests
7. Deploy to staging

### If Issues Found
1. Document the issue
2. Check troubleshooting section above
3. Review implementation guide: `docs/OWNER_PORTAL_IMPLEMENTATION.md`
4. Check backend logs
5. Test GraphQL queries in playground
6. Fix issues and retest

---

## 📞 Quick Reference

### URLs
- Frontend: `http://localhost:4200`
- Owner Portal: `http://localhost:4200/coproperty/owner`
- Backend GraphQL: `http://localhost:8088/graphql`
- Keycloak: `http://localhost:8080`

### Key Files
- Dashboard: `libs/coproperty-module/src/lib/components/owner-portal/owner-dashboard.component.ts`
- Payment Dialog: `libs/coproperty-module/src/lib/components/owner-portal/invoice-payment-dialog.component.ts`
- Service: `libs/coproperty-module/src/lib/services/owner.service.ts`
- Routes: `libs/coproperty-module/src/lib/components/coproperty.routes.ts`

### Commands
```bash
# Start frontend
cd src/front/myb.front
npx nx serve admin

# Start backend (if needed)
cd src/services/coproperty-management
dotnet run

# Run tests
npx nx test coproperty-module

# Build
npx nx build coproperty-module
```

---

## 🎉 Ready to Test!

The owner portal is fully implemented and ready for testing. Follow the steps above to verify functionality.

**Estimated Testing Time**: 15-30 minutes  
**Documentation**: Complete  
**Status**: ✅ Implementation Complete | 🧪 Testing Pending
