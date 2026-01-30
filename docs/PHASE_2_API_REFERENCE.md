# Phase 2: Complete API Reference

## Overview
This document provides a complete reference for all GraphQL operations added in Phase 2 of the Coproperty Management Module backend.

## GraphQL Schema

### Queries

#### getDashboardStats
Retrieves dashboard statistics for one or all coproperties.

**Parameters:**
- `copropertyId` (ID, optional): Filter for specific coproperty. If omitted, returns global stats.

**Returns:** DashboardStats
```graphql
{
  totalCoproperties: Int!
  totalUnits: Int!
  totalBalance: Decimal!
  totalCharges: Decimal!
  pendingMaintenance: Int!
  overdueInvoices: Int!
}
```

**Example Request:**
```graphql
{
  getDashboardStats(copropertyId: "550e8400-e29b-41d4-a716-446655440000") {
    totalUnits
    totalBalance
    overdueInvoices
  }
}
```

**Use Cases:**
- Load dashboard KPI cards
- Monitor financial health
- Track pending maintenance

---

#### getTreasuryEvolution
Retrieves monthly treasury data for charts and analysis.

**Parameters:**
- `copropertyId` (ID!, required): Target coproperty
- `months` (Int, default: 12): Number of past months to include

**Returns:** [TreasuryDataPoint!]!
```graphql
{
  month: String!         # e.g., "January 2024"
  date: DateTime!        # Start date of month
  amount: Decimal!       # Total payments for month
}
```

**Example Request:**
```graphql
{
  getTreasuryEvolution(
    copropertyId: "550e8400-e29b-41d4-a716-446655440000"
    months: 12
  ) {
    month
    date
    amount
  }
}
```

**Use Cases:**
- Display treasury evolution charts
- Analyze revenue trends
- Generate monthly reports

---

#### getFinancialReport
Generates comprehensive financial report for a year.

**Parameters:**
- `copropertyId` (ID!, required): Target coproperty
- `year` (Int!, required): Report year (e.g., 2024)

**Returns:** FinancialReport
```graphql
{
  copropertyId: ID!
  year: Int!
  totalCharges: Decimal!
  totalCollected: Decimal!
  totalOverdue: Decimal!
  balance: Decimal!
  monthlyBalances: [MonthlyBalance!]!
}
```

**MonthlyBalance Structure:**
```graphql
{
  month: Int!            # 1-12
  monthName: String!     # e.g., "January"
  opening: Decimal!      # Opening balance
  receipts: Decimal!     # Payments received
  expenses: Decimal!     # Charges billed
  closing: Decimal!      # Closing balance
}
```

**Example Request:**
```graphql
{
  getFinancialReport(
    copropertyId: "550e8400-e29b-41d4-a716-446655440000"
    year: 2024
  ) {
    totalCharges
    totalCollected
    balance
    monthlyBalances {
      month
      monthName
      opening
      receipts
      closing
    }
  }
}
```

**Use Cases:**
- Annual financial reporting
- Reconciliation and audits
- Board presentations

---

#### getInvoiceById
Retrieves a single invoice with all details.

**Parameters:**
- `id` (ID!, required): Invoice ID

**Returns:** CopropertyInvoice
```graphql
{
  id: ID!
  invoiceNumber: String!
  chargeId: ID
  unitId: ID
  ownerId: ID
  amount: Decimal!
  taxAmount: Decimal!
  totalAmount: Decimal!
  invoiceDate: DateTime!
  dueDate: DateTime!
  status: InvoiceStatus!
  paidDate: DateTime
  paymentMethod: String
  notes: String
  payments: [Payment!]!
  createdBy: String!
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

**InvoiceStatus Enum:**
- `PENDING`
- `PARTIALLY_PAID`
- `PAID`
- `OVERDUE`
- `CANCELLED`

**Example Request:**
```graphql
{
  getInvoiceById(id: "660e8400-e29b-41d4-a716-446655440000") {
    invoiceNumber
    totalAmount
    status
    payments {
      id
      amount
      paymentDate
    }
  }
}
```

---

#### getInvoicesByUnit
Retrieves all invoices for a unit.

**Parameters:**
- `unitId` (ID!, required): Unit ID

**Returns:** [CopropertyInvoice!]!

**Ordering:** By invoiceDate descending (newest first)

---

#### getInvoicesByCoproperty
Retrieves all invoices for a coproperty.

**Parameters:**
- `copropertyId` (ID!, required): Coproperty ID

**Returns:** [CopropertyInvoice!]!

**Ordering:** By invoiceDate descending

---

#### getOverdueInvoices
Retrieves only unpaid/partially-paid invoices past due date.

**Parameters:**
- `copropertyId` (ID!, required): Coproperty ID

**Returns:** [CopropertyInvoice!]!

**Ordering:** By dueDate ascending (oldest first)

**Business Logic:**
- Filters for status = PENDING or PARTIALLY_PAID
- Filters for dueDate < current date/time

---

#### getUnpaidInvoices
Retrieves all unpaid invoices (including recently issued).

**Parameters:**
- `copropertyId` (ID!, required): Coproperty ID

**Returns:** [CopropertyInvoice!]!

**Status Filter:**
- PENDING
- PARTIALLY_PAID
- OVERDUE

**Ordering:** By invoiceDate descending

---

#### getInvoicesByCharge
Retrieves all invoices generated from a specific charge.

**Parameters:**
- `chargeId` (ID!, required): Charge ID

**Returns:** [CopropertyInvoice!]!

**Use Case:** Track all units billed for a charge

---

### Mutations

#### generateInvoicesFromCharge
Generates invoices for all units with charge distribution.

**Parameters:**
- `chargeId` (ID!, required): Source charge ID

**Returns:** [CopropertyInvoice!]!

**Business Logic:**
1. Retrieves charge and all distributions
2. For each distribution:
   - Calculates unit share: `amount × (percentage ÷ 100)`
   - Creates invoice with:
     - InvoiceNumber: Auto-generated from IDs
     - Amount: Calculated share
     - DueDate: 30 days from creation
     - Status: PENDING
3. Persists all invoices atomically
4. Returns created invoices

**Example Request:**
```graphql
mutation {
  generateInvoicesFromCharge(
    chargeId: "550e8400-e29b-41d4-a716-446655440000"
  ) {
    id
    invoiceNumber
    amount
    totalAmount
    status
  }
}
```

**Authentication:** Required (via IAuthenticationService)

**Permissions:** (To be implemented)
- Manager of coproperty
- Admin role

---

#### recordPayment
Records a payment against an invoice and updates status.

**Parameters:**
- `input` (RecordPaymentInput!, required): Payment details

**Input Structure:**
```graphql
{
  invoiceId: ID!
  amount: Decimal!
  paymentDate: DateTime!
  paymentMethod: String!
  reference: String                # Transaction ID/Reference
  notes: String                    # Optional notes
}
```

**Returns:** Payment
```graphql
{
  id: ID!
  invoiceId: ID!
  amount: Decimal!
  paymentDate: DateTime!
  paymentMethod: String!
  transactionId: String
  notes: String
  createdBy: String!
  createdAt: DateTime!
}
```

**Business Logic:**
1. Validates invoice exists and not cancelled
2. Creates Payment record
3. Calculates total paid: `previous + new amount`
4. Updates invoice status:
   - If `totalPaid >= totalAmount`: Status = PAID, PaidDate = paymentDate
   - Else if `totalPaid > 0`: Status = PARTIALLY_PAID
   - Else: Status unchanged
5. Updates UpdatedAt timestamp
6. Returns new Payment record

**Example Request:**
```graphql
mutation {
  recordPayment(input: {
    invoiceId: "660e8400-e29b-41d4-a716-446655440000"
    amount: 500.00
    paymentDate: "2024-01-15T10:30:00Z"
    paymentMethod: "bank_transfer"
    reference: "TXN-12345"
    notes: "Monthly payment - Unit A"
  }) {
    id
    amount
    paymentDate
  }
}
```

**Authentication:** Required (gets user from JWT token)

---

#### sendPaymentReminder
Sends a payment reminder notification for an invoice.

**Parameters:**
- `invoiceId` (ID!, required): Target invoice
- `level` (Int, default: 1): Reminder level (1-3)

**Returns:** Boolean (success)

**Reminder Levels:**
- Level 1: Initial reminder (5 days after due)
- Level 2: Follow-up (15 days after due)
- Level 3: Final notice (30 days after due)

**Business Logic:**
1. Validates invoice exists
2. Skips if invoice status = PAID
3. Prepares reminder message with level text
4. Sends via notification service (placeholder)
5. Could log reminder history (future enhancement)

**Example Request:**
```graphql
mutation {
  sendPaymentReminder(
    invoiceId: "660e8400-e29b-41d4-a716-446655440000"
    level: 1
  )
}
```

**Note:** Notification service integration required

---

## Data Types

### DashboardStats
Global or per-coproperty statistics.

**Properties:**
| Property | Type | Description |
|----------|------|-------------|
| totalCoproperties | Int | Count of coproperties |
| totalUnits | Int | Count of units |
| totalBalance | Decimal | Sum of unpaid invoices |
| totalCharges | Decimal | Sum of all charges |
| pendingMaintenance | Int | Count of open maintenance |
| overdueInvoices | Int | Count of past-due unpaid |

---

### TreasuryDataPoint
Monthly revenue/payment data.

**Properties:**
| Property | Type | Description |
|----------|------|-------------|
| month | String | "January 2024" format |
| date | DateTime | First day of month |
| amount | Decimal | Total payments that month |

---

### FinancialReport
Annual financial summary.

**Properties:**
| Property | Type | Description |
|----------|------|-------------|
| copropertyId | ID | Reference to coproperty |
| year | Int | Report year |
| totalCharges | Decimal | Sum of all charges |
| totalCollected | Decimal | Sum of all payments |
| totalOverdue | Decimal | Unpaid overdue amounts |
| balance | Decimal | totalCollected - totalCharges |
| monthlyBalances | [MonthlyBalance] | Monthly breakdown |

---

### MonthlyBalance
Monthly financial snapshot.

**Properties:**
| Property | Type | Description |
|----------|------|-------------|
| month | Int | 1-12 |
| monthName | String | "January", etc. |
| opening | Decimal | Balance start of month |
| receipts | Decimal | Payments received |
| expenses | Decimal | Charges issued |
| closing | Decimal | Balance end of month |

---

### CopropertyInvoice (Full)
Complete invoice details.

**Properties:**
| Property | Type | Description |
|----------|------|-------------|
| id | ID | Invoice UUID |
| invoiceNumber | String | Unique invoice number |
| chargeId | ID | Source charge |
| unitId | ID | Target unit |
| ownerId | ID | Owner (tenant) |
| amount | Decimal | Base amount |
| taxAmount | Decimal | Tax component |
| totalAmount | Decimal | Amount due |
| invoiceDate | DateTime | Issue date |
| dueDate | DateTime | Payment due date |
| status | InvoiceStatus | Current status |
| paidDate | DateTime | When fully paid |
| paymentMethod | String | How paid |
| notes | String | Additional info |
| payments | [Payment] | Associated payments |
| createdBy | String | User who created |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

---

### Payment
Payment transaction record.

**Properties:**
| Property | Type | Description |
|----------|------|-------------|
| id | ID | Payment UUID |
| invoiceId | ID | Associated invoice |
| amount | Decimal | Payment amount |
| paymentDate | DateTime | Payment date |
| paymentMethod | String | Method (transfer, check, etc.) |
| transactionId | String | Reference/confirmation |
| notes | String | Optional notes |
| createdBy | String | User who recorded |
| createdAt | DateTime | Recording timestamp |

---

## Error Handling

### Common Errors

**Not Found (404)**
```json
{
  "errors": [{
    "message": "Invoice with ID xxx not found",
    "extensions": {
      "code": "INVOICE_NOT_FOUND"
    }
  }]
}
```

**Unauthorized (401)**
```json
{
  "errors": [{
    "message": "Authentication required",
    "extensions": {
      "code": "UNAUTHENTICATED"
    }
  }]
}
```

**Validation Error (400)**
```json
{
  "errors": [{
    "message": "Invalid amount: must be greater than 0",
    "extensions": {
      "code": "INVALID_INPUT"
    }
  }]
}
```

---

## Performance Notes

### Query Performance
- **getDashboardStats**: O(n) where n = invoices. Aggregate query.
- **getTreasuryEvolution**: O(n) where n = payments. Groups by month.
- **getInvoicesByCoproperty**: O(n) where n = invoices for coproperty. Indexed by copropertyId.
- **getOverdueInvoices**: O(m) where m = unpaid invoices. Filtered query.

### Optimization Recommendations
1. Add pagination for large datasets
2. Cache dashboard stats (5-min TTL)
3. Consider materialized views for reports
4. Index on (copropertyId, status) for invoice queries

---

## Business Rules

### Invoice Generation
- One invoice per unit in charge distribution
- Amount = charge.amount × (distribution.percentage / 100)
- Default due date = 30 days from creation
- Initial status = PENDING

### Payment Recording
- Payment amount must be > 0
- Cannot overpay (total paid ≤ invoice amount)
- Status transitions:
  - PENDING → PAID (if fully paid)
  - PENDING → PARTIALLY_PAID (if partially paid)
  - PartiallyPaid → PAID (if remaining paid)

### Overdue Determination
- Status set to OVERDUE if:
  - Status = PENDING or PARTIALLY_PAID
  - dueDate < current_date

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024 | Initial Phase 2 release |

---

**Last Updated:** 2024
**Phase:** 2 - Backend Enhancement
**Status:** Complete
