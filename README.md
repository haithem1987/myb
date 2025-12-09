# MYB - Manage Your Business Platform

A comprehensive, modular SaaS platform combining ERP and CRM functionalities designed for small and medium-sized enterprises (SMEs) and entrepreneurs.

## Table of Contents

- [Project Overview](#project-overview)
- [System Architecture](#system-architecture)
- [Dependencies](#dependencies)
- [Initial Setup](#initial-setup)
- [Component Documentation](#component-documentation)
- [Running the Application](#running-the-application)
- [Debugging Guide](#debugging-guide)
- [Keycloak Configuration](#keycloak-configuration)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)

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
- Angular 17
- Nx Monorepo
- TypeScript
- Bootstrap UI Framework
- Apollo Angular (GraphQL client)
- RxJS (Reactive Programming)

**Backend:**
- ASP.NET Core 7.0
- Entity Framework Core 7.0
- PostgreSQL (Database per service)
- HotChocolate (GraphQL)
- Keycloak (Identity Provider)

**DevOps:**
- Docker & Docker Compose
- GitLab CI/CD
- OVH Cloud VPS

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Client Applications                         │
│             (Angular 17 + Nx Monorepo)                      │
├─────────────────────────────────────────────────────────────┤
│              API Gateway & GraphQL Layer                     │
│                   (Apollo Server)                            │
├─────────────────────────────────────────────────────────────┤
│           Authentication & Authorization                     │
│                   (Keycloak/OAuth2)                         │
├────────────┬──────────────┬──────────────┬────────────────┤
│  Document  │   Invoice    │  Timesheet   │  User Manager  │
│  Service   │   Service    │   Service    │   Service      │
├────────────┼──────────────┼──────────────┼────────────────┤
│ PostgreSQL │ PostgreSQL   │ PostgreSQL   │ PostgreSQL     │
│ Document   │ Invoice      │ Timesheet    │ User Database  │
└────────────┴──────────────┴──────────────┴────────────────┘
```

### Project Directory Structure

```
myb/
├── src/
│   ├── front/                          # Frontend (Nx Monorepo)
│   │   └── myb.front/
│   │       ├── apps/
│   │       │   ├── admin/              # Admin application
│   │       │   └── client/             # Client application
│   │       └── libs/                   # Shared libraries
│   │           ├── auth/               # Authentication module
│   │           ├── shared/             # Shared components
│   │           ├── document-module/    # Document feature module
│   │           ├── invoice-module/     # Invoice feature module
│   │           └── timesheet-module/   # Timesheet feature module
│   │
│   ├── services/                       # Microservices
│   │   ├── user-manager/               # User management service
│   │   ├── document-management/        # Document service
│   │   ├── invoice-management/         # Invoice service
│   │   ├── time-sheet/                 # Timesheet service
│   │   ├── payment-service/            # Stripe integration
│   │   ├── notification-service/       # Real-time notifications
│   │   └── AllServicesStarter/         # Orchestration
│   │
│   ├── common/                         # Shared backend libraries
│   │   ├── Myb.Common.Authentification/
│   │   ├── Myb.Common.GraphQL.Infra/
│   │   ├── Myb.Common.Models/
│   │   ├── Myb.Common.Repositories/
│   │   ├── Myb.Common.Stripe/
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
- ASP.NET Core 7.0
- Entity Framework Core 7.0
- HotChocolate GraphQL

# Authentication
- Keycloak integration
- JWT token handling

# Payment
- Stripe SDK

# Database
- Npgsql (PostgreSQL driver)
- Entity Framework Core
```

#### Frontend Dependencies

```bash
- Angular 17
- Nx framework
- TypeScript 4.8+
- RxJS 7.0+
- Apollo Angular
- Bootstrap 5
- ngx-stripe
- ngx-mask
- D3.js
- jsPDF
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
- **Keycloak Admin**: http://localhost:8080/admin
- **GraphQL API**: http://localhost:5000/graphql
- **User Manager Service**: http://localhost:5001
- **Timesheet Service**: http://localhost:5004
- **Document Service**: http://localhost:5002
- **Invoice Service**: http://localhost:5003

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

## References

- [Complete Documentation](./myb-documentation.md)
- [Architecture Details](./myb-architecture.txt)
- [Contributing Guidelines](./CONTRIBUTING.md)

---

## Support & Contact

- **Technical Issues**: Create issue in GitLab
- **Documentation**: See `myb-documentation.md`
- **Architecture Questions**: See `myb-architecture.txt`

**Last Updated**: December 2024  
**Version**: 1.0.0
