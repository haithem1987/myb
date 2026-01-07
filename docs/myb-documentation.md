# MYB - Manage Your Business Platform Documentation

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Project Overview](#project-overview)
3. [Architecture](#architecture)
4. [Technology Stack](#technology-stack)
5. [Modules & Features](#modules--features)
6. [Development Methodology](#development-methodology)
7. [Deployment](#deployment)
8. [Getting Started](#getting-started)

---

## Executive Summary

**MYB (Manage Your Business)** is a modular SaaS platform combining ERP and CRM functionalities designed for small and medium-sized enterprises (SMEs) and entrepreneurs. The platform provides comprehensive business management tools including document management, invoicing, time tracking, and subscription management.

**Project Period:** February 2024 - June 2024  
**Development Team:** ForLink  
**Academic Institution:** ESPRIT (École Supérieure Privée des Technologies et de l'Ingénierie)

---

## Project Overview

### Vision
To provide a flexible, modern, and cost-effective business management solution that overcomes the limitations of traditional ERP/CRM systems in terms of complexity, cost, and rigidity.

### Key Differentiators
- **Modular Architecture**: Select and pay only for needed modules
- **Microservices-based**: Independent deployment and scaling of services
- **Modern Technology Stack**: Built with latest frameworks and tools
- **User-Friendly**: Intuitive interface with minimal learning curve
- **Cost-Effective**: Subscription-based pricing with flexible plans

### Problem Statement
Traditional ERP/CRM systems face several challenges:
- High implementation costs
- Complex configuration requiring specialized consultants
- Rigid architecture with limited customization
- Difficult maintenance and updates
- Poor user experience

MYB addresses these issues through modern architecture, intuitive design, and flexible deployment.

---

## Architecture

### High-Level Architecture

MYB follows a **microservices architecture** combined with a **modular monorepo frontend** approach.

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                      │
│                  (Angular 17 + Nx Monorepo)                 │
├─────────────────────────────────────────────────────────────┤
│                    API Gateway (GraphQL)                     │
│                      Apollo Server                           │
├─────────────────────────────────────────────────────────────┤
│                  Authentication Service                      │
│                       Keycloak                               │
├──────────────┬──────────────┬──────────────┬───────────────┤
│   Document   │   Invoice    │  Timesheet   │ User Manager  │
│   Service    │   Service    │   Service    │   Service     │
├──────────────┼──────────────┼──────────────┼───────────────┤
│ PostgreSQL   │ PostgreSQL   │ PostgreSQL   │ PostgreSQL    │
│   Database   │   Database   │   Database   │   Database    │
└──────────────┴──────────────┴──────────────┴───────────────┘
```

### Architecture Components

#### 1. Frontend Architecture (Nx Monorepo)
- **Framework**: Angular 17
- **Build Tool**: Nx (Extensible monorepo toolkit)
- **Structure**: Modular applications and shared libraries
- **Apps**:
  - `admin`: Administrator interface
  - `client`: Client/user interface
  - `myb.front`: Main application

**Benefits**:
- Code sharing between modules
- Consistent development practices
- Efficient dependency management
- Independent module development

#### 2. Backend Architecture (Microservices)

Each microservice follows a layered architecture:

```
Service Layer
    ↓
Business Logic Layer
    ↓
Data Access Layer (Repository Pattern)
    ↓
Database Layer (PostgreSQL)
```

**Microservices**:

1. **User Manager Service**
   - User management and profiles
   - Role and permission management
   - Integration with Keycloak

2. **Document Management Service**
   - File upload/download
   - Folder organization (nested folders)
   - Document versioning
   - Document sharing
   - Quick access/pinning

3. **Invoice Management Service**
   - Client management
   - Product/service catalog
   - Tax configuration
   - Invoice generation and tracking

4. **Timesheet Service**
   - Time entry management
   - Project management
   - Task assignment
   - Time approval workflow
   - Leave management

5. **Payment Service**
   - Stripe integration
   - Subscription management
   - Payment processing

6. **Notification Service**
   - Real-time notifications
   - SignalR implementation

#### 3. API Gateway (GraphQL)
- **Technology**: Apollo Server
- **Purpose**: 
  - Unified API endpoint for all microservices
  - Query optimization
  - Data aggregation from multiple services
  - Reduced network overhead

#### 4. Authentication & Authorization
- **Technology**: Keycloak
- **Features**:
  - Single Sign-On (SSO)
  - Role-based access control (RBAC)
  - OAuth2/OpenID Connect
  - User federation
  - Token management

#### 5. Database Architecture
- **Database**: PostgreSQL (one per microservice)
- **Pattern**: Database per service
- **Benefits**:
  - Data isolation
  - Independent scaling
  - Technology flexibility
  - Fault isolation

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         GitLab CI/CD                         │
│                      (Automated Pipeline)                    │
└────────────┬────────────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────────────┐
│                      Docker Images                           │
│                   (Docker Hub Registry)                      │
└────────────┬────────────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────────────┐
│                    OVH Cloud VPS Server                      │
│              (Docker Compose Orchestration)                  │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │ Frontend │ │ Service 1│ │ Service 2│ │ Service N│     │
│  │Container │ │Container │ │Container │ │Container │     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Angular | 17 | Frontend framework |
| Nx | Latest | Monorepo management |
| TypeScript | Latest | Type-safe development |
| Bootstrap | Latest | UI framework |
| Apollo Angular | Latest | GraphQL client |
| RxJS | Latest | Reactive programming |
| Keycloak-JS | Latest | Authentication client |
| ngx-stripe | Latest | Stripe integration |
| ngx-mask | Latest | Input masking |
| D3.js | Latest | Data visualization |
| jsPDF | Latest | PDF generation |

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| ASP.NET Core | 7.0 | Web API framework |
| Entity Framework Core | 7.0 | ORM |
| PostgreSQL | Latest | Database |
| HotChocolate | Latest | GraphQL server |
| Keycloak | Latest | Identity provider |
| Docker | Latest | Containerization |

### Development Tools

| Tool | Purpose |
|------|---------|
| Visual Studio Code | Frontend IDE |
| Visual Studio | Backend IDE |
| GitLab | Version control & CI/CD |
| Figma | UI/UX design |
| Draw.io | Architecture diagrams |
| pgAdmin | Database management |
| Postman/BananaCakePop | API testing |

### DevOps & Infrastructure

| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Multi-container orchestration |
| GitLab Runner | CI/CD execution |
| OVH Cloud VPS | Hosting |
| ESLint | Code quality |

---

## Modules & Features

### 1. Authentication Module (Sprint 1)

**Features**:
- User login/logout
- User registration
- Role-based access control
- Permission management
- Keycloak integration

**Actors**:
- Administrator
- Users

**Key Components**:
- Keycloak realm configuration
- JWT token management
- Role and permission assignment

---

### 2. Subscription Management Module (Sprint 2)

**Features**:
- Service subscription
- Payment processing (Stripe)
- Subscription cancellation
- Subscription status tracking
- Webhook handling

**Integration**: Stripe Payment Gateway

**Workflow**:
1. User selects subscription plan
2. Stripe modal opens for payment
3. Payment processed
4. Webhook updates subscription status
5. User gains access to subscribed modules

---

### 3. Document Management Module (Sprint 3)

**Features**:
- File upload/download (PDF, DOC, XLS, images)
- Document preview
- Folder organization (nested folders)
- Document versioning
- Document sharing
- Quick access (pinning)
- Search functionality

**Supported Formats**: PDF, DOC, DOCX, XLS, XLSX, Images

**Use Cases**:
- Organize company documents
- Share files with team members
- Version control for important documents
- Quick access to frequently used files

**Database Schema**:
```
Folder
  ├── id
  ├── name
  ├── parentFolderId (nullable)
  ├── createdBy
  └── createdAt

Document
  ├── id
  ├── name
  ├── folderId
  ├── documentTypeId
  ├── documentStatusId
  ├── size
  ├── uploadedBy
  └── uploadedAt

DocumentVersion
  ├── id
  ├── documentId
  ├── versionNumber
  ├── uploadedBy
  └── uploadedAt
```

---

### 4. Timesheet Management Module (Sprint 4)

**Features**:

**For Employees**:
- Time entry (multi-project support)
- Task assignment
- Project consultation
- Leave requests
- Timesheet submission
- PDF export

**For Managers**:
- Timesheet approval/rejection
- Project management (create, edit, archive)
- Employee management
- Task assignment
- Leave approval
- Report generation

**Database Schema**:
```
Project
  ├── id
  ├── name
  ├── startDate
  ├── endDate
  ├── status
  └── managerId

Employee
  ├── id
  ├── userId
  ├── role
  └── projectId

Timesheet
  ├── id
  ├── employeeId
  ├── weekStartDate
  ├── approvalStatus
  └── approvedBy

TimeEntry
  ├── id
  ├── timesheetId
  ├── projectId
  ├── taskId
  ├── date
  └── hours

Task
  ├── id
  ├── name
  ├── projectId
  ├── assignedTo
  └── dueDate
```

---

### 5. Invoice Management Module (Sprint 5)

**Features**:

**Client Management**:
- Add/edit/archive clients
- Contact management
- Client type classification

**Product/Service Management**:
- Product catalog
- Service catalog
- Unit of measure
- Pricing

**Tax Management**:
- Tax configuration
- Fixed and percentage taxes
- Tax assignment to products

**Invoice Management**:
- Invoice creation
- Invoice editing
- Invoice archiving
- PDF generation
- Client selection
- Product/service selection
- Automatic calculations
- Tax application

**Database Schema**:
```
Client
  ├── id
  ├── name
  ├── clientType
  ├── address
  ├── email
  └── phone

Contact
  ├── id
  ├── clientId
  ├── name
  ├── contactType
  └── details

Product
  ├── id
  ├── name
  ├── productType
  ├── unitPrice
  ├── taxId
  └── unit

Tax
  ├── id
  ├── name
  ├── rate
  └── type (percentage/fixed)

Invoice
  ├── id
  ├── clientId
  ├── invoiceDate
  ├── subtotal
  ├── taxAmount
  └── total

InvoiceDetails
  ├── id
  ├── invoiceId
  ├── productId
  ├── quantity
  ├── unitPrice
  └── amount
```

---

## Development Methodology

### Agile Scrum Framework

**Why Scrum?**
- Flexible and adaptive to changes
- Continuous user involvement
- Prioritization of essential features
- Incremental delivery
- Effective team collaboration

### Scrum Team Structure

| Role | Member | Responsibilities |
|------|--------|-----------------|
| Product Owner | Haithem Khalifa | Requirements specification, user stories |
| Scrum Master | Mohamed Koutaiba Msadaa | Sprint planning, meeting organization |
| Developer | Nidhal Ben Maad | Timesheet, subscription, deployment |
| Developer | Takwa Hasni | Document management |

### Sprint Structure

**Total Duration**: 6 sprints over 4 months

**Release 1** (3 sprints):
- Sprint 1: Authentication (2 weeks)
- Sprint 2: Subscription Management (4 weeks)
- Sprint 3: Document Management (4 weeks)

**Release 2** (3 sprints):
- Sprint 4: Timesheet Management (4 weeks)
- Sprint 5: Invoice Management (4 weeks)
- Sprint 6: Deployment (2 weeks)

### Sprint Activities

1. **Sprint Planning**:
   - Review product backlog
   - Select user stories for sprint
   - Estimate tasks
   - Define sprint goal

2. **Daily Scrum (Stand-up)**:
   - Duration: 15 minutes
   - Frequency: Daily
   - Format:
     - What did I do yesterday?
     - What will I do today?
     - Any blockers?

3. **Weekly Meeting**:
   - Duration: 1-2 hours
   - Frequency: Weekly
   - Activities:
     - Sprint review
     - Stakeholder feedback
     - Retrospective
     - Process improvement

4. **Sprint Review**:
   - Demo completed features
   - Gather feedback
   - Update product backlog

5. **Sprint Retrospective**:
   - What went well?
   - What could be improved?
   - Action items for next sprint

---

## Deployment

### CI/CD Pipeline (GitLab)

**Pipeline Stages**:

1. **Test Stage**:
   - Run unit tests
   - Run integration tests
   - Code quality checks

2. **Build Stage**:
   - Build Docker images
   - Tag images
   - Push to Docker Hub

3. **Deploy Stage**:
   - Connect to OVH VPS
   - Pull Docker images
   - Run docker-compose
   - Verify deployment

### Deployment Steps

```bash
# 1. Install GitLab Runner on VPS
docker pull gitlab/gitlab-runner:alpine
docker run -d --name gitlab-runner gitlab/gitlab-runner:alpine

# 2. Register GitLab Runner
docker exec -it gitlab-runner gitlab-runner register \
  --url "https://gitlab.com/" \
  --clone-url "https://gitlab.com/Kout1999/myb.git"

# 3. Create Dockerfiles for each service

# 4. Configure docker-compose.yml

# 5. Create .gitlab-ci.yml pipeline

# 6. Verify deployment
docker ps -a
```

### Docker Compose Services

```yaml
services:
  frontend:
    image: myb-frontend:latest
    ports:
      - "4200:80"
  
  user-service:
    image: myb-user-service:latest
    ports:
      - "5001:80"
  
  document-service:
    image: myb-document-service:latest
    ports:
      - "5002:80"
  
  invoice-service:
    image: myb-invoice-service:latest
    ports:
      - "5003:80"
  
  timesheet-service:
    image: myb-timesheet-service:latest
    ports:
      - "5004:80"
  
  gateway:
    image: myb-gateway:latest
    ports:
      - "5000:80"
  
  keycloak:
    image: keycloak:latest
    ports:
      - "8080:8080"
  
  postgres:
    image: postgres:latest
    volumes:
      - postgres-data:/var/lib/postgresql/data
```

---

## Getting Started

### Prerequisites

**Backend**:
- .NET 7.0 SDK
- PostgreSQL 15+
- Docker Desktop

**Frontend**:
- Node.js 18+
- npm or yarn
- Angular CLI 17

### Installation

#### 1. Clone Repository

```bash
git clone https://gitlab.com/Kout1999/myb.git
cd myb
```

#### 2. Backend Setup

```bash
# Navigate to service directory
cd src/services/user-manager/Myb.UserManager

# Restore dependencies
dotnet restore

# Update database
dotnet ef database update

# Run service
dotnet run
```

Repeat for each microservice.

#### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd src/front/myb.front

# Install dependencies
npm install

# Run development server
npm start
```

#### 4. Keycloak Setup

```bash
# Start Keycloak container
docker run -d \
  -p 8080:8080 \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:latest start-dev
```

Configure realm, clients, roles in Keycloak admin console.

#### 5. PostgreSQL Setup

```bash
# Start PostgreSQL container
docker run -d \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  -v postgres-data:/var/lib/postgresql/data \
  postgres:latest
```

Create databases for each service:
- `myb_users`
- `myb_documents`
- `myb_invoices`
- `myb_timesheets`

### Configuration

#### Backend Configuration (appsettings.json)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=myb_users;Username=postgres;Password=postgres"
  },
  "Keycloak": {
    "Authority": "http://localhost:8080/realms/MYB",
    "ClientId": "myb-client",
    "ClientSecret": "your-secret"
  },
  "GraphQL": {
    "Endpoint": "http://localhost:5000/graphql"
  }
}
```

#### Frontend Configuration (environment.ts)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/graphql',
  keycloak: {
    url: 'http://localhost:8080',
    realm: 'MYB',
    clientId: 'myb-client'
  },
  stripe: {
    publishableKey: 'your-stripe-key'
  }
};
```

### Running the Application

#### Development Mode

```bash
# Terminal 1: Start backend services
cd src/services
dotnet run --project AllServicesStarter

# Terminal 2: Start frontend
cd src/front/myb.front
npm start

# Terminal 3: Start Keycloak
docker start keycloak

# Terminal 4: Start PostgreSQL
docker start postgres
```

Access application at: `http://localhost:4200`

#### Production Mode (Docker)

```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# Verify services
docker-compose ps
```

---

## Project Structure

```
myb/
├── src/
│   ├── front/                      # Frontend applications
│   │   └── myb.front/
│   │       ├── apps/               # Nx applications
│   │       │   ├── admin/          # Admin app
│   │       │   └── client/         # Client app
│   │       └── libs/               # Shared libraries
│   │           ├── auth/           # Authentication library
│   │           ├── shared/         # Shared components
│   │           ├── document-module/
│   │           ├── invoice-module/
│   │           └── timesheet-module/
│   │
│   ├── services/                   # Backend microservices
│   │   ├── user-manager/
│   │   │   ├── Myb.UserManager/            # API
│   │   │   ├── Myb.UserManager.Models/     # Domain models
│   │   │   ├── Myb.UserManager.Services/   # Business logic
│   │   │   └── Myb.UserManager.Infra/      # GraphQL & repositories
│   │   │
│   │   ├── document-management/
│   │   │   ├── Myb.Document/
│   │   │   ├── Myb.Document.Models/
│   │   │   ├── Myb.Document.Services/
│   │   │   └── Myb.Document.Infra/
│   │   │
│   │   ├── invoice-management/
│   │   │   ├── Myb.Invoice/
│   │   │   ├── Myb.Invoice.Models/
│   │   │   ├── Myb.Invoice.Services/
│   │   │   └── Myb.Invoice.Infra/
│   │   │
│   │   ├── time-sheet/
│   │   │   ├── Myb.Timesheet/
│   │   │   ├── Myb.Timesheet.Models/
│   │   │   ├── Myb.Timesheet.Services/
│   │   │   └── Myb.Timesheet.Infra/
│   │   │
│   │   ├── payment-service/
│   │   └── notification-service/
│   │
│   ├── common/                     # Shared backend libraries
│   │   ├── Myb.Common.Models/
│   │   ├── Myb.Common.Repositories/
│   │   ├── Myb.Common.Authentification/
│   │   └── Myb.Common.GraphQL.Infra/
│   │
│   └── orchestration/              # API Gateway
│       └── Myb.Orchestration/
│
├── tests/                          # Test projects
│   ├── unit-tests/
│   └── end-2-end-tests/
│
├── docker-compose.yml              # Multi-container configuration
└── README.md
```

---

## Key Design Patterns

### 1. Repository Pattern
- Abstracts data access logic
- Enables unit testing
- Supports multiple data sources

### 2. Dependency Injection
- Loose coupling
- Testability
- Maintainability

### 3. CQRS (Command Query Responsibility Segregation)
- Separation of read and write operations
- Optimized queries
- Scalability

### 4. Unit of Work Pattern
- Transaction management
- Data consistency
- Atomic operations

---

## Security Considerations

### Authentication & Authorization
- JWT tokens with short expiration
- Refresh token rotation
- Role-based access control (RBAC)
- OAuth2/OpenID Connect

### Data Protection
- HTTPS/TLS encryption
- Database encryption at rest
- Sensitive data hashing
- CORS configuration

### API Security
- Rate limiting
- Input validation
- SQL injection prevention
- XSS protection

### Infrastructure Security
- Network segmentation
- Firewall rules
- Regular security updates
- Secrets management

---

## Performance Optimization

### Frontend
- Lazy loading modules
- OnPush change detection
- Virtual scrolling for large lists
- Image optimization
- Code splitting

### Backend
- Database indexing
- Query optimization
- Caching (Redis)
- Connection pooling
- Async/await patterns

### API
- GraphQL query optimization
- DataLoader for batching
- Pagination
- Field-level caching

---

## Monitoring & Observability

### Planned Enhancements
- **Grafana**: Real-time metrics dashboard
- **Prometheus**: Metrics collection
- **Kubernetes**: Container orchestration
- **ELK Stack**: Centralized logging

---

## Future Roadmap

### Phase 1 (Completed)
- ✅ Core modules (Auth, Documents, Invoices, Timesheets)
- ✅ Subscription management
- ✅ Basic deployment

### Phase 2 (Q3 2024)
- Advanced reporting
- Mobile applications
- Additional payment gateways
- Email notifications

### Phase 3 (Q4 2024)
- CRM features (leads, opportunities)
- Inventory management
- Accounting module
- Multi-language support

### Phase 4 (2025)
- AI-powered insights
- Advanced analytics
- Third-party integrations
- White-label solution

---

## Contributing

### Development Workflow

1. Create feature branch
```bash
git checkout -b feature/your-feature-name
```

2. Make changes and commit
```bash
git add .
git commit -m "feat: your feature description"
```

3. Push to remote
```bash
git push origin feature/your-feature-name
```

4. Create merge request in GitLab

### Commit Message Convention

Follow conventional commits:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

---

## Support & Contact

**Academic Supervisor**: Mme Zouhour Hammouda  
**Business Supervisor**: M. Mohamed Koutaiba Msadaa  
**Professional Supervisor**: M. Haythem Khalifa  

**Institution**: ESPRIT (École Supérieure Privée des Technologies et de l'Ingénierie)  
**Company**: ForLink  
**Student**: Nidhal Ben Maad

---

## License

This project is developed as part of an academic final year project at ESPRIT in collaboration with ForLink.

---

## Acknowledgments

Special thanks to:
- ForLink team for guidance and support
- ESPRIT faculty for academic supervision
- Team members for collaboration
- All stakeholders who contributed to the project

---

**Version**: 1.0.0  
**Last Updated**: June 2024  
**Documentation Status**: Active