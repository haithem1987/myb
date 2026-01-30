# Coproperty Management - Implementation Plan

## Current Status

### ✅ Already Implemented (Backend)

**Models:**
- ✅ Coproperty, Unit, Owner, Charge, ChargeDistribution
- ✅ FundCall, CopropertyInvoice, Payment
- ✅ MaintenanceRequest
- ✅ Enums: ChargeType, ChargeFrequency, DistributionMethod, InvoiceStatus, MaintenanceCategory, MaintenanceStatus, Priority

**Services (Interfaces):**
- ✅ ICopropertyService - Basic CRUD + GetByManagerId
- ✅ IUnitService - Basic CRUD + GetByCopropertyId, GetByOwnerId
- ✅ IChargeService - CRUD + GetActiveCharges + DistributeCharge
- ✅ IOwnerService
- ✅ IFinanceService - GetDashboardStats, GetTreasuryEvolution, GenerateFinancialReport
- ✅ IMaintenanceService
- ✅ FundCallService

**GraphQL:**
- ✅ CopropertyQueries: GetCoproperties, GetCopropertyById, GetCopropertiesByManager
- ✅ CopropertyMutations: CreateCoproperty, DeleteCoproperty
- ✅ FundCallQueries: GetFundCall, GetFundCallsByCoproperty
- ✅ FundCallMutations: CreateFundCall, UpdateFundCall, DeleteFundCall
- ✅ Basic queries/mutations for Unit, Owner, Charge, Maintenance, Invoice

**Frontend:**
- ✅ Dashboard component (partial)
- ✅ Coproperty list component (partial)
- ✅ Services: CopropertyService with GraphQL queries
- ✅ Models/interfaces

### ❌ Missing / Incomplete

**Backend:**
- ❌ UpdateCoproperty mutation
- ❌ Charge distribution algorithms implementation
- ❌ Invoice generation from FundCalls
- ❌ Payment recording and invoice status updates
- ❌ Maintenance workflow (assign, complete)
- ❌ Financial calculations (balances per owner/unit)
- ❌ RBAC implementation with Keycloak roles
- ❌ Notification integration
- ❌ Document service integration

**Frontend:**
- ❌ Complete dashboard (missing charts, activity feed)
- ❌ Coproperty detail page
- ❌ Unit management UI (list, create, edit)
- ❌ Owner management UI (list, create, edit, assign to units)
- ❌ Charge management UI (create, distribute, view history)
- ❌ FundCall wizard (create, preview invoices, send)
- ❌ Invoice list and payment recording
- ❌ Maintenance request management
- ❌ **Owner Portal** (proprietaire view)
- ❌ Payment interface for owners
- ❌ Financial reports UI
- ❌ Search and filters
- ❌ Form validation

---

## Implementation Phases

### Phase 1: Core Backend Completion (Priority 1)

**Goal:** Complete all essential backend services and GraphQL APIs

#### Task 1.1: Complete Coproperty CRUD
- [x] Add UpdateCoproperty mutation
- [ ] Add input DTOs validation
- [ ] Test all CRUD operations

#### Task 1.2: Complete Charge Distribution
- [ ] Implement ByShares algorithm
- [ ] Implement ByArea algorithm
- [ ] Implement Equal algorithm
- [ ] Implement Custom algorithm
- [ ] Create ChargeDistribution records
- [ ] Add validation (total shares, areas)

#### Task 1.3: Invoice Generation
- [ ] Create GenerateInvoicesFromFundCall mutation
- [ ] Link to Invoice service
- [ ] Create invoice for each unit/owner
- [ ] Calculate amounts from distributions
- [ ] Set due dates, status

#### Task 1.4: Payment Integration
- [ ] Implement RecordPayment mutation
- [ ] Update invoice status (Pending → Paid)
- [ ] Calculate balances per owner
- [ ] Link to Payment service/Stripe

#### Task 1.5: Maintenance Workflow
- [ ] Implement AssignMaintenance mutation
- [ ] Implement UpdateMaintenanceStatus mutation
- [ ] Implement CompleteMaintenance mutation
- [ ] Add file upload support
- [ ] Add comments/history

#### Task 1.6: Financial Reports
- [ ] Implement balance calculations
- [ ] Complete GetFinancialReport query
- [ ] Add GetOwnerBalance query
- [ ] Add GetUnitBalance query

---

### Phase 2: Admin UI (Syndic Interface) (Priority 1)

**Goal:** Build complete admin interface for coproperty management

#### Task 2.1: Enhanced Dashboard
- [ ] Fix all KPIs with real data
- [ ] Add Treasury Evolution chart (Chart.js)
- [ ] Add Charges Distribution pie chart
- [ ] Add Recent Activity feed
- [ ] Add Quick Actions buttons

#### Task 2.2: Coproperty Management
- [ ] Complete coproperty list (table with filters)
- [ ] Add create/edit forms
- [ ] Build coproperty detail page:
  - Basic info tab
  - Units list tab
  - Owners summary tab
  - Financial overview tab
  - Maintenance requests tab

#### Task 2.3: Unit Management
- [ ] Build unit list component
- [ ] Add unit create/edit forms
- [ ] Add assign owner dialog
- [ ] Show unit financial history
- [ ] Add bulk operations

#### Task 2.4: Owner Management
- [ ] Build owner list component
- [ ] Add owner create/edit forms
- [ ] Link owners to units with %
- [ ] Show owner's units
- [ ] Show owner's invoices
- [ ] Add contact owner button

#### Task 2.5: Charge Management
- [ ] Build charge list
- [ ] Create charge form with distribution preview
- [ ] Show distribution breakdown table
- [ ] Add edit/delete charges
- [ ] Add charge history by year

#### Task 2.6: FundCall Wizard
- [ ] Step 1: Select coproperty
- [ ] Step 2: Create/select charge
- [ ] Step 3: Choose distribution method
- [ ] Step 4: Preview distributions
- [ ] Step 5: Preview invoices
- [ ] Step 6: Confirm and send

#### Task 2.7: Invoice & Payment Management
- [ ] Build invoice list with filters
- [ ] Add invoice detail view
- [ ] Build payment recording form
- [ ] Show payment history
- [ ] Add overdue invoice alerts
- [ ] Add send reminder button

#### Task 2.8: Maintenance Management
- [ ] Build maintenance request list (table/kanban)
- [ ] Add create request form
- [ ] Add assign to technician
- [ ] Add status update workflow
- [ ] Add file upload
- [ ] Show request history

---

### Phase 3: Owner Portal (Proprietaire Interface) (Priority 1)

**Goal:** Build owner-facing interface for viewing and paying invoices

#### Task 3.1: Owner Dashboard
- [ ] Show "My Units" cards
- [ ] Show "Pending Invoices" list
- [ ] Show "Payment History" table
- [ ] Show "My Maintenance Requests"
- [ ] Add quick pay button

#### Task 3.2: Owner Invoice View
- [ ] List all invoices (pending, paid, overdue)
- [ ] Filter by date, status
- [ ] Show invoice details
- [ ] Download invoice PDF

#### Task 3.3: Payment Interface
- [ ] Select invoice(s) to pay
- [ ] Choose payment method (Stripe card / bank transfer)
- [ ] Process Stripe payment
- [ ] Show payment confirmation
- [ ] Download receipt

#### Task 3.4: Owner Maintenance Requests
- [ ] Create new request form
- [ ] View my requests
- [ ] Add photos
- [ ] Track status

#### Task 3.5: Owner Documents
- [ ] View coproperty documents (rules, PV AG)
- [ ] Download documents
- [ ] Filter by category

---

### Phase 4: Access Control & Security (Priority 2)

#### Task 4.1: RBAC Implementation
- [ ] Define roles in Keycloak: Admin, Syndic, Owner, CouncilMember
- [ ] Add [Authorize] attributes to GraphQL resolvers
- [ ] Implement permission checks in services
- [ ] Add frontend route guards
- [ ] Test all permission scenarios

#### Task 4.2: Data Filtering by User
- [ ] Owners see only their data
- [ ] Syndic sees all data for managed coproperties
- [ ] Implement user context in queries

---

### Phase 5: Integrations (Priority 2)

#### Task 5.1: Notification Service
- [ ] Integrate with existing Notification Service
- [ ] Send notification on new fund call
- [ ] Send payment reminders
- [ ] Send maintenance updates
- [ ] Send document notifications

#### Task 5.2: Document Service
- [ ] Link coproperty documents to Document Service
- [ ] Upload documents UI
- [ ] Download documents
- [ ] Categorize documents

#### Task 5.3: Stripe Payment
- [ ] Set up Stripe integration
- [ ] Create payment intents
- [ ] Handle webhooks
- [ ] Process refunds

---

### Phase 6: Reporting & Analytics (Priority 3)

#### Task 6.1: Financial Reports
- [ ] Annual balance sheet
- [ ] Charge distribution report
- [ ] Treasury evolution chart
- [ ] Export to PDF
- [ ] Export to Excel

#### Task 6.2: Search & Filters
- [ ] Global search (coproperties, units, owners)
- [ ] Advanced filters
- [ ] Save filter presets

---

### Phase 7: Testing & Quality (Priority 2)

#### Task 7.1: Backend Unit Tests
- [ ] Test CopropertyService
- [ ] Test ChargeService (distribution algorithms)
- [ ] Test FinanceService (calculations)
- [ ] Mock repositories

#### Task 7.2: Integration Tests
- [ ] Test all GraphQL queries
- [ ] Test all mutations
- [ ] Test authorization

#### Task 7.3: E2E Tests
- [ ] Test: Create coproperty → units → owners → charge → fund call → payment
- [ ] Test admin perspective
- [ ] Test owner perspective

---

## Next Immediate Steps

1. **Complete UpdateCoproperty mutation** (backend)
2. **Implement charge distribution algorithms** (backend)
3. **Build invoice generation from fund calls** (backend)
4. **Complete admin dashboard UI** (frontend)
5. **Build owner portal dashboard** (frontend)

---

## Technology Stack Confirmation

- **Backend:** .NET 10, EF Core, HotChocolate GraphQL, PostgreSQL
- **Frontend:** Angular 17, Nx, Apollo Client, Angular Material / PrimeNG
- **Auth:** Keycloak JWT
- **Payments:** Stripe
- **Storage:** Document Service (existing)
- **Notifications:** Notification Service (existing)

---

## Database Migrations Needed

- [ ] Ensure all tables exist
- [ ] Add missing indexes
- [ ] Add audit columns (CreatedBy, UpdatedBy)
- [ ] Seed test data for development
