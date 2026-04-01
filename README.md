# MYB - Manage Your Business Platform

A comprehensive, modular SaaS platform combining ERP and CRM functionalities designed for small and medium-sized enterprises (SMEs) and entrepreneurs.

## Table of Contents

- [Quick Start](#quick-start)
- [Latest Updates](#-latest-updates-march-2026)
- [Project Overview](#project-overview)
- [System Architecture](#system-architecture)
- [Dependencies](#dependencies)
- [Initial Setup](#initial-setup)
- [Component Documentation](#component-documentation)
  - [User Manager Service](#1-user-manager-service)
  - [Document Management Service](#2-document-management-service)
  - [Invoice Management Service](#3-invoice-management-service)
  - [Timesheet Management Service](#4-timesheet-management-service)
  - [Coproperty Management Service](#5-coproperty-management-service)
  - [Mailer Service](#6-mailer-service-smtp-configuration)
  - [Notification Service](#7-notification-service-real-time-updates)
- [SMTP Configuration](#smtp-configuration)
- [Running the Application](#running-the-application)
- [Access Points](#access-points)
- [Debugging Guide](#debugging-guide)
- [Keycloak Configuration](#keycloak-configuration)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)
- [GitFlow Workflow](#gitflow-workflow)
- [Migration Roadmap](#migration-roadmap)

---

## Quick Start

**Deploy entire stack with ONE command:**

```bash
./myb.sh
```

This unified master script will:
1. ✅ Check Docker installation and health
2. ✅ Detect and clean duplicate images
3. ✅ Build frontend (Angular) locally
4. ✅ Build all Docker images
5. ✅ Start all services (9 services + 4 databases)
6. ✅ Monitor service health
7. ✅ Display access URLs and commands

**Quick reference:**
```bash
./myb.sh                    # Full deployment (everything)
./myb.sh --quick            # Fast restart (no rebuild)
./myb.sh --clean            # Clean + deploy
./myb.sh --rebuild          # Force full rebuild
./myb.sh --cleanup          # Cleanup resources
./myb.sh --cleanup-all      # Full cleanup
./myb.sh --frontend-only    # Build frontend only
./myb.sh --status           # Show service status
./myb.sh --logs             # Tail service logs
./myb.sh --help             # Show all commands
```

**After deployment:**
- 🌐 **Frontend**: http://localhost:4200
- 🔐 **Keycloak**: http://localhost:8080 (admin/admin)
- 🛠️ **APIs**: http://localhost:8082-8087

See documentation for more: `./myb.sh --help`

---

## Project Overview

**MYB** is an enterprise management platform providing:
- **Document Management**: File organization, versioning, and sharing
- **Invoice Management**: Client management, product catalogs, invoice generation
- **Timesheet Management**: Time tracking, project management, approval workflows
- **User Management**: User profiles, roles, and permissions
- **Payment Processing**: Stripe integration for subscription management
- **Real-time Notifications**: SignalR-based notification system

### Technology Stack

**Frontend:**
- Angular 17+
- Nx Monorepo
- TypeScript 4.8+
- Bootstrap 5 UI Framework
- Apollo Angular (GraphQL client)
- RxJS 7.0+ (Reactive Programming)

**Backend:**
- ASP.NET Core 7.0+
- Entity Framework Core 7.0+
- PostgreSQL 14+ (Database per service)
- HotChocolate (GraphQL)
- Keycloak (Identity Provider)
- SMTP (SendGrid/Gmail for email)
- SignalR (Real-time notifications)

**DevOps:**
- Docker & Docker Compose
- GitLab CI/CD
- Railway/Render Deployment
- OVH Cloud VPS

---

## 🆕 Latest Updates (March 2026)

### ✅ New Features Added

#### 1. **Coproperty Management Module** 
Complete property management system for real estate cooperatives:
- **Admin Portal (Syndic)**: Full property, unit, owner, and charge management
- **Owner Portal (Propriétaire)**: View properties, assemblies, pay invoices, create maintenance requests
- **Advanced Charge Distribution**: Support for ByShares, ByArea, and Equal distribution algorithms
- **Financial Dashboard**: Invoice tracking, payment management, treasury evolution
- **Assembly Management**: Create meetings, upload agendas, generate calendar exports (.ics)

**Key Features:**
- ✅ Multi-unit property management
- ✅ Flexible charge distribution algorithms
- ✅ Automatic invoice generation from fund calls
- ✅ Payment tracking and reconciliation
- ✅ Maintenance request system
- ✅ Assembly/Meeting scheduling

#### 2. **Mailer Service (SMTP Configuration)**
Comprehensive email delivery system:
- **Multiple SMTP Providers**: SendGrid, Gmail, custom SMTP, MailHog (dev)
- **Email Templates**: Automated templates for invoices, payments, notifications
- **Batch Email Sending**: Efficient bulk email operations
- **Delivery Tracking**: Email logging and failure retry mechanism
- **Environment Configuration**: Easy SMTP setup via .env file

**Supported Email Types:**
- Invoice notifications and reminders
- Payment confirmations
- Maintenance request updates
- Assembly notifications
- User registration and password reset

#### 3. **Notification Service (Real-time Updates)**
SignalR-based real-time notification system:
- **WebSocket Communication**: Live notifications to browser clients
- **In-App Notification Center**: Notification history and management
- **Notification Preferences**: User-configurable notification channels
- **Multiple Delivery Methods**: In-app, email, and SMS options
- **Event Streaming**: Automatic notifications for all platform events

**Notification Types:**
- Invoice created/updated/paid
- Maintenance status changes
- Assembly scheduled/updated
- Fund call announcements
- System alerts and warnings

### Service Count: 7 Active Microservices
1. ✅ User Manager Service
2. ✅ Document Management Service
3. ✅ Invoice Management Service
4. ✅ Timesheet Management Service
5. ✅ **Coproperty Management Service** (NEW)
6. ✅ **Mailer Service** (NEW)
7. ✅ **Notification Service** (NEW)
8. ✅ Payment Service
9. ✅ API Orchestration Gateway

### Recent Completions
- ✅ Phase 3: Complete testing & validation
- ✅ Seed data implementation (35 units, 25 owners, 20+ invoices)
- ✅ 28 unit tests (FinanceService, InvoiceRepository)
- ✅ E2E testing guide with 50+ test cases
- ✅ Production-ready deployment configurations

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Client Applications                         │
│             (Angular 17 + Nx Monorepo)                      │
├─────────────────────────────────────────────────────────────┤
│              API Gateway & GraphQL Layer                     │
│               (Apollo Server / Orchestration)                │
├─────────────────────────────────────────────────────────────┤
│           Authentication & Authorization                     │
│                   (Keycloak/OAuth2/JWT)                     │
├─────────────┬──────────────┬──────────────┬────────────────┤
│  Document   │   Invoice    │  Timesheet   │Coproperty Mgmt │
│  Service    │   Service    │   Service    │   Service      │
├─────────────┼──────────────┼──────────────┼────────────────┤
│   User      │  Notification│   Mailer     │   Payment      │
│  Manager    │    Service   │   Service    │    Service     │
├──────┬──────┴──────┬───────┴──────┬──────┴────────────────┤
│      │ Real-time   │ SMTP/Email   │ Stripe Integration   │
│      │ SignalR     │ SendGrid/Gmail│ Webhook Handler    │
└──────┴─────────────┴───────────────┴─────────────────────┘
│
├─ PostgreSQL Databases (one per service)
├─ Keycloak Authentication DB
├─ Redis Cache (optional)
└─ File Storage (local or cloud)

### Project Directory Structure

```
myb/
├── src/
│   ├── front/                          # Frontend (Nx Monorepo)
│   │   └── myb.front/
│   │       ├── apps/
│   │       │   ├── admin/              # Admin application (Syndic portal)
│   │       │   └── client/             # Client application (Owner portal)
│   │       └── libs/                   # Shared libraries
│   │           ├── auth/               # Authentication module
│   │           ├── shared/             # Shared components
│   │           ├── document-module/    # Document feature module
│   │           ├── invoice-module/     # Invoice feature module
│   │           ├── timesheet-module/   # Timesheet feature module
│   │           └── coproperty-module/  # Coproperty feature module
│   │
│   ├── services/                       # Microservices (7 services)
│   │   ├── user-manager/               # User management service
│   │   ├── document-management/        # Document service
│   │   ├── invoice-management/         # Invoice service
│   │   ├── time-sheet/                 # Timesheet service
│   │   ├── coproperty-management/      # Property management service
│   │   ├── mailer-service/             # Email/SMTP service
│   │   ├── notification-service/       # Real-time notifications (SignalR)
│   │   ├── payment-service/            # Stripe integration
│   │   └── AllServicesStarter/         # Orchestration
│   │
│   ├── common/                         # Shared backend libraries
│   │   ├── Myb.Common.Authentification/
│   │   ├── Myb.Common.GraphQL.Infra/
│   │   ├── Myb.Common.Models/
│   │   ├── Myb.Common.Repositories/
│   │   ├── Myb.Common.Stripe/
│   │   ├── Myb.Common.Email/           # Email utilities
│   │   └── Myb.Common.Utils/
│   │
│   ├── orchestration/                  # API Gateway
│   │   └── Myb.Orchestration/
│   │
│   └── tests/                          # Test projects
│       ├── unit-tests/
│       └── end-2-end-tests/
│
├── docker-compose.yml                  # Service orchestration
├── Dockerfile                          # Container configuration
├── keycloak-db-init/                   # Keycloak database init
├── scripts/                            # Automation scripts
├── docs/                               # Documentation
├── package.json                        # Node dependencies
├── Myb.sln                             # Visual Studio solution
└── README.md                           # This file
```

---

## Dependencies

### Required Software

#### Global Dependencies

| Dependency | Version | Purpose |
|-----------|---------|---------|
| **Git** | 2.30+ | Version control |
| **Docker Desktop** | 4.0+ | Container runtime |
| **.NET SDK** | 7.0+ | Backend framework |
| **Node.js** | 18+ | Frontend runtime |
| **npm** | 9.0+ | Package manager |
| **PostgreSQL** | 14+ | Database (optional locally) |

#### Backend Dependencies

```bash
# Core frameworks
- ASP.NET Core 7.0+
- Entity Framework Core 7.0+
- HotChocolate GraphQL

# Authentication
- Keycloak integration
- JWT token handling
- IdentityModel

# Real-time Communication
- SignalR (WebSockets)
- SignalR client libraries

# Email & Notifications
- SendGrid SDK (Email delivery)
- SMTP client configuration
- Email templates

# Payment Processing
- Stripe SDK
- Stripe CLI (for webhooks)

# Database
- Npgsql (PostgreSQL driver)
- Entity Framework Core
- Migrations support

# Caching & Messaging
- Redis (optional)
- StackExchange.Redis
```

#### Frontend Dependencies

```bash
# Core frameworks
- Angular 17+
- Nx framework
- TypeScript 4.8+
- RxJS 7.0+

# GraphQL & API
- Apollo Angular
- @apollo/client

# UI & Components
- Bootstrap 5
- Bootstrap Icons
- ngx-bootstrap

# Real-time Communication
- @aspnet/signalr (SignalR client)
- ngx-socket-io (optional alternative)

# Payment Integration
- ngx-stripe
- Stripe.js

# Utility Libraries
- ngx-mask (input masking)
- D3.js (charts)
- jsPDF (PDF generation)
- ngxs (state management)
```

### Installation Commands

```bash
# macOS - Install Homebrew dependencies
brew install git docker-desktop dotnet node postgresql

# Verify installations
git --version
docker --version
dotnet --version
node --version
npm --version
```

---

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/NBM96/MYB.git
cd myb
```

### 2. Start Docker Services

```bash
# Build and start all services
docker-compose up -d

# Verify services are running
docker-compose ps

# Expected output:
# NAME                  STATUS
# keycloak             Up (healthy)
# timesheetDB          Up
# documentDB           Up
# invoiceDB            Up
# postgres_data        Up (volume)
```

### 3. Backend Setup

```bash
# Restore dependencies for all services
cd src/services

# User Manager Service
cd user-manager/Myb.UserManager
dotnet restore
dotnet build

# Document Management Service
cd ../../document-management/Myb.Document
dotnet restore
dotnet build

# Invoice Management Service
cd ../../invoice-management/Myb.Invoice
dotnet restore
dotnet build

# Timesheet Service
cd ../../time-sheet/Myb.Timesheet
dotnet restore
dotnet build

cd ../../../..  # Back to root
```

### 4. Frontend Setup

```bash
cd src/front/myb.front

# Install dependencies
npm install

# Or with yarn
yarn install

cd ../../../..  # Back to root
```

---

## Component Documentation

### 1. User Manager Service

#### Functional Documentation

**Features:**
- User account management
- User profile customization
- Role assignment
- Permission management
- Integration with Keycloak for authentication

**User Roles:**
- **Admin**: Full system access, user management, role assignment
- **Manager**: Manage team members, view reports
- **Employee**: Access assigned modules, submit timesheets
- **Client**: Limited access to specific documents and invoices

**Key Workflows:**
1. User Registration → Email Verification → Account Activation
2. Role Assignment → Permission Sync → Access Granted
3. Profile Update → Audit Log Entry → Notification Sent

**Related Files:**
- `src/services/user-manager/` - Service implementation
- `src/common/Myb.Common.Authentification/` - Auth utilities

#### Technical Documentation

**Architecture:**
```
Myb.UserManager (API)
    ├── Controllers/
    │   ├── UsersController.cs
    │   └── RolesController.cs
    ├── Services/
    │   ├── UserService.cs
    │   └── RoleService.cs
    ├── Models/
    │   ├── User.cs
    │   └── Role.cs
    └── Infrastructure/
        ├── Repositories/
        └── GraphQL Mutations
```

**Database Schema:**
```sql
Users
  ├── Id (GUID)
  ├── Username (string)
  ├── Email (string)
  ├── FirstName (string)
  ├── LastName (string)
  ├── IsActive (bool)
  └── CreatedAt (DateTime)

Roles
  ├── Id (GUID)
  ├── Name (string)
  ├── Description (string)
  └── Permissions (List<Permission>)
```

**Key Classes:**
- `User` - User entity model
- `Role` - Role entity model
- `UserService` - Business logic for user management
- `RoleService` - Business logic for role management

**GraphQL Endpoints:**
```graphql
mutation CreateUser {
  createUser(input: {
    username: "john_doe"
    email: "john@example.com"
    firstName: "John"
    lastName: "Doe"
  }) {
    id
    username
    email
  }
}
```

---

### 2. Document Management Service

#### Functional Documentation

**Features:**
- File upload/download (PDF, DOC, XLS, Images)
- Document preview and viewing
- Folder organization with nested folders
- Document versioning with history
- Document sharing with team members
- Quick access/pinning frequently used documents
- Full-text search functionality

**Supported Formats:**
- Documents: PDF, DOC, DOCX, XLS, XLSX
- Images: JPG, PNG, GIF, SVG
- Archives: ZIP

**User Workflows:**
1. **Upload Document** → Folder Selection → Automatic Versioning → Share with Users
2. **Organize** → Create Folders → Move Documents → Pin Favorites
3. **Access** → Search → Preview → Download → Track Versions

**Access Controls:**
- Document Owner: Full access (view, edit, share, delete)
- Shared Users: Configurable access (view, download)
- Admins: Override access to all documents

**Related Files:**
- `src/services/document-management/` - Service implementation
- `src/front/myb.front/libs/document-module/` - Frontend module

#### Technical Documentation

**Architecture:**
```
Myb.Document (API)
    ├── Controllers/
    │   ├── DocumentsController.cs
    │   ├── FoldersController.cs
    │   └── DocumentVersionController.cs
    ├── Services/
    │   ├── DocumentService.cs
    │   ├── FolderService.cs
    │   └── StorageService.cs
    └── Models/
        ├── Document.cs
        ├── Folder.cs
        └── DocumentVersion.cs
```

**Database Schema:**
```sql
Folders
  ├── Id (GUID)
  ├── Name (string)
  ├── ParentFolderId (GUID, nullable)
  ├── OwnerId (GUID)
  ├── CreatedAt (DateTime)
  └── UpdatedAt (DateTime)

Documents
  ├── Id (GUID)
  ├── Name (string)
  ├── FolderId (GUID)
  ├── FileSize (long)
  ├── MimeType (string)
  ├── UploadedBy (GUID)
  ├── UploadedAt (DateTime)
  └── IsDeleted (bool)

DocumentVersions
  ├── Id (GUID)
  ├── DocumentId (GUID)
  ├── VersionNumber (int)
  ├── FileSize (long)
  ├── UploadedBy (GUID)
  ├── UploadedAt (DateTime)
  └── ChangeDescription (string)
```

**Key Services:**
- `DocumentService` - CRUD operations for documents
- `FolderService` - Folder management
- `StorageService` - File storage management

---

### 3. Invoice Management Service

#### Functional Documentation

**Features:**
- Client management (add, edit, archive)
- Contact management per client
- Product/service catalog
- Tax configuration (percentage and fixed)
- Invoice creation and editing
- Automatic calculations and tax application
- Invoice PDF generation
- Invoice archiving and status tracking

**Key Workflows:**
1. **Setup** → Create Clients → Add Products → Configure Taxes
2. **Invoice Creation** → Select Client → Add Items → Apply Tax → Generate PDF
3. **Tracking** → View Invoice Status → Send to Client → Mark as Paid

**User Roles:**
- **Admin**: Full access to all invoices and configurations
- **Manager**: Create and manage client invoices
- **Accountant**: View-only access for reporting

**Related Files:**
- `src/services/invoice-management/` - Service implementation
- `src/front/myb.front/libs/invoice-module/` - Frontend module

#### Technical Documentation

**Architecture:**
```
Myb.Invoice (API)
    ├── Controllers/
    │   ├── InvoicesController.cs
    │   ├── ClientsController.cs
    │   ├── ProductsController.cs
    │   └── TaxController.cs
    ├── Services/
    │   ├── InvoiceService.cs
    │   ├── ClientService.cs
    │   ├── ProductService.cs
    │   └── TaxService.cs
    └── Models/
        ├── Invoice.cs
        ├── Client.cs
        ├── Product.cs
        └── Tax.cs
```

**Database Schema:**
```sql
Clients
  ├── Id (GUID)
  ├── Name (string)
  ├── ClientType (enum)
  ├── Email (string)
  ├── Phone (string)
  ├── Address (string)
  └── IsActive (bool)

Products
  ├── Id (GUID)
  ├── Name (string)
  ├── ProductType (enum)
  ├── UnitPrice (decimal)
  ├── TaxId (GUID)
  └── Unit (string)

Invoices
  ├── Id (GUID)
  ├── InvoiceNumber (string, unique)
  ├── ClientId (GUID)
  ├── InvoiceDate (DateTime)
  ├── DueDate (DateTime)
  ├── Subtotal (decimal)
  ├── TaxAmount (decimal)
  ├── Total (decimal)
  ├── Status (enum)
  └── CreatedAt (DateTime)

InvoiceDetails
  ├── Id (GUID)
  ├── InvoiceId (GUID)
  ├── ProductId (GUID)
  ├── Quantity (decimal)
  ├── UnitPrice (decimal)
  └── Amount (decimal)

Taxes
  ├── Id (GUID)
  ├── Name (string)
  ├── Rate (decimal)
  └── Type (enum: Percentage|Fixed)
```

**Key Calculations:**
```csharp
// Calculate invoice total
Subtotal = Sum(InvoiceDetails.Amount)
TaxAmount = Subtotal * (TaxRate / 100)  // For percentage taxes
Total = Subtotal + TaxAmount
```

---

### 4. Timesheet Service

#### Functional Documentation

**Features:**
- **Employee Features:**
  - Record time entries (daily/weekly)
  - Assign tasks to time entries
  - View project details
  - Submit timesheets for approval
  - Request leave
  - Export timesheet to PDF

- **Manager Features:**
  - Approve/reject timesheets
  - Create and manage projects
  - Assign employees to projects
  - Create tasks for projects
  - Approve/reject leave requests
  - Generate timesheet reports
  - View team utilization

**Key Workflows:**
1. **Time Entry** → Project Selection → Task Assignment → Hours Entry → Submit
2. **Approval** → Timesheet Review → Approval Decision → Notification
3. **Reporting** → Aggregate Data → Generate Reports → Export Results

**Access Controls:**
- Employee: View own timesheets, submit entries
- Manager: Approve team timesheets, manage projects
- Admin: Full access

**Related Files:**
- `src/services/time-sheet/` - Service implementation
- `src/front/myb.front/libs/timesheet-module/` - Frontend module

#### Technical Documentation

**Architecture:**
```
Myb.Timesheet (API)
    ├── Controllers/
    │   ├── TimesheetsController.cs
    │   ├── TimeEntriesController.cs
    │   ├── ProjectsController.cs
    │   ├── TasksController.cs
    │   └── LeaveController.cs
    ├── Services/
    │   ├── TimesheetService.cs
    │   ├── ProjectService.cs
    │   ├── TaskService.cs
    │   ├── LeaveService.cs
    │   └── ReportService.cs
    └── Models/
        ├── Timesheet.cs
        ├── TimeEntry.cs
        ├── Project.cs
        ├── Task.cs
        └── LeaveRequest.cs
```

**Database Schema:**
```sql
Projects
  ├── Id (GUID)
  ├── Name (string)
  ├── Description (text)
  ├── StartDate (DateTime)
  ├── EndDate (DateTime)
  ├── Status (enum)
  ├── ManagerId (GUID)
  └── CreatedAt (DateTime)

Employees
  ├── Id (GUID)
  ├── UserId (GUID)
  ├── ProjectId (GUID)
  ├── Role (string)
  └── HireDate (DateTime)

Timesheets
  ├── Id (GUID)
  ├── EmployeeId (GUID)
  ├── WeekStartDate (DateTime)
  ├── WeekEndDate (DateTime)
  ├── ApprovalStatus (enum)
  ├── ApprovedBy (GUID, nullable)
  └── SubmittedAt (DateTime)

TimeEntries
  ├── Id (GUID)
  ├── TimesheetId (GUID)
  ├── ProjectId (GUID)
  ├── TaskId (GUID)
  ├── EntryDate (DateTime)
  ├── Hours (decimal)
  └── Description (string)

Tasks
  ├── Id (GUID)
  ├── Name (string)
  ├── ProjectId (GUID)
  ├── AssignedTo (GUID)
  ├── DueDate (DateTime)
  └── Status (enum)

LeaveRequests
  ├── Id (GUID)
  ├── EmployeeId (GUID)
  ├── StartDate (DateTime)
  ├── EndDate (DateTime)
  ├── LeaveType (enum)
  ├── Status (enum)
  └── ApprovedBy (GUID, nullable)
```

---

### 5. Coproperty Management Service

#### Functional Documentation

**Features:**
- **Admin (Syndic) Interface:**
  - Property management (add, edit, archive coproperties)
  - Unit management (add units, assign owners)
  - Owner management (track owners per unit)
  - Charge management (create charges, distribute by shares/area/equal)
  - Fund call creation and tracking
  - Invoice generation and payment tracking
  - Maintenance request management
  - Financial dashboard and reports
  - Assembly/Meeting management

- **Owner Portal (Propriétaire):**
  - View coproperty and unit details
  - View assemblies and agendas
  - Download calendar events (.ics format)
  - Create maintenance requests
  - View and pay invoices
  - Track payment history
  - Export documents (PDF)

**Key Workflows:**
1. **Coproperty Setup** → Add Units → Assign Owners → Configure Charges
2. **Charge Distribution** → Create Charge → Select Algorithm (ByShares/ByArea/Equal) → Generate Invoices
3. **Fund Call** → Create Call → Calculate Distributions → Generate Invoices → Track Payments
4. **Assembly Management** → Create Meeting → Upload Agenda → Notify Owners → Export Calendar

**Charge Distribution Algorithms:**
- **ByShares**: `distribution = (totalAmount × unitShares) / totalShares`
- **ByArea**: `distribution = (totalAmount × unitArea) / totalArea`
- **Equal**: `distribution = totalAmount / numberOfUnits`

**Related Files:**
- `src/services/coproperty-management/` - Service implementation
- `src/front/myb.front/libs/coproperty-module/` - Frontend module

#### Technical Documentation

**Architecture:**
```
Myb.Coproperty (API)
    ├── Controllers/
    │   ├── CopropertiesController.cs
    │   ├── UnitsController.cs
    │   ├── OwnersController.cs
    │   ├── ChargesController.cs
    │   ├── FundCallsController.cs
    │   ├── InvoicesController.cs
    │   ├── PaymentsController.cs
    │   └── MaintenanceController.cs
    ├── Services/
    │   ├── CopropertyService.cs
    │   ├── UnitService.cs
    │   ├── OwnerService.cs
    │   ├── ChargeService.cs
    │   ├── FinanceService.cs
    │   ├── FundCallService.cs
    │   └── MaintenanceService.cs
    ├── Models/
    │   ├── Coproperty.cs
    │   ├── Unit.cs
    │   ├── Owner.cs
    │   ├── Charge.cs
    │   ├── ChargeDistribution.cs
    │   ├── CopropertyInvoice.cs
    │   ├── Payment.cs
    │   ├── FundCall.cs
    │   ├── MaintenanceRequest.cs
    │   └── Assembly.cs
    └── GraphQL/
        ├── Queries/
        └── Mutations/
```

**Database Schema:**
```sql
Coproperties
  ├── Id (GUID)
  ├── Name (string)
  ├── Address (string)
  ├── City (string)
  ├── PostalCode (string)
  ├── SyndicId (GUID)
  ├── TotalUnits (int)
  └── CreatedAt (DateTime)

Units
  ├── Id (GUID)
  ├── CopropertyId (GUID)
  ├── UnitNumber (string)
  ├── Area (decimal)
  ├── Shares (decimal)
  ├── UnitType (string)
  └── Status (enum)

Owners
  ├── Id (GUID)
  ├── UnitId (GUID)
  ├── UserId (GUID)
  ├── IsMainOwner (bool)
  ├── OwnershipPercentage (decimal)
  └── JoinDate (DateTime)

Charges
  ├── Id (GUID)
  ├── CopropertyId (GUID)
  ├── Name (string)
  ├── Amount (decimal)
  ├── DistributionMethod (enum: ByShares|ByArea|Equal)
  ├── ChargingDate (DateTime)
  └── IsActive (bool)

ChargeDistributions
  ├── Id (GUID)
  ├── ChargeId (GUID)
  ├── UnitId (GUID)
  ├── Amount (decimal)
  └── CreatedAt (DateTime)

CopropertyInvoices
  ├── Id (GUID)
  ├── InvoiceNumber (string)
  ├── CopropertyId (GUID)
  ├── UnitId (GUID)
  ├── OwnerId (GUID)
  ├── Amount (decimal)
  ├── Status (enum: Pending|Paid|PartiallyPaid)
  ├── DueDate (DateTime)
  └── CreatedAt (DateTime)

Payments
  ├── Id (GUID)
  ├── InvoiceId (GUID)
  ├── Amount (decimal)
  ├── PaymentDate (DateTime)
  ├── PaymentMethod (string)
  └── TransactionId (string)

FundCalls
  ├── Id (GUID)
  ├── CopropertyId (GUID)
  ├── ChargeId (GUID)
  ├── Name (string)
  ├── DueDate (DateTime)
  ├── Status (enum)
  └── CreatedAt (DateTime)

MaintenanceRequests
  ├── Id (GUID)
  ├── CopropertyId (GUID)
  ├── RequestedBy (GUID)
  ├── Description (string)
  ├── Status (enum)
  ├── Priority (enum)
  └── RequestedAt (DateTime)

Assemblies
  ├── Id (GUID)
  ├── CopropertyId (GUID)
  ├── Title (string)
  ├── MeetingDate (DateTime)
  ├── Location (string)
  └── CreatedAt (DateTime)
```

**Key Services:**
- `CopropertyService` - Property CRUD operations
- `ChargeService` - Charge management with distribution algorithms
- `FinanceService` - Dashboard stats, treasury evolution, financial reports
- `FundCallService` - Fund call creation and tracking
- `MaintenanceService` - Maintenance request management

---

### 6. Mailer Service (SMTP Configuration)

#### Functional Documentation

**Features:**
- SMTP email delivery (Gmail, SendGrid, or custom SMTP)
- Email template support
- Batch email sending
- Attachment support
- HTML and plain text emails
- Email logging and delivery tracking
- Retry mechanism for failed deliveries

**Supported Email Types:**
- Invoice notifications
- Payment confirmations
- Maintenance updates
- Assembly notifications
- User registration confirmatics
- Password reset emails
- General notifications

**Related Files:**
- `src/services/mailer-service/` - Service implementation
- `src/common/Myb.Common.Email/` - Email utilities

#### Technical Documentation

**Architecture:**
```
Myb.Mailer (Service)
    ├── Controllers/
    │   └── EmailController.cs
    ├── Services/
    │   ├── EmailService.cs
    │   ├── SmtpClientService.cs
    │   └── EmailTemplateService.cs
    ├── Models/
    │   ├── EmailMessage.cs
    │   ├── EmailTemplate.cs
    │   └── EmailLog.cs
    └── Configurations/
        └── SmtpSettings.cs
```

**SMTP Configuration (.env file):**
```env
# SendGrid Email Service (Recommended for Production)
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM_ADDRESS=noreply@myb.com
EMAIL_FROM_NAME=MYB Platform

# SMTP Configuration (Alternative)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_STARTTLS=true
SMTP_ENABLE_SSL=false
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
EMAIL_FROM_ADDRESS=your-email@gmail.com
SMTP_FROM_NAME=MYB Platform

# For Local Development (MailHog)
# SMTP_HOST=mailhog
# SMTP_PORT=1025
# EMAIL_FROM_ADDRESS=dev@myb.local
```

**Gmail Configuration (App Passwords):**
1. Enable 2-Factor Authentication on Gmail account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use generated 16-character password in `SMTP_PASSWORD`
4. Enable "Less secure app access" if needed

**SendGrid Configuration:**
1. Create SendGrid account at https://sendgrid.com
2. Generate API key in Settings → API Keys
3. Set `SENDGRID_API_KEY` environment variable
4. Use email address in `EMAIL_FROM_ADDRESS`

**Email Service Usage:**
```csharp
public class InvoiceService
{
    private readonly IEmailService _emailService;

    public async Task SendInvoiceEmail(Guid invoiceId)
    {
        var invoice = await GetInvoiceAsync(invoiceId);
        
        var emailMessage = new EmailMessage
        {
            To = invoice.Owner.Email,
            Subject = $"Invoice {invoice.InvoiceNumber}",
            TemplateName = "InvoiceNotification",
            TemplateData = new { Invoice = invoice }
        };

        await _emailService.SendAsync(emailMessage);
    }
}
```

**Email Templates:**
```
Templates/
├── InvoiceNotification.html
├── PaymentConfirmation.html
├── MaintenanceUpdate.html
├── AssemblyNotification.html
├── RegistrationConfirm.html
└── PasswordReset.html
```

---

### 7. Notification Service (Real-time Updates)

#### Functional Documentation

**Features:**
- Real-time notifications via SignalR
- In-app notification center
- Email and SMS notification options
- Notification preferences management
- Notification history and archiving
- Push notification support

**Notification Types:**
- Invoice created/updated
- Payment received
- Maintenance status changes
- Assembly scheduled/updated
- Fund call created
- Fund distribution changes
- System alerts
- User mentions

**Related Files:**
- `src/services/notification-service/` - Service implementation
- Real-time hub implementation in orchestration layer

#### Technical Documentation

**Architecture:**
```
Myb.Notification (Service)
    ├── Controllers/
    │   └── NotificationsController.cs
    ├── Hubs/
    │   └── NotificationHub.cs (SignalR)
    ├── Services/
    │   ├── NotificationService.cs
    │   ├── SignalRNotificationDispatcher.cs
    │   └── NotificationPreferenceService.cs
    ├── Models/
    │   ├── Notification.cs
    │   ├── NotificationPreference.cs
    │   └── NotificationEvent.cs
    └── Publishers/
        ├── InvoiceNotificationPublisher.cs
        ├── PaymentNotificationPublisher.cs
        └── MaintenanceNotificationPublisher.cs
```

**SignalR Hub Configuration:**
```csharp
public class NotificationHub : Hub
{
    public async Task NotifyClient(string userId, string message)
    {
        await Clients.User(userId).SendAsync("ReceiveNotification", message);
    }

    public async Task BroadcastToCoproperty(string copropertyId, string message)
    {
        await Clients.Group(copropertyId).SendAsync("ReceiveNotification", message);
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst("sub")?.Value;
        if (userId != null)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");
        }
        await base.OnConnectedAsync();
    }
}
```

**Frontend SignalR Connection:**
```typescript
import { HubConnectionBuilder } from '@aspnet/signalr';

export class NotificationService {
  private hubConnection: HubConnection;

  constructor() {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl('http://localhost:5008/notificationHub')
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('ReceiveNotification', (message) => {
      console.log('Notification:', message);
      // Update UI
    });
  }

  startConnection() {
    this.hubConnection.start()
      .catch(err => console.error('Connection failed', err));
  }
}
```

**Notification Model:**
```sql
Notifications
  ├── Id (GUID)
  ├── UserId (GUID)
  ├── Type (enum)
  ├── Title (string)
  ├── Message (string)
  ├── Data (JSON)
  ├── IsRead (bool)
  ├── ReadAt (DateTime, nullable)
  ├── CreatedAt (DateTime)
  └── ExpiresAt (DateTime)

NotificationPreferences
  ├── Id (GUID)
  ├── UserId (GUID)
  ├── NotificationType (enum)
  ├── IsEmailEnabled (bool)
  ├── IsPushEnabled (bool)
  ├── IsInAppEnabled (bool)
  └── UpdatedAt (DateTime)
```

---

## Running the Application

### Option 1: Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# Verify all services are running
docker-compose ps

# View logs for a specific service
docker-compose logs -f myb-front
docker-compose logs -f myb-timesheet

# Stop all services
docker-compose down

# Stop and remove volumes (careful!)
docker-compose down -v
```

### Option 2: Local Development (Multi-terminal)

#### Terminal 1: Start Keycloak

```bash
docker run -d \
  -p 8080:8080 \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin \
  -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin \
  docker.io/bitnami/keycloak:22
```

#### Terminal 2: Start Databases

```bash
docker run -d \
  --name timesheetDB \
  -p 5448:5432 \
  -e POSTGRES_PASSWORD=timesheet-pwd \
  -e POSTGRES_DB=timesheetDB \
  postgres:16.2

docker run -d \
  --name documentDB \
  -p 5433:5432 \
  -e POSTGRES_PASSWORD=document-pwd \
  -e POSTGRES_DB=documentDB \
  postgres:16.2

docker run -d \
  --name invoiceDB \
  -p 5434:5432 \
  -e POSTGRES_PASSWORD=invoice-pwd \
  -e POSTGRES_DB=invoiceDB \
  postgres:16.2
```

#### Terminal 3: Start Backend Services

```bash
cd src/services

# User Manager
cd user-manager/Myb.UserManager
dotnet run &

# Timesheet Service (new terminal)
cd ../../time-sheet/Myb.Timesheet
dotnet run &

# Document Service (new terminal)
cd ../../document-management/Myb.Document
dotnet run &

# Invoice Service (new terminal)
cd ../../invoice-management/Myb.Invoice
dotnet run &
```

#### Terminal 4: Start Frontend

```bash
cd src/front/myb.front
npm start

# Application will be available at http://localhost:4200
```

### Access Points

- **Frontend Application**: http://localhost:4200
  - Admin Portal (Syndic): `/admin`
  - Owner Portal (Propriétaire): `/client`
- **Keycloak Admin**: http://localhost:8080/admin (Credentials: admin/admin)
- **GraphQL API / Orchestration**: http://localhost:5000/graphql

**Microservices (GraphQL Endpoints):**
- **User Manager Service**: http://localhost:5001/graphql
- **Document Service**: http://localhost:5002/graphql
- **Invoice Service**: http://localhost:5003/graphql
- **Timesheet Service**: http://localhost:5004/graphql
- **Coproperty Management**: http://localhost:5005/graphql
- **Mailer Service**: http://localhost:5006
- **Notification Service**: http://localhost:5007
- **Payment Service**: http://localhost:5008/graphql
- **Notification Hub (SignalR)**: ws://localhost:5007/notificationHub

---

## SMTP Configuration

### Email Service Setup

The platform supports multiple email delivery methods:

#### Option 1: SendGrid (Recommended for Production)

```env
# .env or docker-compose environment
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM_ADDRESS=noreply@myb.com
EMAIL_FROM_NAME=MYB Platform
```

**Setup Steps:**
1. Create SendGrid account at https://sendgrid.com
2. Generate API key: Settings → API Keys
3. Add to `.env` file

#### Option 2: Gmail SMTP

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_STARTTLS=true
SMTP_ENABLE_SSL=false
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
EMAIL_FROM_ADDRESS=your-email@gmail.com
SMTP_FROM_NAME=MYB Platform
```

**Setup Steps:**
1. Enable 2-Factor Authentication on Gmail
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use 16-character app password in `SMTP_PASSWORD`
4. Add to `.env` file

#### Option 3: Custom SMTP Provider

```env
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_STARTTLS=true
SMTP_USERNAME=your-username
SMTP_PASSWORD=your-password
EMAIL_FROM_ADDRESS=your-email@domain.com
```

#### Option 4: Local Development (MailHog)

```bash
# MailHog configuration
SMTP_HOST=mailhog
SMTP_PORT=1025
EMAIL_FROM_ADDRESS=dev@myb.local

# Access MailHog UI at http://localhost:8025
```

### Email Service Architecture

```csharp
// Mailer Service automatically sends emails for:
- Invoice notifications (creation, payment reminder)
- Payment confirmations  
- Maintenance request updates
- Assembly notifications
- Fund call announcements
- User registration confirmations
- Password reset links
```

---

## Debugging Guide

### Visual Studio Code (Frontend)

1. Install **Debugger for Chrome** extension
2. Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Chrome",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:4200",
      "webRoot": "${workspaceFolder}/src/front/myb.front",
      "sourceMapPathOverride": {
        "webpack:///*": "${webspaceRoot}/*"
      }
    }
  ]
}
```

3. Start frontend with `npm start`
4. Press `F5` in VS Code to launch debugger

### Visual Studio (Backend)

1. Open `Myb.sln` in Visual Studio
2. Set startup project (e.g., `Myb.UserManager`)
3. Press `F5` to start debugging
4. Set breakpoints in code
5. Use Debug menu for stepping/watches

### Logging and Monitoring

```csharp
// Backend logging (appsettings.Development.json)
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft": "Warning",
      "MyServices": "Debug"
    }
  }
}
```

### Docker Container Debugging

```bash
# View logs
docker-compose logs -f [service-name]

# Execute commands in container
docker exec -it [container-id] bash

# Inspect container
docker inspect [container-id]

# Check network
docker network ls
docker network inspect my-network
```

### Common Issues

**Issue: Port already in use**
```bash
# Find process on port
lsof -i :4200
lsof -i :5432

# Kill process
kill -9 <PID>
```

**Issue: Database connection failed**
```bash
# Verify database is running
docker-compose ps

# Check connection string
# Format: Host=localhost;Port=5448;Database=timesheetDB;Username=postgres;Password=timesheet-pwd
```

**Issue: Keycloak not accessible**
```bash
# Verify Keycloak container
docker-compose logs keycloak

# Check if running
docker ps | grep keycloak
```

---

## Keycloak Configuration

### Initial Setup

1. **Access Keycloak Admin Console**
   ```
   http://localhost:8080/admin
   Credentials: admin / admin
   ```

2. **Create Realm**
   - Click "Master" dropdown → "Create realm"
   - Name: `MYB`
   - Click "Create"

3. **Create Client**
   - Navigate to "Clients"
   - Click "Create client"
   - Client ID: `MYB-client`
   - Client Type: `OpenID Connect`
   - Click "Next"
   
   **Configure Access:**
   - Valid Redirect URIs: `http://localhost:4200/*`
   - Valid post logout redirect URIs: `http://localhost:4200`
   - Web origins: `http://localhost:4200`
   - Click "Save"

4. **Generate Client Secret**
   - Go to "Credentials" tab
   - Copy the Client Secret
   - Update in `appsettings.json`:
     ```json
     {
       "Keycloak": {
         "Authority": "http://localhost:8080/realms/MYB",
         "ClientId": "MYB-client",
         "ClientSecret": "your-copied-secret"
       }
     }
     ```

5. **Create Roles**
   - Navigate to "Realm roles"
   - Click "Create role"
   - Create roles: `admin`, `manager`, `employee`, `client`
   - Click "Save" for each

6. **Create Users**
   - Navigate to "Users"
   - Click "Create user"
   - Fill in details:
     - Username: `admin`
     - Email: `admin@myb.com`
     - Email verified: ON
     - Enabled: ON
   - Click "Create"
   
   **Set Password:**
   - Go to "Credentials" tab
   - Click "Set password"
   - Enter password
   - Temporary: OFF
   - Click "Set password"
   
   **Assign Role:**
   - Go to "Role mapping"
   - Click "Assign role"
   - Select `admin` role
   - Click "Assign"

7. **Configure Scopes**
   - Go to Client → "MYB-client"
   - Navigate to "Client scopes"
   - Click "Add client scope"
   - Ensure `openid`, `profile`, `email` are included

### Database Initialization

The system includes automatic database initialization. To manually initialize:

```bash
# Run Keycloak DB init script
cat keycloak-db-init/create-keycloak-db.sql | \
  docker exec -i timesheetDB psql -U postgres

# Or use pgAdmin:
# 1. Open http://localhost:5050
# 2. Register server: localhost:5432
# 3. Execute SQL script
```

### JWT Token Configuration

**Token Expiration Settings:**
```
Realm Settings → Tokens
- Access Token Lifespan: 5 minutes
- Refresh Token Lifespan: 30 days
- Session Idle: 30 minutes
```

**Token Claims:**
Configure in Client → "Mappers":
- Add mapper for roles
- Add mapper for permissions
- Add mapper for custom claims

---

## Development Workflow

### Creating a New Feature

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Frontend Development**
   ```bash
   cd src/front/myb.front
   npm start
   # Edit components in apps/ or libs/
   ```

3. **Backend Development**
   ```bash
   cd src/services/[service-name]/Myb.[Service]
   dotnet run
   # Edit controllers, services, models
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push and Create Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Convention

```
feat:  New feature (e.g., feat: add user profile page)
fix:   Bug fix (e.g., fix: resolve login issue)
docs:  Documentation (e.g., docs: update README)
style: Formatting (e.g., style: format code)
refactor: Code restructuring (e.g., refactor: simplify service)
test:  Add tests (e.g., test: add unit tests)
chore: Maintenance (e.g., chore: update dependencies)
```

---

## Troubleshooting

### Frontend Issues

**Issue: npm install fails**
```bash
# Clear cache and retry
npm cache clean --force
npm install
```

**Issue: Angular compilation errors**
```bash
# Ensure correct Node version
node --version  # Should be 18+

# Rebuild node_modules
rm -rf node_modules package-lock.json
npm install
```

**Issue: GraphQL queries failing**
```bash
# Check API is running
curl http://localhost:5000/graphql

# Verify environment configuration
cat src/front/myb.front/src/environments/environment.ts
```

### Backend Issues

**Issue: Entity Framework migration errors**
```bash
# Remove existing migrations
rm src/services/[service]/Migrations/*

# Create new migration
dotnet ef migrations add Initial

# Update database
dotnet ef database update
```

**Issue: Authentication fails**
```bash
# Verify Keycloak is running
docker-compose ps | grep keycloak

# Check token endpoint
curl http://localhost:8080/realms/MYB/protocol/openid-connect/token
```

**Issue: CORS errors**
```csharp
// Add to Program.cs
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy => policy
            .WithOrigins("http://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod()
    );
});
```

### Database Issues

**Issue: Cannot connect to database**
```bash
# Test connection
psql -h localhost -p 5448 -U postgres -d timesheetDB

# Check running containers
docker-compose ps

# View logs
docker-compose logs timesheetDB
```

**Issue: Database locked**
```bash
# Kill connections
docker-compose restart timesheetDB

# Or rebuild
docker-compose down -v
docker-compose up -d
```

---

## GitFlow Workflow

### Branch Structure

The project follows **GitFlow** branching strategy to ensure stable releases and organized development:

#### Main Branches (Long-lived)

- **`main`**: Production-ready code. All releases are tagged here.
- **`develop`**: Integration branch for the next release. Latest features are merged here.

#### Supporting Branches (Short-lived)

- **`feature/*`**: New features and enhancements
  - Created from: `develop`
  - Merged into: `develop`
  - Example: `feature/invoice-pdf-export`, `feature/user-authentication`

- **`release/*`**: Prepare for production release
  - Created from: `develop`
  - Merged into: `main` AND `develop`
  - Example: `release/1.2.0`, `release/2.0.0`

- **`hotfix/*`**: Critical production bug fixes
  - Created from: `main`
  - Merged into: `main` AND `develop`
  - Example: `hotfix/login-error`, `hotfix/payment-bug`

- **`bugfix/*`** (optional): Non-critical bug fixes
  - Created from: `develop`
  - Merged into: `develop`
  - Example: `bugfix/invoice-calculation`

### GitFlow Commands

#### Working with Features

```bash
# Start a new feature
git checkout develop
git pull origin-haithem develop
git checkout -b feature/my-new-feature

# Develop your feature...
git add .
git commit -m "feat: implement new feature"

# Push feature branch
git push origin-haithem feature/my-new-feature

# Merge feature into develop (via Pull Request recommended)
git checkout develop
git merge feature/my-new-feature
git push origin-haithem develop

# Delete feature branch after merge
git branch -d feature/my-new-feature
git push origin-haithem --delete feature/my-new-feature
```

#### Preparing a Release

```bash
# Create release branch from develop
git checkout develop
git pull origin-haithem develop
git checkout -b release/1.1.0

# Make final adjustments, update version numbers, changelog
git commit -m "chore: prepare release 1.1.0"

# Merge into main
git checkout main
git merge release/1.1.0
git tag -a v1.1.0 -m "Release version 1.1.0"
git push origin-haithem main --tags

# Merge back into develop
git checkout develop
git merge release/1.1.0
git push origin-haithem develop

# Delete release branch
git branch -d release/1.1.0
```

#### Hotfix Critical Bugs

```bash
# Create hotfix from main
git checkout main
git pull origin-haithem main
git checkout -b hotfix/1.0.1

# Fix the bug
git commit -m "fix: resolve critical production bug"

# Merge into main
git checkout main
git merge hotfix/1.0.1
git tag -a v1.0.1 -m "Hotfix version 1.0.1"
git push origin-haithem main --tags

# Merge into develop
git checkout develop
git merge hotfix/1.0.1
git push origin-haithem develop

# Delete hotfix branch
git branch -d hotfix/1.0.1
```

### Working with Multiple Remotes

Since this repository has multiple remotes, always specify `origin-haithem` for push/pull operations:

```bash
# List all remotes
git remote -v

# Fetch from specific remote
git fetch origin-haithem

# Push to specific remote
git push origin-haithem branch-name

# Pull from specific remote
git pull origin-haithem branch-name

# Set upstream for current branch
git branch --set-upstream-to=origin-haithem/develop develop
```

### Branch Protection Rules

- **`main`** branch should be protected:
  - Require pull request reviews before merging
  - Require status checks to pass (CI/CD)
  - No force pushes allowed
  - No direct commits (merge via PR only)

- **`develop`** branch recommendations:
  - Require pull request for features
  - Encourage code reviews
  - Run automated tests before merge

### Pull Request Guidelines

When creating a Pull Request:

1. Use descriptive title: `feat: add invoice export` or `fix: resolve login issue`
2. Fill out the PR template (see `.github/pull_request_template.md`)
3. Link related issues: `Closes #123`
4. Ensure CI checks pass
5. Request reviews from team members
6. Squash commits if needed for clean history

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: resolve bug
docs: update documentation
style: code formatting
refactor: code restructuring
test: add tests
chore: maintenance tasks
```

---

## Migration Roadmap

### Planned Migrations

The project is undergoing major technology upgrades:

#### Backend Migration: .NET 10

**Target**: Migrate all services from .NET 8 to .NET 10

**Services to migrate:**
- User Management Service
- Document Management Service
- Invoice Management Service
- Timesheet Management Service
- Payment Service
- Notification Service

**Migration checklist per service:**
- [ ] Update `.csproj` target framework to `net10.0`
- [ ] Update NuGet packages to .NET 10 compatible versions
- [ ] Test GraphQL endpoints
- [ ] Update Dockerfile base images
- [ ] Run integration tests
- [ ] Update CI/CD pipelines

**Track progress**: [GitHub Project Board](https://github.com/users/haithem1987/projects/1)

#### Frontend Migration: Angular 21

**Target**: Migrate all Angular applications to version ^21.0.0

**Applications to migrate:**
- Client App (main application)
- Admin Dashboard (if separate)
- All shared libraries

**Migration checklist per app:**
- [ ] Update `package.json` Angular dependencies to ^21.0.0
- [ ] Update `@angular/cli` and build tools
- [ ] Resolve breaking changes (refer to [Angular Update Guide](https://update.angular.io/))
- [ ] Update TypeScript to compatible version
- [ ] Test all components and modules
- [ ] Update e2e tests
- [ ] Verify production build

**Track progress**: [GitHub Project Board](https://github.com/users/haithem1987/projects/1)

#### CI/CD Updates

After migrations:
- Update GitHub Actions / GitLab CI pipelines
- Update Docker base images
- Update deployment configurations
- Run full regression test suite

---

## References

- [Complete Documentation](./myb-documentation.md)
- [Architecture Details](./myb-architecture.txt)
- [Contributing Guidelines](./CONTRIBUTING.md)
- [GitHub Project Board](https://github.com/users/haithem1987/projects/1)

---

## Support & Contact

- **Technical Issues**: Create issue in GitHub
- **Documentation**: See `myb-documentation.md`
- **Architecture Questions**: See `myb-architecture.txt`
- **Project Tracking**: [GitHub Projects](https://github.com/users/haithem1987/projects/1)

**Last Updated**: December 11, 2025  
**Version**: 1.0.0
