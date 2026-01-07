# Module de Gestion de Copropriété - Documentation Technique

## Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Architecture](#architecture)
- [Modèle de données](#modèle-de-données)
- [Endpoints GraphQL](#endpoints-graphql)
- [Fonctionnalités](#fonctionnalités)
- [Intégrations](#intégrations)
- [Installation et configuration](#installation-et-configuration)
- [Guide de développement](#guide-de-développement)

---

## Vue d'ensemble

### Objectif du module

Le module de **Gestion de Copropriété** permet de centraliser et automatiser la gestion complète des résidences en copropriété, incluant :

- Gestion des copropriétés et lots
- Suivi des copropriétaires
- Calcul et répartition des charges
- Facturation et paiements
- Gestion de la maintenance
- Communication et notifications

### Périmètre fonctionnel

**Inclus dans la version 1.0 :**
- ✅ CRUD des copropriétés et lots
- ✅ Gestion des copropriétaires
- ✅ Création et répartition des charges
- ✅ Génération de factures
- ✅ Suivi des paiements
- ✅ Système de maintenance
- ✅ Notifications automatiques

**Évolutions futures (v2.0+) :**
- 🔮 Assemblées générales
- 🔮 Vote électronique
- 🔮 Budget prévisionnel
- 🔮 Application mobile dédiée

---

## Architecture

### Structure du projet

```
myb/
├── src/
│   ├── services/
│   │   └── coproperty-management/          # Nouveau service
│   │       └── Myb.Coproperty/
│   │           ├── Controllers/
│   │           │   ├── CopropertiesController.cs
│   │           │   ├── UnitsController.cs
│   │           │   ├── OwnersController.cs
│   │           │   ├── ChargesController.cs
│   │           │   └── MaintenanceController.cs
│   │           ├── Services/
│   │           │   ├── CopropertyService.cs
│   │           │   ├── UnitService.cs
│   │           │   ├── OwnerService.cs
│   │           │   ├── ChargeService.cs
│   │           │   ├── InvoiceService.cs
│   │           │   └── MaintenanceService.cs
│   │           ├── Models/
│   │           │   ├── Coproperty.cs
│   │           │   ├── Unit.cs
│   │           │   ├── Owner.cs
│   │           │   ├── Charge.cs
│   │           │   ├── Invoice.cs
│   │           │   ├── Payment.cs
│   │           │   └── MaintenanceRequest.cs
│   │           ├── GraphQL/
│   │           │   ├── Queries/
│   │           │   ├── Mutations/
│   │           │   └── Types/
│   │           ├── Infrastructure/
│   │           │   ├── Data/
│   │           │   │   └── CopropertyDbContext.cs
│   │           │   └── Repositories/
│   │           └── Migrations/
│   │
│   └── front/
│       └── myb.front/
│           └── libs/
│               └── coproperty-module/      # Nouveau module frontend
│                   ├── src/
│                   │   ├── lib/
│                   │   │   ├── components/
│                   │   │   │   ├── coproperty-list/
│                   │   │   │   ├── coproperty-detail/
│                   │   │   │   ├── unit-management/
│                   │   │   │   ├── charge-management/
│                   │   │   │   ├── payment-tracking/
│                   │   │   │   └── maintenance-requests/
│                   │   │   ├── services/
│                   │   │   │   ├── coproperty.service.ts
│                   │   │   │   ├── charge.service.ts
│                   │   │   │   └── maintenance.service.ts
│                   │   │   └── models/
│                   │   └── index.ts
│                   └── project.json
│
└── docker-compose.yml                      # Mise à jour avec nouveau service
```

### Diagramme d'architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Application                       │
│              (Angular - Coproperty Module)                  │
├─────────────────────────────────────────────────────────────┤
│                   API Gateway (GraphQL)                     │
├─────────────────────────────────────────────────────────────┤
│                  Keycloak Authentication                    │
├──────────────┬──────────────┬──────────────┬────────────────┤
│  Coproperty  │   Invoice    │   Payment    │  Notification  │
│   Service    │   Service    │   Service    │    Service     │
├──────────────┼──────────────┼──────────────┼────────────────┤
│ PostgreSQL   │ PostgreSQL   │   Stripe     │    SignalR     │
│ Coproperty   │ Invoice DB   │     API      │                │
└──────────────┴──────────────┴──────────────┴────────────────┘
```

---

## Modèle de données

### Schéma de base de données

#### Table: Coproperties

```sql
CREATE TABLE Coproperties (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Name VARCHAR(200) NOT NULL,
    Address VARCHAR(500) NOT NULL,
    City VARCHAR(100) NOT NULL,
    PostalCode VARCHAR(20) NOT NULL,
    Country VARCHAR(100) DEFAULT 'France',
    Description TEXT,
    TotalUnits INT NOT NULL DEFAULT 0,
    TotalShares INT NOT NULL,
    CommonAreas TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    IsActive BOOLEAN DEFAULT TRUE,
    ManagerId UUID NOT NULL,
    CONSTRAINT FK_Manager FOREIGN KEY (ManagerId) 
        REFERENCES Users(Id) ON DELETE RESTRICT
);

CREATE INDEX idx_coproperties_active ON Coproperties(IsActive);
CREATE INDEX idx_coproperties_manager ON Coproperties(ManagerId);
```

#### Table: Units (Lots)

```sql
CREATE TABLE Units (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    CopropertyId UUID NOT NULL,
    UnitNumber VARCHAR(50) NOT NULL,
    Floor INT,
    Area DECIMAL(10,2),
    Shares INT NOT NULL,
    UnitType VARCHAR(50),
    Description TEXT,
    IsOccupied BOOLEAN DEFAULT FALSE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_Unit_Coproperty FOREIGN KEY (CopropertyId) 
        REFERENCES Coproperties(Id) ON DELETE CASCADE,
    CONSTRAINT UQ_Unit_Number UNIQUE (CopropertyId, UnitNumber)
);

CREATE INDEX idx_units_coproperty ON Units(CopropertyId);
```

#### Table: Owners

```sql
CREATE TABLE Owners (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    UserId UUID NOT NULL,
    UnitId UUID NOT NULL,
    OwnershipPercentage DECIMAL(5,2) DEFAULT 100.00,
    StartDate DATE NOT NULL,
    EndDate DATE,
    IsMainOwner BOOLEAN DEFAULT TRUE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_Owner_User FOREIGN KEY (UserId) 
        REFERENCES Users(Id) ON DELETE RESTRICT,
    CONSTRAINT FK_Owner_Unit FOREIGN KEY (UnitId) 
        REFERENCES Units(Id) ON DELETE CASCADE,
    CONSTRAINT CHK_Percentage CHECK (OwnershipPercentage > 0 AND OwnershipPercentage <= 100)
);

CREATE INDEX idx_owners_user ON Owners(UserId);
CREATE INDEX idx_owners_unit ON Owners(UnitId);
```

#### Table: Charges

```sql
CREATE TABLE Charges (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    CopropertyId UUID NOT NULL,
    Name VARCHAR(200) NOT NULL,
    Description TEXT,
    ChargeType VARCHAR(50) NOT NULL,
    Frequency VARCHAR(50) NOT NULL,
    TotalAmount DECIMAL(10,2) NOT NULL,
    DistributionMethod VARCHAR(50) NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE,
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CreatedBy UUID NOT NULL,
    CONSTRAINT FK_Charge_Coproperty FOREIGN KEY (CopropertyId) 
        REFERENCES Coproperties(Id) ON DELETE CASCADE,
    CONSTRAINT CHK_Amount CHECK (TotalAmount >= 0)
);

CREATE INDEX idx_charges_coproperty ON Charges(CopropertyId);
CREATE INDEX idx_charges_active ON Charges(IsActive);
```

**ChargeType:**
- `Cleaning` - Nettoyage
- `Security` - Sécurité
- `Maintenance` - Entretien
- `Electricity` - Électricité parties communes
- `Water` - Eau
- `Insurance` - Assurance
- `Other` - Autre

**Frequency:**
- `Monthly` - Mensuelle
- `Quarterly` - Trimestrielle
- `Annual` - Annuelle
- `Exceptional` - Exceptionnelle

**DistributionMethod:**
- `ByShares` - Par tantièmes
- `ByArea` - Par surface
- `Equal` - Parts égales
- `Custom` - Personnalisé

#### Table: ChargeDistributions

```sql
CREATE TABLE ChargeDistributions (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ChargeId UUID NOT NULL,
    UnitId UUID NOT NULL,
    Amount DECIMAL(10,2) NOT NULL,
    CalculatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_Distribution_Charge FOREIGN KEY (ChargeId) 
        REFERENCES Charges(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Distribution_Unit FOREIGN KEY (UnitId) 
        REFERENCES Units(Id) ON DELETE CASCADE,
    CONSTRAINT UQ_Charge_Unit UNIQUE (ChargeId, UnitId)
);
```

#### Table: CopropertyInvoices

```sql
CREATE TABLE CopropertyInvoices (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    InvoiceNumber VARCHAR(50) NOT NULL UNIQUE,
    ChargeId UUID NOT NULL,
    UnitId UUID NOT NULL,
    OwnerId UUID NOT NULL,
    Amount DECIMAL(10,2) NOT NULL,
    TaxAmount DECIMAL(10,2) DEFAULT 0,
    TotalAmount DECIMAL(10,2) NOT NULL,
    InvoiceDate DATE NOT NULL,
    DueDate DATE NOT NULL,
    Status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    PaidDate DATE,
    PaymentMethod VARCHAR(50),
    Notes TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_Invoice_Charge FOREIGN KEY (ChargeId) 
        REFERENCES Charges(Id) ON DELETE RESTRICT,
    CONSTRAINT FK_Invoice_Unit FOREIGN KEY (UnitId) 
        REFERENCES Units(Id) ON DELETE RESTRICT,
    CONSTRAINT FK_Invoice_Owner FOREIGN KEY (OwnerId) 
        REFERENCES Owners(Id) ON DELETE RESTRICT
);

CREATE INDEX idx_invoices_status ON CopropertyInvoices(Status);
CREATE INDEX idx_invoices_unit ON CopropertyInvoices(UnitId);
CREATE INDEX idx_invoices_owner ON CopropertyInvoices(OwnerId);
```

**Status:**
- `Pending` - En attente
- `PartiallyPaid` - Partiellement payé
- `Paid` - Payé
- `Overdue` - En retard
- `Cancelled` - Annulé

#### Table: Payments

```sql
CREATE TABLE Payments (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    InvoiceId UUID NOT NULL,
    Amount DECIMAL(10,2) NOT NULL,
    PaymentDate DATE NOT NULL,
    PaymentMethod VARCHAR(50) NOT NULL,
    TransactionId VARCHAR(200),
    Notes TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CreatedBy UUID NOT NULL,
    CONSTRAINT FK_Payment_Invoice FOREIGN KEY (InvoiceId) 
        REFERENCES CopropertyInvoices(Id) ON DELETE CASCADE
);

CREATE INDEX idx_payments_invoice ON Payments(InvoiceId);
```

#### Table: MaintenanceRequests

```sql
CREATE TABLE MaintenanceRequests (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    CopropertyId UUID NOT NULL,
    UnitId UUID,
    RequestedBy UUID NOT NULL,
    Title VARCHAR(200) NOT NULL,
    Description TEXT NOT NULL,
    Category VARCHAR(50) NOT NULL,
    Priority VARCHAR(50) DEFAULT 'Normal',
    Status VARCHAR(50) DEFAULT 'Pending',
    AssignedTo UUID,
    EstimatedCost DECIMAL(10,2),
    ActualCost DECIMAL(10,2),
    ScheduledDate DATE,
    CompletedDate DATE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_Request_Coproperty FOREIGN KEY (CopropertyId) 
        REFERENCES Coproperties(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Request_Unit FOREIGN KEY (UnitId) 
        REFERENCES Units(Id) ON DELETE SET NULL,
    CONSTRAINT FK_Request_User FOREIGN KEY (RequestedBy) 
        REFERENCES Users(Id) ON DELETE RESTRICT
);

CREATE INDEX idx_maintenance_status ON MaintenanceRequests(Status);
CREATE INDEX idx_maintenance_coproperty ON MaintenanceRequests(CopropertyId);
```

**Category:**
- `Plumbing` - Plomberie
- `Electrical` - Électricité
- `Heating` - Chauffage
- `Cleaning` - Nettoyage
- `Security` - Sécurité
- `Structural` - Structure
- `Other` - Autre

**Priority:**
- `Low` - Basse
- `Normal` - Normale
- `High` - Haute
- `Emergency` - Urgence

**Status:**
- `Pending` - En attente
- `Assigned` - Assigné
- `InProgress` - En cours
- `Completed` - Terminé
- `Cancelled` - Annulé

---

## Endpoints GraphQL

### Queries

```graphql
type Query {
  # Copropriétés
  coproperties: [Coproperty!]!
  coproperty(id: UUID!): Coproperty
  copropertiesByManager(managerId: UUID!): [Coproperty!]!
  
  # Lots
  units(copropertyId: UUID!): [Unit!]!
  unit(id: UUID!): Unit
  unitsByOwner(ownerId: UUID!): [Unit!]!
  
  # Copropriétaires
  owners(copropertyId: UUID!): [Owner!]!
  owner(id: UUID!): Owner
  ownersByUnit(unitId: UUID!): [Owner!]!
  
  # Charges
  charges(copropertyId: UUID!): [Charge!]!
  charge(id: UUID!): Charge
  activeCharges(copropertyId: UUID!): [Charge!]!
  chargeDistributions(chargeId: UUID!): [ChargeDistribution!]!
  
  # Factures
  invoices(copropertyId: UUID!): [CopropertyInvoice!]!
  invoice(id: UUID!): CopropertyInvoice
  invoicesByOwner(ownerId: UUID!): [CopropertyInvoice!]!
  overdueInvoices(copropertyId: UUID!): [CopropertyInvoice!]!
  
  # Paiements
  payments(invoiceId: UUID!): [Payment!]!
  payment(id: UUID!): Payment
  
  # Maintenance
  maintenanceRequests(copropertyId: UUID!): [MaintenanceRequest!]!
  maintenanceRequest(id: UUID!): MaintenanceRequest
  myMaintenanceRequests(userId: UUID!): [MaintenanceRequest!]!
}
```

### Mutations

```graphql
type Mutation {
  # Copropriétés
  createCoproperty(input: CreateCopropertyInput!): Coproperty!
  updateCoproperty(id: UUID!, input: UpdateCopropertyInput!): Coproperty!
  deleteCoproperty(id: UUID!): Boolean!
  
  # Lots
  createUnit(input: CreateUnitInput!): Unit!
  updateUnit(id: UUID!, input: UpdateUnitInput!): Unit!
  deleteUnit(id: UUID!): Boolean!
  
  # Copropriétaires
  addOwner(input: AddOwnerInput!): Owner!
  updateOwner(id: UUID!, input: UpdateOwnerInput!): Owner!
  removeOwner(id: UUID!): Boolean!
  
  # Charges
  createCharge(input: CreateChargeInput!): Charge!
  updateCharge(id: UUID!, input: UpdateChargeInput!): Charge!
  deleteCharge(id: UUID!): Boolean!
  distributeCharge(chargeId: UUID!): [ChargeDistribution!]!
  
  # Factures
  generateInvoices(chargeId: UUID!): [CopropertyInvoice!]!
  updateInvoiceStatus(id: UUID!, status: InvoiceStatus!): CopropertyInvoice!
  cancelInvoice(id: UUID!): Boolean!
  
  # Paiements
  recordPayment(input: RecordPaymentInput!): Payment!
  
  # Maintenance
  createMaintenanceRequest(input: CreateMaintenanceInput!): MaintenanceRequest!
  updateMaintenanceRequest(id: UUID!, input: UpdateMaintenanceInput!): MaintenanceRequest!
  assignMaintenance(id: UUID!, technicianId: UUID!): MaintenanceRequest!
  completeMaintenanceRequest(id: UUID!, actualCost: Decimal): MaintenanceRequest!
}
```

### Types

```graphql
type Coproperty {
  id: UUID!
  name: String!
  address: String!
  city: String!
  postalCode: String!
  country: String!
  description: String
  totalUnits: Int!
  totalShares: Int!
  commonAreas: String
  managerId: UUID!
  manager: User!
  units: [Unit!]!
  charges: [Charge!]!
  isActive: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Unit {
  id: UUID!
  copropertyId: UUID!
  coproperty: Coproperty!
  unitNumber: String!
  floor: Int
  area: Decimal
  shares: Int!
  unitType: String
  description: String
  isOccupied: Boolean!
  owners: [Owner!]!
  invoices: [CopropertyInvoice!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Owner {
  id: UUID!
  userId: UUID!
  user: User!
  unitId: UUID!
  unit: Unit!
  ownershipPercentage: Decimal!
  startDate: Date!
  endDate: Date
  isMainOwner: Boolean!
  invoices: [CopropertyInvoice!]!
  createdAt: DateTime!
}

type Charge {
  id: UUID!
  copropertyId: UUID!
  coproperty: Coproperty!
  name: String!
  description: String
  chargeType: ChargeType!
  frequency: ChargeFrequency!
  totalAmount: Decimal!
  distributionMethod: DistributionMethod!
  startDate: Date!
  endDate: Date
  isActive: Boolean!
  distributions: [ChargeDistribution!]!
  createdAt: DateTime!
  createdBy: UUID!
}

type ChargeDistribution {
  id: UUID!
  chargeId: UUID!
  charge: Charge!
  unitId: UUID!
  unit: Unit!
  amount: Decimal!
  calculatedAt: DateTime!
}

type CopropertyInvoice {
  id: UUID!
  invoiceNumber: String!
  chargeId: UUID!
  charge: Charge!
  unitId: UUID!
  unit: Unit!
  ownerId: UUID!
  owner: Owner!
  amount: Decimal!
  taxAmount: Decimal!
  totalAmount: Decimal!
  invoiceDate: Date!
  dueDate: Date!
  status: InvoiceStatus!
  paidDate: Date
  paymentMethod: String
  notes: String
  payments: [Payment!]!
  createdAt: DateTime!
}

type Payment {
  id: UUID!
  invoiceId: UUID!
  invoice: CopropertyInvoice!
  amount: Decimal!
  paymentDate: Date!
  paymentMethod: String!
  transactionId: String
  notes: String
  createdAt: DateTime!
  createdBy: UUID!
}

type MaintenanceRequest {
  id: UUID!
  copropertyId: UUID!
  coproperty: Coproperty!
  unitId: UUID
  unit: Unit
  requestedBy: UUID!
  requester: User!
  title: String!
  description: String!
  category: MaintenanceCategory!
  priority: Priority!
  status: MaintenanceStatus!
  assignedTo: UUID
  technician: User
  estimatedCost: Decimal
  actualCost: Decimal
  scheduledDate: Date
  completedDate: Date
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum ChargeType {
  CLEANING
  SECURITY
  MAINTENANCE
  ELECTRICITY
  WATER
  INSURANCE
  OTHER
}

enum ChargeFrequency {
  MONTHLY
  QUARTERLY
  ANNUAL
  EXCEPTIONAL
}

enum DistributionMethod {
  BY_SHARES
  BY_AREA
  EQUAL
  CUSTOM
}

enum InvoiceStatus {
  PENDING
  PARTIALLY_PAID
  PAID
  OVERDUE
  CANCELLED
}

enum MaintenanceCategory {
  PLUMBING
  ELECTRICAL
  HEATING
  CLEANING
  SECURITY
  STRUCTURAL
  OTHER
}

enum Priority {
  LOW
  NORMAL
  HIGH
  EMERGENCY
}

enum MaintenanceStatus {
  PENDING
  ASSIGNED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

---

## Fonctionnalités

### 1. Gestion des copropriétés

**Création d'une copropriété:**
```graphql
mutation {
  createCoproperty(input: {
    name: "Résidence Les Jardins"
    address: "123 Avenue de Paris"
    city: "Lyon"
    postalCode: "69002"
    totalShares: 1000
    description: "Résidence moderne avec espaces verts"
    managerId: "uuid-manager"
  }) {
    id
    name
    totalUnits
  }
}
```

**Calculs automatiques:**
- Total des lots
- Total des tantièmes
- Statistiques occupancy rate

### 2. Gestion des lots

**Ajout de lots:**
```graphql
mutation {
  createUnit(input: {
    copropertyId: "uuid-coproperty"
    unitNumber: "A101"
    floor: 1
    area: 75.5
    shares: 50
    unitType: "T3"
  }) {
    id
    unitNumber
    shares
  }
}
```

### 3. Répartition des charges

**Algorithme de répartition:**

```typescript
// Par tantièmes
function distributeByShares(charge: Charge, units: Unit[]): ChargeDistribution[] {
  const totalShares = units.reduce((sum, u) => sum + u.shares, 0);
  
  return units.map(unit => ({
    unitId: unit.id,
    amount: (charge.totalAmount * unit.shares) / totalShares
  }));
}

// Par surface
function distributeByArea(charge: Charge, units: Unit[]): ChargeDistribution[] {
  const totalArea = units.reduce((sum, u) => sum + u.area, 0);
  
  return units.map(unit => ({
    unitId: unit.id,
    amount: (charge.totalAmount * unit.area) / totalArea
  }));
}

// Parts égales
function distributeEqually(charge: Charge, units: Unit[]): ChargeDistribution[] {
  const amountPerUnit = charge.totalAmount / units.length;
  
  return units.map(unit => ({
    unitId: unit.id,
    amount: amountPerUnit
  }));
}
```

### 4. Génération de factures

**Processus automatisé:**
1. Création de charge
2. Distribution aux lots
3. Génération de factures individuelles
4. Envoi de notifications
5. Suivi des paiements

### 5. Workflow de maintenance

```
Demande créée (Copropriétaire)
    ↓
Validation (Syndic)
    ↓
Assignation (Technicien)
    ↓
Intervention
    ↓
Clôture + Coût
    ↓
Notification finale
```

---

## Intégrations

### 1. User Manager

**Authentification et autorisation:**
```csharp
[Authorize(Roles = "Syndic,Admin")]
public async Task<Coproperty> CreateCoproperty(
    CreateCopropertyInput input,
    [Service] ICopropertyService service)
{
    return await service.CreateAsync(input);
}
```

### 2. Invoice Service

**Génération de factures:**
```csharp
public async Task<List<Invoice>> GenerateInvoicesFromCharge(Guid chargeId)
{
    var distributions = await GetChargeDistributions(chargeId);
    var invoices = new List<Invoice>();
    
    foreach (var distribution in distributions)
    {
        var invoice = new Invoice
        {
            Amount = distribution.Amount,
            DueDate = DateTime.Now.AddDays(30),
            // ...
        };
        
        await _invoiceService.CreateAsync(invoice);
        invoices.Add(invoice);
    }
    
    return invoices;
}
```

### 3. Payment Service (Stripe)

**Traitement des paiements:**
```csharp
public async Task<Payment> ProcessPayment(Guid invoiceId, PaymentInput input)
{
    // Créer charge Stripe
    var stripeCharge = await _stripeService.CreateChargeAsync(new ChargeCreateOptions
    {
        Amount = (long)(input.Amount * 100),
        Currency = "eur",
        Description = $"Payment for invoice {invoiceId}"
    });
    
    // Enregistrer paiement
    var payment = new Payment
    {
        InvoiceId = invoiceId,
        Amount = input.Amount,
        TransactionId = stripeCharge.Id,
        PaymentMethod = "Stripe"
    };
    
    await _repository.AddAsync(payment);
    
    // Mettre à jour statut facture
    await UpdateInvoiceStatus(invoiceId);
    
    return payment;
}
```

### 4. Notification Service

**Événements déclencheurs:**
```csharp
public async Task SendChargeNotification(Charge charge)
{
    var owners = await GetAffectedOwners(charge.CopropertyId);
    
    foreach (var owner in owners)
    {
        await _notificationService.SendAsync(new Notification
        {
            UserId = owner.UserId,
            Type = NotificationType.ChargeCreated,
            Title = "Nouvelle charge",
            Message = $"Une nouvelle charge '{charge.Name}' a été créée",
            Data = new { ChargeId = charge.Id }
        });
    }
}
```

### 5. Document Management

**Documents associés:**
- Règlement de copropriété
- Procès-verbaux d'AG
- Contrats fournisseurs
- Factures de charges
- Attestations d'assurance

---

## Installation et configuration

### 1. Backend Setup

```bash
# Créer le projet
cd src/services
mkdir coproperty-management
cd coproperty-management

# Créer le projet ASP.NET Core
dotnet new webapi -n Myb.Coproperty
cd Myb.Coproperty

# Ajouter les packages NuGet
dotnet add package Microsoft.EntityFrameworkCore
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL
dotnet add package HotChocolate.AspNetCore
dotnet add package HotChocolate.Data.EntityFramework
```

### 2. Configuration de la base de données

**appsettings.json:**
```json
{
  "ConnectionStrings": {
    "CopropertyDb": "Host=localhost;Port=5435;Database=copropertyDB;Username=postgres;Password=coproperty-pwd"
  },
  "Keycloak": {
    "Authority": "http://localhost:8080/realms/MYB",
    "ClientId": "MYB-client",
    "ClientSecret": "your-secret"
  }
}
```

### 3. Migrations

```bash
# Créer migration initiale
dotnet ef migrations add InitialCreate

# Appliquer migration
dotnet ef database update
```

### 4. Docker configuration

**Mise à jour de docker-compose.yml:**
```yaml
services:
  coproperty-service:
    build:
      context: ./src/services/coproperty-management
      dockerfile: Dockerfile
    ports:
      - "5008:80"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__CopropertyDb=Host=copropertyDB;Port=5432;Database=copropertyDB;Username=postgres;Password=coproperty-pwd
    depends_on:
      - copropertyDB
      - keycloak

  copropertyDB:
    image: postgres:16.2
    environment:
      - POSTGRES_DB=copropertyDB
      - POSTGRES_PASSWORD=coproperty-pwd
    ports:
      - "5435:5432"
    volumes:
      - coproperty_data