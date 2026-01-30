# Phase 3: Comprehensive Testing Guide

## Overview

This guide provides comprehensive testing procedures for the Coproperty Management Module. It covers setup, test cases, validation, and troubleshooting for all major features.

**Date:** January 14, 2026  
**Status:** Ready for Testing  
**Scope:** Backend GraphQL API + Frontend Integration

---

## Part 1: Environment Setup

### 1.1 Pre-Testing Verification

#### Docker Services Check
```bash
# Verify all services are running
docker-compose ps

# Expected status: "Up" with healthy checks
# Services:
# - keycloak
# - keycloak-db
# - coproperty-service (port 8088)
# - coproperty-db (port 5435)
# - frontend (port 4200)
```

#### Service Health Verification
```bash
# Test GraphQL endpoint
curl -X POST http://localhost:8088/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { types { name } } }"}'

# Expected response: GraphQL schema with type definitions

# Test Frontend
curl http://localhost:4200 | head -20

# Expected response: HTML page with Angular app
```

#### Database Connection
```bash
# Connect to database
docker exec -it copropertydb psql -U postgres -d copropertydb

# Check tables exist
\dt

# Expected output: List of tables including:
# - coproperties
# - units
# - owners
# - charges
# - copropertyinvoices
# - payments
```

### 1.2 Seed Data Initialization

The backend automatically seeds development data on startup. Verify:

```bash
# Connect to database
docker exec -it copropertydb psql -U postgres -d copropertydb

# Verify sample data
SELECT COUNT(*) FROM coproperties;    -- Should return 2
SELECT COUNT(*) FROM units;           -- Should return 35
SELECT COUNT(*) FROM owners;          -- Should return 25
SELECT COUNT(*) FROM charges;         -- Should return 3
SELECT COUNT(*) FROM copropertyinvoices; -- Should return ≥5
SELECT COUNT(*) FROM payments;        -- Should return 5
```

**Sample Data Provided:**
- 2 Coproperties (Résidence Les Jardins, Immeuble Soleil)
- 35 Units (20 + 15)
- 25 Owners
- 3 Charges with distributions
- Multiple invoices (pending, paid, partially paid)

---

## Part 2: Unit Tests

### 2.1 Running Unit Tests

#### Prerequisites
```bash
# Install test dependencies
cd src/tests/unit-tests/coproperty-management
dotnet restore
```

#### Run All Tests
```bash
# Navigate to test project
cd /Users/macbook/Workspace/myb/src/tests/unit-tests/coproperty-management

# Run all tests
dotnet test

# Expected output: All tests pass
```

#### Run Specific Test Class
```bash
# Run FinanceService tests
dotnet test --filter "Class=CopropertyManagement.Tests.Services.FinanceServiceTests"

# Run InvoiceRepository tests
dotnet test --filter "Class=CopropertyManagement.Tests.Repositories.InvoiceRepositoryTests"
```

#### Run with Coverage Report
```bash
# Generate coverage report
dotnet test /p:CollectCoverage=true /p:CoverageFormat=opencover

# Expected: Coverage >80% for critical paths
```

### 2.2 Unit Test Suites

#### FinanceService Tests (16 tests)

**GetDashboardStatsAsync**
- [ ] Returns aggregated stats without filter
- [ ] Returns filtered stats with coproperty ID
- [ ] Counts overdue invoices correctly

**GetTreasuryEvolutionAsync**
- [ ] Returns exactly 12 months of data
- [ ] Aggregates payments by month
- [ ] Handles months with no data

**GenerateInvoicesFromChargeAsync**
- [ ] Creates one invoice per distribution
- [ ] Calculates amounts correctly
- [ ] Throws when charge not found
- [ ] Sets correct status and dates

**RecordPaymentAsync**
- [ ] Creates payment record
- [ ] Updates status to PartiallyPaid
- [ ] Updates status to Paid
- [ ] Throws when invoice not found
- [ ] Tracks payment date correctly

**GenerateFinancialReportAsync**
- [ ] Returns annual summary
- [ ] Calculates totals correctly
- [ ] Includes 12 monthly breakdowns
- [ ] Calculates balance properly

#### InvoiceRepository Tests (12 tests)

**Query Methods**
- [ ] GetByIdAsync returns invoice with related data
- [ ] GetByUnitIdAsync returns all unit invoices
- [ ] GetByCopropertyIdAsync returns coproperty invoices
- [ ] GetOverdueInvoicesAsync returns only past-due unpaid
- [ ] GetUnpaidInvoicesAsync returns all unpaid statuses
- [ ] GetByChargeIdAsync returns charge invoices
- [ ] GetByStatusAsync filters by invoice status

**CRUD Operations**
- [ ] CreateAsync persists invoice
- [ ] UpdateAsync modifies invoice
- [ ] DeleteAsync removes invoice
- [ ] Delete handles non-existent IDs gracefully

### 2.3 Test Execution Checklist

| Test Suite | File | Status | Notes |
|-----------|------|--------|-------|
| FinanceService | `Services/FinanceServiceTests.cs` | ☐ Pass | 16 test cases |
| InvoiceRepository | `Repositories/InvoiceRepositoryTests.cs` | ☐ Pass | 12 test cases |
| **Total** | | ☐ Pass | **28 test cases** |

---

## Part 3: Integration Tests

### 3.1 GraphQL Query Testing

Test using GraphQL Playground at `http://localhost:8088/graphql`

#### Query: GetDashboardStats

**Test Case 3.1.1: Fetch Global Dashboard Stats**

```graphql
query GetDashboardStats {
  getDashboardStats {
    totalCoproperties
    totalUnits
    totalBalance
    totalCharges
    pendingMaintenance
    overdueInvoices
  }
}
```

**Expected Response:**
```json
{
  "data": {
    "getDashboardStats": {
      "totalCoproperties": 2,
      "totalUnits": 35,
      "totalBalance": 1500.50,
      "totalCharges": 18000,
      "pendingMaintenance": 4,
      "overdueInvoices": 0
    }
  }
}
```

**Validation Points:**
- [ ] Response time < 500ms
- [ ] All values are >= 0
- [ ] Values match database counts
- [ ] No null values

**Test Case 3.1.2: Fetch Coproperty-Specific Stats**

```graphql
query GetCopropertyDashboard {
  getDashboardStats(copropertyId: "550e8400-e29b-41d4-a716-446655440000") {
    totalUnits
    totalBalance
    overdueInvoices
  }
}
```

**Expected Response:**
```json
{
  "data": {
    "getDashboardStats": {
      "totalUnits": 20,
      "totalBalance": 850.25,
      "overdueInvoices": 0
    }
  }
}
```

---

#### Query: GetTreasuryEvolution

**Test Case 3.2.1: Fetch 12-Month Treasury Data**

```graphql
query GetTreasuryData {
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

**Expected Response:**
```json
{
  "data": {
    "getTreasuryEvolution": [
      {
        "month": "January 2025",
        "date": "2025-01-01T00:00:00Z",
        "amount": 2500.00
      },
      {
        "month": "February 2025",
        "date": "2025-02-01T00:00:00Z",
        "amount": 1800.00
      }
      // ... 10 more months
    ]
  }
}
```

**Validation Points:**
- [ ] Returns exactly 12 data points
- [ ] Months in chronological order
- [ ] Amounts >= 0
- [ ] Dates are first day of month

---

#### Query: GetFinancialReport

**Test Case 3.3.1: Fetch Annual Financial Report**

```graphql
query GetFinancialReport {
  getFinancialReport(
    copropertyId: "550e8400-e29b-41d4-a716-446655440000"
    year: 2025
  ) {
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

**Expected Response:**
```json
{
  "data": {
    "getFinancialReport": {
      "copropertyId": "550e8400-e29b-41d4-a716-446655440000",
      "year": 2025,
      "totalCharges": 18000,
      "totalCollected": 2500,
      "totalOverdue": 1500.50,
      "balance": -15500,
      "monthlyBalances": [
        {
          "month": 1,
          "monthName": "January",
          "opening": 0,
          "receipts": 500,
          "expenses": 1500,
          "closing": -1000
        }
        // ... 11 more months
      ]
    }
  }
}
```

**Validation Points:**
- [ ] Year matches request
- [ ] 12 monthly records
- [ ] balance = totalCollected - totalCharges
- [ ] Each month: closing = opening + receipts - expenses

---

#### Query: GetInvoices

**Test Case 3.4.1: Fetch Unit Invoices**

```graphql
query GetUnitInvoices {
  getInvoicesByUnit(unitId: "550e8400-e29b-41d4-a716-446655440003") {
    id
    invoiceNumber
    totalAmount
    status
    invoiceDate
    dueDate
    payments {
      id
      amount
      paymentDate
    }
  }
}
```

**Expected Response:**
```json
{
  "data": {
    "getInvoicesByUnit": [
      {
        "id": "...uuid...",
        "invoiceNumber": "INV-001000",
        "totalAmount": 1210.00,
        "status": "PAID",
        "invoiceDate": "2025-01-15T00:00:00Z",
        "dueDate": "2025-02-14T00:00:00Z",
        "payments": [
          {
            "id": "...uuid...",
            "amount": 1210.00,
            "paymentDate": "2025-02-19T00:00:00Z"
          }
        ]
      }
    ]
  }
}
```

---

**Test Case 3.4.2: Fetch Overdue Invoices**

```graphql
query GetOverdueInvoices {
  getOverdueInvoices(copropertyId: "550e8400-e29b-41d4-a716-446655440000") {
    id
    invoiceNumber
    totalAmount
    dueDate
    status
  }
}
```

**Validation Points:**
- [ ] All returned invoices have dueDate < today
- [ ] All have status PENDING or PARTIALLY_PAID
- [ ] Sorted by dueDate (oldest first)

---

### 3.2 GraphQL Mutation Testing

#### Mutation: GenerateInvoicesFromCharge

**Test Case 3.5.1: Create Invoices from Charge**

First, get a charge ID from database:
```bash
docker exec -it copropertydb psql -U postgres -d copropertydb \
  -c "SELECT id FROM charges LIMIT 1;"
```

Then execute mutation:
```graphql
mutation GenerateInvoices {
  generateInvoicesFromCharge(chargeId: "550e8400-e29b-41d4-a716-446655440010") {
    id
    invoiceNumber
    amount
    totalAmount
    status
  }
}
```

**Expected Response:**
```json
{
  "data": {
    "generateInvoicesFromCharge": [
      {
        "id": "...uuid...",
        "invoiceNumber": "INV-...",
        "amount": 250.00,
        "totalAmount": 275.00,
        "status": "PENDING"
      },
      // ... more invoices for other units
    ]
  }
}
```

**Validation Points:**
- [ ] Creates one invoice per charge distribution
- [ ] Amounts > 0
- [ ] Status = PENDING
- [ ] InvoiceNumber unique
- [ ] Database updated

---

#### Mutation: RecordPayment

**Test Case 3.6.1: Record Full Payment**

First get an invoice ID:
```bash
docker exec -it copropertydb psql -U postgres -d copropertydb \
  -c "SELECT id, total_amount FROM copropertyinvoices WHERE status = 'PENDING' LIMIT 1;"
```

Then execute mutation:
```graphql
mutation RecordPayment {
  recordPayment(input: {
    invoiceId: "550e8400-e29b-41d4-a716-446655440015"
    amount: 1100.00
    paymentDate: "2025-01-20T14:30:00Z"
    paymentMethod: "bank_transfer"
    reference: "TXN-2025-001"
    notes: "Monthly payment for Unit 1"
  }) {
    id
    invoiceId
    amount
    paymentDate
    paymentMethod
    transactionId
  }
}
```

**Expected Response:**
```json
{
  "data": {
    "recordPayment": {
      "id": "...uuid...",
      "invoiceId": "550e8400-e29b-41d4-a716-446655440015",
      "amount": 1100.00,
      "paymentDate": "2025-01-20T14:30:00Z",
      "paymentMethod": "bank_transfer",
      "transactionId": "TXN-2025-001"
    }
  }
}
```

**Validation Points:**
- [ ] Payment created
- [ ] Invoice status updated (PENDING → PAID)
- [ ] PaidDate set
- [ ] Database persisted
- [ ] Response includes all payment details

---

**Test Case 3.6.2: Record Partial Payment**

```graphql
mutation RecordPartialPayment {
  recordPayment(input: {
    invoiceId: "550e8400-e29b-41d4-a716-446655440016"
    amount: 550.00
    paymentDate: "2025-01-21T10:00:00Z"
    paymentMethod: "check"
    reference: "CHK-2025-001"
  }) {
    id
    amount
  }
}
```

**Verify in Database:**
```bash
docker exec -it copropertydb psql -U postgres -d copropertydb \
  -c "SELECT id, status FROM copropertyinvoices WHERE id = '550e8400-e29b-41d4-a716-446655440016';"
```

**Expected:** Status = PARTIALLY_PAID

---

### 3.3 Integration Test Checklist

| Test | Case | Status | Time | Notes |
|------|------|--------|------|-------|
| Query | GetDashboardStats (global) | ☐ Pass | ___ ms | |
| Query | GetDashboardStats (filtered) | ☐ Pass | ___ ms | |
| Query | GetTreasuryEvolution | ☐ Pass | ___ ms | |
| Query | GetFinancialReport | ☐ Pass | ___ ms | |
| Query | GetInvoicesByUnit | ☐ Pass | ___ ms | |
| Query | GetOverdueInvoices | ☐ Pass | ___ ms | |
| Mutation | GenerateInvoices | ☐ Pass | ___ ms | |
| Mutation | RecordPayment (full) | ☐ Pass | ___ ms | |
| Mutation | RecordPayment (partial) | ☐ Pass | ___ ms | |

---

## Part 4: End-to-End Testing

### 4.1 Frontend Integration Tests

#### Test 4.1: Dashboard Loading

**Steps:**
1. Navigate to `http://localhost:4200`
2. Login with valid credentials
3. Navigate to `/admin/dashboard`

**Expected Results:**
- [ ] Page loads without errors
- [ ] KPI cards visible (Treasury, Units, Charges, Maintenance)
- [ ] Treasury chart renders
- [ ] Quick action buttons present
- [ ] Console shows no errors

**Screenshots Required:**
- [ ] Dashboard overview
- [ ] KPI cards detail
- [ ] Charts rendered

---

#### Test 4.2: Invoice Management

**Steps:**
1. Navigate to `/admin/invoices`
2. Select a unit with invoices
3. View invoice details

**Expected Results:**
- [ ] Invoice list loads
- [ ] Invoice amounts display correctly
- [ ] Payment history shown
- [ ] Status badges correct color
- [ ] Sort/filter work

---

#### Test 4.3: Payment Recording

**Steps:**
1. Open invoice detail
2. Click "Record Payment"
3. Enter payment details
4. Submit form

**Expected Results:**
- [ ] Modal opens
- [ ] Form validates required fields
- [ ] Payment submitted successfully
- [ ] Invoice status updated
- [ ] Success message displays

---

### 4.2 Performance Testing

#### Response Time Benchmarks

| Operation | Limit | Actual |
|-----------|-------|--------|
| Dashboard Stats | 500ms | ___ ms |
| Treasury Evolution | 800ms | ___ ms |
| Financial Report | 1000ms | ___ ms |
| List Invoices (20 items) | 400ms | ___ ms |
| Record Payment | 300ms | ___ ms |

**Tools:**
```bash
# Use curl to measure response time
curl -w "@curl-format.txt" -o /dev/null -s \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:8088/graphql
```

---

### 4.3 Data Consistency Testing

#### Database Integrity

After each payment recording mutation, verify:

```bash
# Check invoice status updated
docker exec -it copropertydb psql -U postgres -d copropertydb <<EOF
SELECT id, status, paid_date FROM copropertyinvoices 
WHERE id = '...' \G
EOF

# Check payment created
docker exec -it copropertydb psql -U postgres -d copropertydb <<EOF
SELECT id, amount, payment_date FROM payments 
WHERE invoice_id = '...' \G
EOF

# Verify totals match
docker exec -it copropertydb psql -U postgres -d copropertydb <<EOF
SELECT 
  SUM(total_amount) as total_invoiced,
  (SELECT SUM(amount) FROM payments) as total_paid
FROM copropertyinvoices \G
EOF
```

---

## Part 5: Load & Stress Testing

### 5.1 Setup Load Test

```bash
# Install Apache Bench
brew install httpd

# Or use hey
go install github.com/rakyll/hey@latest
```

### 5.2 Dashboard Query Load Test

```bash
# 100 concurrent requests
hey -n 1000 -c 100 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -m POST \
  -d '{"query":"{ getDashboardStats { totalCoproperties totalUnits } }"}' \
  http://localhost:8088/graphql
```

**Target Metrics:**
- Average response time < 500ms
- 95th percentile < 1000ms
- Error rate < 1%

---

## Part 6: Security Testing

### 6.1 Authentication Testing

**Test 6.1.1: Unauthenticated Request**

```bash
curl -X POST http://localhost:8088/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ getDashboardStats { totalCoproperties } }"}'
```

**Expected:** 401 Unauthorized or handled gracefully

**Test 6.1.2: Expired Token**

```bash
curl -X POST http://localhost:8088/graphql \
  -H "Authorization: Bearer expired-token" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ getDashboardStats { totalCoproperties } }"}'
```

**Expected:** 401 Unauthorized

---

### 6.2 Authorization Testing

**Test 6.2.1: Cross-Coproperty Access**

Attempt to access stats for a coproperty you don't manage:

```graphql
query {
  getDashboardStats(copropertyId: "other-user-coproperty-id") {
    totalUnits
  }
}
```

**Expected:** Either deny access or return empty results (per business rules)

---

## Part 7: Issue Reporting Template

### Issue Found

**Title:** [Brief description]

**Severity:** 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low

**Environment:**
- Backend Version: 
- Frontend Version: 
- Date/Time: 
- User: 

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**


**Actual Result:**


**Screenshots/Logs:**


**Database State:**


---

## Part 8: Sign-Off Checklist

- [ ] All unit tests pass (28/28)
- [ ] All GraphQL queries respond correctly
- [ ] All GraphQL mutations execute successfully
- [ ] Dashboard loads and displays data
- [ ] Payment recording works end-to-end
- [ ] Database consistency verified
- [ ] Performance acceptable
- [ ] No security vulnerabilities found
- [ ] Error handling works properly
- [ ] No console errors
- [ ] Documentation complete

**Tester Name:** ___________________

**Date:** ___________________

**Sign-Off:** ___________________

---

**Testing Complete:** Ready for Production Deployment

