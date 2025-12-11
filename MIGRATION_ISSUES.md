# Migration Issues & Tasks

This document tracks the migration tasks for upgrading the MYB platform to .NET 10 and Angular 21.

**Project Board**: [GitHub Projects](https://github.com/users/haithem1987/projects/1)

---

## Backend Migration: .NET 10

### Priority: High
**Target Completion**: Q1 2025

### Services to Migrate

#### 1. User Management Service
**Branch**: `feature/upgrade-dotnet10-user-manager`  
**Estimated Effort**: Medium (3-5 days)

**Tasks**:
- [ ] Update `Myb.UserManager.csproj` to target `net10.0`
- [ ] Update NuGet packages:
  - [ ] `Microsoft.EntityFrameworkCore` → 10.x
  - [ ] `HotChocolate.AspNetCore` → latest compatible
  - [ ] `Npgsql.EntityFrameworkCore.PostgreSQL` → 10.x
  - [ ] Keycloak authentication packages
- [ ] Update Dockerfile base image to `mcr.microsoft.com/dotnet/aspnet:10.0`
- [ ] Test GraphQL queries and mutations
- [ ] Run unit tests
- [ ] Update integration tests
- [ ] Test Keycloak authentication flows
- [ ] Verify database migrations work

**Dependencies**: None  
**Assignee**: TBD  
**Labels**: `migration`, `backend`, `.net10`, `priority:high`

---

#### 2. Document Management Service
**Branch**: `feature/upgrade-dotnet10-document-service`  
**Estimated Effort**: Medium (3-5 days)

**Tasks**:
- [ ] Update `Myb.Document.csproj` to target `net10.0`
- [ ] Update NuGet packages (same as User Manager)
- [ ] Update MinIO client library if needed
- [ ] Update Dockerfile
- [ ] Test file upload/download functionality
- [ ] Test document versioning
- [ ] Run all unit and integration tests
- [ ] Performance testing for large files

**Dependencies**: None  
**Assignee**: TBD  
**Labels**: `migration`, `backend`, `.net10`, `priority:high`

---

#### 3. Invoice Management Service
**Branch**: `feature/upgrade-dotnet10-invoice-service`  
**Estimated Effort**: Medium-High (5-7 days)

**Tasks**:
- [ ] Update `Myb.Invoice.csproj` to target `net10.0`
- [ ] Update NuGet packages
- [ ] Update PDF generation libraries
- [ ] Update Dockerfile
- [ ] Test invoice creation and calculations
- [ ] Test PDF export functionality
- [ ] Test email notifications
- [ ] Run unit tests
- [ ] Integration tests with Payment Service

**Dependencies**: None  
**Assignee**: TBD  
**Labels**: `migration`, `backend`, `.net10`, `priority:high`

---

#### 4. Timesheet Management Service
**Branch**: `feature/upgrade-dotnet10-timesheet-service`  
**Estimated Effort**: Medium (4-6 days)

**Tasks**:
- [ ] Update `Myb.Timesheet.csproj` to target `net10.0`
- [ ] Update NuGet packages
- [ ] Update Dockerfile
- [ ] Test time tracking functionality
- [ ] Test approval workflows
- [ ] Test reporting features
- [ ] Run all tests
- [ ] Verify database queries performance

**Dependencies**: None  
**Assignee**: TBD  
**Labels**: `migration`, `backend`, `.net10`, `priority:medium`

---

#### 5. Payment Service (Stripe Integration)
**Branch**: `feature/upgrade-dotnet10-payment-service`  
**Estimated Effort**: High (5-7 days)

**Tasks**:
- [ ] Update `Myb.Payment.csproj` to target `net10.0`
- [ ] Update NuGet packages
- [ ] Update `Stripe.net` SDK to latest version
- [ ] Update Dockerfile
- [ ] Test payment processing (use test mode)
- [ ] Test subscription management
- [ ] Test webhook handlers
- [ ] Verify PCI compliance requirements
- [ ] Run comprehensive integration tests

**Dependencies**: None  
**Assignee**: TBD  
**Labels**: `migration`, `backend`, `.net10`, `priority:high`, `security`

---

#### 6. Notification Service
**Branch**: `feature/upgrade-dotnet10-notification-service`  
**Estimated Effort**: Low-Medium (2-4 days)

**Tasks**:
- [ ] Update `Myb.Notification.csproj` to target `net10.0`
- [ ] Update NuGet packages
- [ ] Update email service libraries (SendGrid, SMTP, etc.)
- [ ] Update Dockerfile
- [ ] Test email notifications
- [ ] Test SMS notifications (if applicable)
- [ ] Test push notifications (if applicable)
- [ ] Run all tests

**Dependencies**: None  
**Assignee**: TBD  
**Labels**: `migration`, `backend`, `.net10`, `priority:medium`

---

### Common Libraries

#### 7. Common Authentication Library
**Branch**: `feature/upgrade-dotnet10-common-auth`  
**Estimated Effort**: Medium (3-4 days)

**Tasks**:
- [ ] Update `Myb.Common.Authentification.csproj` to target `net10.0`
- [ ] Update Keycloak libraries
- [ ] Update JWT handling packages
- [ ] Run all unit tests
- [ ] Test with all services

**Dependencies**: Should be completed first  
**Assignee**: TBD  
**Labels**: `migration`, `backend`, `.net10`, `priority:high`, `shared-library`

---

#### 8. Common GraphQL Infrastructure
**Branch**: `feature/upgrade-dotnet10-common-graphql`  
**Estimated Effort**: Medium (3-4 days)

**Tasks**:
- [ ] Update `Myb.Common.GraphQL.Infra.csproj` to target `net10.0`
- [ ] Update HotChocolate packages
- [ ] Test GraphQL schema generation
- [ ] Run all tests

**Dependencies**: Should be completed early  
**Assignee**: TBD  
**Labels**: `migration`, `backend`, `.net10`, `priority:high`, `shared-library`

---

## Frontend Migration: Angular 21

### Priority: High
**Target Completion**: Q1 2025

### Applications to Migrate

#### 9. Client Application (Main App)
**Branch**: `feature/upgrade-angular21-client-app`  
**Estimated Effort**: High (7-10 days)

**Tasks**:
- [ ] Update `package.json` Angular dependencies to ^21.0.0
- [ ] Update `@angular/cli` to 21.x
- [ ] Update `@angular/core`, `@angular/common`, etc.
- [ ] Update TypeScript to compatible version (5.4+)
- [ ] Update `tsconfig.json` compiler options
- [ ] Review [Angular Update Guide](https://update.angular.io/)
- [ ] Address breaking changes:
  - [ ] Router changes
  - [ ] Forms API updates
  - [ ] RxJS updates
  - [ ] HttpClient changes
- [ ] Update all third-party UI libraries (Angular Material, etc.)
- [ ] Test all components and pages
- [ ] Test routing and navigation
- [ ] Test forms and validation
- [ ] Test API integration
- [ ] Run unit tests
- [ ] Run e2e tests
- [ ] Verify production build
- [ ] Performance testing

**Dependencies**: None  
**Assignee**: TBD  
**Labels**: `migration`, `frontend`, `angular21`, `priority:high`

---

#### 10. Shared Frontend Libraries
**Branch**: `feature/upgrade-angular21-shared-libs`  
**Estimated Effort**: Medium (4-6 days)

**Tasks**:
- [ ] Update all shared library `package.json` files
- [ ] Update Angular dependencies to 21.x
- [ ] Update TypeScript
- [ ] Address breaking changes in libraries
- [ ] Run all library unit tests
- [ ] Test integration with main app
- [ ] Update library build configurations

**Dependencies**: Should be completed before Client App  
**Assignee**: TBD  
**Labels**: `migration`, `frontend`, `angular21`, `priority:high`, `shared-library`

---

## Infrastructure & CI/CD Updates

#### 11. Update CI/CD Pipelines
**Branch**: `feature/update-cicd-pipelines`  
**Estimated Effort**: Medium (3-5 days)

**Tasks**:
- [ ] Update GitHub Actions workflows for .NET 10
- [ ] Update Node.js version for Angular builds
- [ ] Update Docker build pipelines
- [ ] Update test runners
- [ ] Update deployment scripts
- [ ] Test pipeline on feature branches
- [ ] Document pipeline changes

**Dependencies**: After service migrations  
**Assignee**: TBD  
**Labels**: `migration`, `infrastructure`, `ci-cd`, `priority:high`

---

#### 12. Update Docker Images
**Branch**: `feature/update-docker-images`  
**Estimated Effort**: Low-Medium (2-3 days)

**Tasks**:
- [ ] Update all Dockerfiles to use .NET 10 base images
- [ ] Update `docker-compose.yml`
- [ ] Update Node.js images for frontend builds
- [ ] Test all container builds
- [ ] Verify multi-stage builds work
- [ ] Update documentation

**Dependencies**: During service migrations  
**Assignee**: TBD  
**Labels**: `migration`, `infrastructure`, `docker`, `priority:medium`

---

## Testing & Validation

#### 13. Integration Testing
**Branch**: `feature/migration-integration-tests`  
**Estimated Effort**: High (5-7 days)

**Tasks**:
- [ ] Create comprehensive integration test suite
- [ ] Test all service-to-service communication
- [ ] Test GraphQL federation (if used)
- [ ] Test authentication flows end-to-end
- [ ] Test payment flows (sandbox mode)
- [ ] Performance testing
- [ ] Load testing
- [ ] Security testing
- [ ] Document test results

**Dependencies**: After all migrations  
**Assignee**: TBD  
**Labels**: `migration`, `testing`, `priority:high`

---

## Migration Phases

### Phase 1: Preparation (Week 1)
- Set up .NET 10 development environment
- Set up Angular 21 development environment
- Review breaking changes documentation
- Create feature branches
- Update common libraries first

### Phase 2: Backend Migration (Weeks 2-4)
- Migrate services in parallel (if team size allows)
- Recommended order:
  1. Common libraries (Auth, GraphQL)
  2. User Management (core service)
  3. Document Management
  4. Invoice Management
  5. Timesheet Management
  6. Payment Service
  7. Notification Service

### Phase 3: Frontend Migration (Weeks 3-5)
- Can overlap with backend if teams are separate
- Migrate shared libraries first
- Then migrate main application

### Phase 4: Infrastructure Updates (Week 5)
- Update CI/CD pipelines
- Update Docker configurations
- Update deployment scripts

### Phase 5: Testing & Validation (Week 6)
- Run full integration test suite
- Performance testing
- Security audit
- User acceptance testing (if applicable)

### Phase 6: Deployment (Week 7)
- Deploy to staging environment
- Monitor for issues
- Deploy to production
- Post-deployment monitoring

---

## Issue Templates for GitHub

### For Backend Service Migration

```markdown
**Service**: [Service Name]
**Migration Type**: .NET 10 Upgrade
**Priority**: High/Medium/Low
**Estimated Effort**: [X days]

**Checklist**:
- [ ] Update .csproj to net10.0
- [ ] Update NuGet packages
- [ ] Update Dockerfile
- [ ] Run unit tests
- [ ] Run integration tests
- [ ] Update documentation

**Testing Notes**:
[Add service-specific testing requirements]

**Blocker/Dependencies**:
[List any blockers or dependencies]
```

### For Frontend Migration

```markdown
**Application**: [App Name]
**Migration Type**: Angular 21 Upgrade
**Priority**: High/Medium/Low
**Estimated Effort**: [X days]

**Checklist**:
- [ ] Update package.json
- [ ] Update Angular CLI
- [ ] Address breaking changes
- [ ] Update TypeScript
- [ ] Run unit tests
- [ ] Run e2e tests
- [ ] Verify production build

**Breaking Changes**:
[List known breaking changes to address]

**Testing Notes**:
[Add specific testing requirements]
```

---

## Resources

- [.NET 10 Release Notes](https://learn.microsoft.com/en-us/dotnet/core/whats-new/dotnet-10)
- [Angular 21 Update Guide](https://update.angular.io/)
- [GitHub Project Board](https://github.com/users/haithem1987/projects/1)

---

**Last Updated**: December 11, 2025
