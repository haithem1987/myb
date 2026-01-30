# Module de Gestion de Copropriété - Spécification Complète

## 🎯 Objectif du Module

Ce module permet à un syndic (professionnel ou bénévole) et aux copropriétaires de gérer tous les aspects administratifs, financiers, techniques et communicationnels d'une copropriété dans une seule plateforme centralisée.

---

## Table des matières

- [1. Fonctionnalités Métier](#1-fonctionnalités-métier)
- [2. Architecture Logicielle](#2-architecture-logicielle)
- [3. Modèle de Données](#3-modèle-de-données)
- [4. Endpoints GraphQL](#4-endpoints-graphql)
- [5. UX/UI - Design des Interfaces](#5-uxui---design-des-interfaces)
- [6. Intégrations](#6-intégrations)
- [7. Sécurité et Conformité](#7-sécurité-et-conformité)
- [8. Installation et Configuration](#8-installation-et-configuration)
- [9. Roadmap et Extensions](#9-roadmap-et-extensions)

---

## 1. Fonctionnalités Métier

### A. Gestion Administrative ✅

**Gestion des copropriétés:**
- Création et gestion de multiples copropriétés dans une même instance
- Fiches détaillées avec toutes les informations légales
- Gestion des immeubles, bâtiments et parties communes
- Configuration des espaces communs (parking, jardins, locaux techniques)

**Gestion des lots:**
- Création et gestion des lots (appartements, parkings, caves)
- Informations détaillées:
  - Numéro de lot
  - Surface habitable
  - Étage et position
  - Tantièmes (parts de copropriété)
  - Type de lot (T1, T2, T3, parking, cave)
  - Statut (occupé, loué, vacant)

**Gestion des propriétaires et occupants:**
- Fiches propriétaires avec coordonnées complètes
- Gestion des co-propriétaires (plusieurs propriétaires par lot)
- Pourcentage de propriété par lot
- Suivi des occupants (propriétaires ou locataires)
- Historique des propriétaires par lot

**Import/Export de données:**
- Import massif de copropriétés, lots et propriétaires (CSV, Excel)
- Export des données pour analyse externe (PDF, Excel, CSV)
- Templates d'import prédéfinis
- Utilisation du **Document Management Service** existant pour stocker les fichiers d'import/export
- Génération de rapports d'import avec détails et erreurs

---

### B. Comptabilité & Finances 💶

#### 📌 Appels de fonds & répartition des charges

**Création d'appels de fonds:**
- Appels périodiques (mensuels, trimestriels, annuels)
- Appels exceptionnels pour travaux
- Calcul automatisé basé sur:
  - Tantièmes (parts de copropriété)
  - Surface des lots
  - Répartition personnalisée

**Types de charges:**
- **Générales:** Bénéficient à l'ensemble de la copropriété
  - Entretien parties communes
  - Assurance immeuble
  - Honoraires syndic
  - Électricité parties communes
  - Eau parties communes
  - Nettoyage
  - Sécurité

- **Spéciales:** Bénéficient à certains lots uniquement
  - Ascenseur (étages supérieurs)
  - Chauffage collectif
  - Parking
  - Espaces verts spécifiques

**Calcul automatisé:**
```
Montant par lot = (Charge totale × Tantièmes du lot) / Total tantièmes
OU
Montant par lot = (Charge totale × Surface du lot) / Surface totale
```

#### 📌 Gestion comptable complète

**Saisie des opérations:**
- Factures fournisseurs
- Encaissements propriétaires
- Dépenses courantes
- Mouvements bancaires

**Gestion des impayés:**
- Détection automatique des retards de paiement
- Système de relances automatisées:
  - 1ère relance à J+10
  - 2ème relance à J+30
  - Mise en demeure à J+60
- Historique des relances par propriétaire
- Calcul des pénalités de retard (optionnel)

**Comptabilité analytique:**
- Rapprochement bancaire automatisé
- Suivi des soldes par compte
- Grand livre comptable
- Plans comptables spécifiques copropriété
- Balance générale
- Journal des opérations

#### 📌 États financiers et rapports

**Documents financiers générés:**
- Bilan annuel de la copropriété
- Balance comptable détaillée
- État des comptes par lot
- Synthèse des charges par catégorie
- Tableau de répartition des charges
- Prévisionnel budgétaire

**Formats d'export:**
- PDF pour envoi aux propriétaires
- Excel pour analyse approfondie
- CSV pour intégration externe

---

### C. Assemblées Générales (AG) & Gouvernance 🏛️

**Planification des AG:**
- Calendrier annuel des AG ordinaires
- Création d'AG extraordinaires
- Définition de l'ordre du jour
- Gestion des résolutions à voter

**Gestion des convocations:**
- Génération automatique des convocations
- Envoi par email et/ou courrier recommandé
- Accusés de réception
- Rappels automatiques (J-15, J-7, J-1)

**Outils d'aide à la décision:**
- Calcul automatique du quorum
- Gestion des pouvoirs et procurations
- Feuille de présence digitale
- Comptage des votes en temps réel
- Types de vote:
  - Majorité simple
  - Majorité absolue
  - Double majorité (article 26)
  - Unanimité

**Vote électronique:**
- Vote en ligne avant l'AG
- Vote pendant l'AG (via application)
- Résultats en temps réel
- Certificat de vote
- Blockchain pour traçabilité (optionnel)

**Procès-verbaux (PV):**
- Génération automatique de PV pré-remplis
- Templates personnalisables
- Export PDF avec signature électronique
- Archivage automatique
- Publication aux propriétaires

---

### D. Gestion Documentaire (GED) 📄

**Types de documents gérés:**

**Documents légaux:**
- Règlement de copropriété
- État descriptif de division
- Actes de vente
- Baux de location
- Attestations d'assurance

**Documents administratifs:**
- Procès-verbaux d'AG
- Convocations
- Ordres du jour
- Feuilles de présence

**Documents techniques:**
- Diagnostics obligatoires (DPE, amiante, plomb)
- Carnets d'entretien
- Plans de l'immeuble
- Schémas techniques

**Documents financiers:**
- Factures fournisseurs
- Appels de fonds
- Relevés bancaires
- Bilans annuels

**Fonctionnalités GED:**
- Upload par drag & drop
- Classement par catégorie et tags
- Versioning automatique
- Recherche full-text
- Prévisualisation en ligne
- Téléchargement individuel ou en masse
- Partage sécurisé avec liens temporaires
- Droits d'accès par rôle
- Signature électronique intégrée

---

### E. Maintenance & Suivi des Interventions 🔧

**Système de signalement:**
- Création de tickets par les propriétaires/occupants
- Catégories de signalement:
  - Plomberie
  - Électricité
  - Chauffage
  - Ascenseur
  - Nettoyage
  - Sécurité
  - Structure/Façade
  - Autres

**Niveaux de priorité:**
- 🔴 **Urgence:** Intervention immédiate (fuite, panne ascenseur)
- 🟠 **Haute:** Dans les 48h (problème chauffage)
- 🟡 **Normale:** Dans la semaine
- 🟢 **Basse:** Planifiable

**Workflow de traitement:**
```
Signalement créé (Propriétaire/Occupant)
    ↓
Validation/Qualification (Syndic)
    ↓
Assignation à un prestataire
    ↓
Intervention planifiée
    ↓
Intervention réalisée
    ↓
Validation par le syndic
    ↓
Clôture du ticket
    ↓
Facturation et paiement
```

**Registre d'entretien:**
- Planification des visites techniques obligatoires
- Suivi des contrats de maintenance:
  - Ascenseurs
  - Chaudières
  - Extincteurs
  - Portes automatiques
  - Systèmes de sécurité
- Alertes d'échéance
- Historique complet des interventions
- Traçabilité pour contrôles réglementaires

**Gestion des prestataires:**
- Base de données fournisseurs
- Coordonnées et spécialités
- Évaluation et notes
- Historique des interventions
- Contrats et tarifs

---

### F. Communication & Collaboration 📣

**Messagerie interne:**
- Conversations privées Syndic ↔ Propriétaire
- Messages groupés par bâtiment/lot
- Fils de discussion par sujet
- Pièces jointes
- Accusés de lecture

**Notifications automatiques:**

| Événement | Destinataires | Canal |
|-----------|--------------|-------|
| Nouvel appel de fonds | Propriétaires concernés | Email + App |
| Rappel paiement | Propriétaires en retard | Email + SMS |
| Nouvelle AG planifiée | Tous les propriétaires | Email + App |
| Nouveau document disponible | Selon droits d'accès | Email + App |
| Signalement traité | Auteur du signalement | Email + App |
| Nouveau vote | Propriétaires votants | Email + App |

**Espace communautaire:**
- Forum de discussion modéré
- Annonces du syndic (travaux, coupures d'eau, etc.)
- Messagerie de voisinage
- Partage de documents
- Calendrier des événements

**Portail propriétaire:**
- Espace personnel sécurisé
- Accès 24/7 aux informations
- Téléchargement de documents
- Historique des paiements
- Soumission de demandes

---

### G. Paiements & Intégration Bancaire 💳

**Moyens de paiement acceptés:**
- Carte bancaire (Stripe)
- Virement SEPA
- Prélèvement automatique (SEPA Direct Debit)
- Chèque (enregistrement manuel)
- Espèces (enregistrement manuel)

**Paiements en ligne:**
- Interface de paiement sécurisée (Stripe)
- Paiement en 1 fois ou en plusieurs fois
- Sauvegarde des moyens de paiement
- Paiement récurrent automatisé
- Rappels avant prélèvement

**Gestion des encaissements:**
- Génération automatique des reçus
- Lettrage automatique des paiements
- Mise à jour en temps réel des soldes
- Réconciliation bancaire automatisée

**Import/Export bancaire:**
- Import des relevés bancaires (SEPA/CODA/CSV)
- Rapprochement automatique
- Export pour expert-comptable
- Intégration API bancaire (Open Banking)

**Traçabilité:**
- Historique complet des transactions
- Preuve de paiement horodatée
- Logs d'opérations
- Export pour audit

---

### H. Tableaux de Bord & Reporting 📊

#### Dashboard Syndic

**Indicateurs clés (KPI):**
- 💰 **Solde de trésorerie:** Montant disponible
- 📈 **Charges à recouvrer:** Total des impayés
- 🏠 **Nombre de lots:** Total et par type
- 🔧 **Incidents en attente:** Nombre de tickets ouverts
- 📊 **Taux de recouvrement:** % des charges payées
- 📅 **Prochaine AG:** Date et jours restants

**Graphiques et visualisations:**
- Évolution de la trésorerie (12 derniers mois)
- Répartition des charges par catégorie (pie chart)
- Évolution des encaissements (line chart)
- Taux d'occupation des lots
- Délais moyens de résolution des tickets

**Notifications et alertes:**
- Nouveaux paiements reçus
- Nouveaux signalements
- Échéances importantes
- Documents en attente de validation

**Actions rapides:**
- Créer un appel de fonds
- Créer une AG
- Générer un rapport
- Voir les impayés

#### Dashboard Copropriétaire

**Vue personnelle:**
- 💳 **Appels de fonds à payer:** Montant et échéance
- 📄 **Derniers documents:** PV, factures, convocations
- ✉️ **Messages non lus:** Nombre et aperçu
- 🔧 **Mes signalements:** Statut en cours
- 📊 **Mon solde:** À jour ou en retard

**Historique:**
- Paiements effectués (12 derniers mois)
- Documents téléchargés
- Participation aux AG
- Historique des votes

#### Dashboard Conseil Syndical

**Vue globale:**
- Rapports financiers détaillés
- États des comptes par lot
- Suivi des travaux en cours
- Budget prévisionnel vs réalisé
- Analyse des dépenses

**Outils d'analyse:**
- Comparaison année N vs N-1
- Ratios financiers
- Prévisions budgétaires
- Export Excel pour analyse

---

## 2. Architecture Logicielle

### Vue d'ensemble

```
┌───────────────────────────────────────────────────┐
│              Client Applications                  │
│                   Web App      
│              (Angular 17 + Nx)                    │
└────────────────────┬──────────────────────────────┘
                     │
                     ▼
              ┌──────────────────┐
              │   API Gateway    │
              │   (GraphQL/REST) │
              └──────┬───────────┘
       ┌─────────────┼────────────────┐
       │             │                │
       ▼             ▼                ▼
┌──────────────┐  ┌──────────────────┐  ┌──────────────┐
│  Auth & IAM  │  │  Coproperty      │  │  Finances &  │
│  (Keycloak)  │  │   Admin &        │  │ Comptabilité │
│   JWT/RBAC   │  │    Users         │  │   Service    │
└──────────────┘  └──────────────────┘  └──────┬───────┘
                                               │
        ┌──────────────────────────────────────┼────────────────────┐
        │                                      │                    │
        ▼                                      ▼                    ▼
┌──────────────┐                  ┌──────────────┐  ┌──────────────┐
│ Assemblées   │                  │  Documents   │  │ Maintenance  │
│  Générales   │                  │     GED      │  │     &        │
│  & Votes     │                  │   Service    │  │ Interventions│
└──────────────┘                  └──────────────┘  └──────────────┘
        │                                  │                  │
        └──────────────────────────────────┼──────────────────┘
                                           │
                          ┌────────────────┼────────────────┐
                          │                │                │
                          ▼                ▼                ▼
                  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
                  │ Communication│ │   Payment    │ │  Notification│
                  │  & Messages  │ │   Service    │ │   Service    │
                  └──────────────┘ └──────────────┘ └──────────────┘
                          │                │                │
                          └────────────────┼────────────────┘
                                           │
                                           ▼
                              ┌────────────────────────┐
                              │      Data Layer        │
                              │ PostgreSQL + Blob      │
                              │   Storage (S3/Azure)   │
                              └────────────────────────┘
```

### Services Microservices

#### 1. Coproperty Admin Service
**Port:** `5008`
**Responsabilité:** Gestion administrative
- CRUD copropriétés
- CRUD lots
- CRUD propriétaires
- Gestion des tantièmes
- Import/Export données

**Technologies:**
- ASP.NET Core 10.0
- Entity Framework Core
- PostgreSQL
- HotChocolate GraphQL

#### 2. Finance & Accounting Service
**Port:** `5009`
**Responsabilité:** Comptabilité et finances
- Création appels de fonds
- Calcul répartition charges
- Gestion encaissements
- Relances impayés
- Génération rapports financiers
- Rapprochement bancaire

**Technologies:**
- ASP.NET Core 10.0
- Entity Framework Core
- PostgreSQL
- Background jobs (Hangfire)

#### 3. Assembly & Voting Service
**Port:** `5010`
**Responsabilité:** Assemblées générales
- Planification AG
- Gestion convocations
- Vote électronique
- Génération PV
- Gestion quorum

**Technologies:**
- ASP.NET Core 10.0
- SignalR (real-time voting)
- PostgreSQL

#### 4. Document Management Service (GED)
**Port:** `5002`
**Responsabilité:** Gestion documentaire centralisée
- Upload/Download documents (PDF, images, fichiers)
- Gestion des versions et historique
- Classification et tags automatiques
- Recherche full-text
- Signature électronique
- **Intégration copropriété:**
  - Stockage des documents légaux (règlement, EDD)
  - Documents administratifs (PV AG, convocations)
  - Documents techniques (diagnostics, plans)
  - Documents financiers (factures, appels de fonds)
  - Gestion des fichiers d'export (rapports, bilans)
  - Gestion des fichiers d'import (données CSV/Excel)

**Technologies:**
- Existing Document Service
- Azure Blob Storage / AWS S3
- Elasticsearch (full-text search)
- GraphQL API

#### 5. Maintenance Service
**Port:** `5011`
**Responsabilité:** Tickets et interventions
- Création signalements
- Workflow tickets
- Assignation prestataires
- Suivi interventions
- Registre d'entretien

**Technologies:**
- ASP.NET Core 10.0
- PostgreSQL
- File upload support

#### 6. Communication Service
**Port:** `5012`
**Responsabilité:** Messagerie et notifications
- Messagerie interne
- Notifications push
- Emails automatiques
- SMS (optionnel)
- Forum communautaire

**Technologies:**
- ASP.NET Core 10.0
- SignalR (real-time messaging)
- SendGrid (emails)
- Twilio (SMS)

#### 7. Payment Service
**Port:** Shared with existing Payment Service
**Responsabilité:** Paiements
- Intégration Stripe
- Prélèvements SEPA
- Génération reçus
- Réconciliation paiements

**Technologies:**
- Existing Payment Service
- Stripe SDK
- SEPA Direct Debit

#### 8. Notification Service
**Port:** Shared with existing Notification Service
**Responsabilité:** Notifications cross-services
- Hub de notifications
- Templates emails
- Push notifications
- SMS gateway

### Principes d'architecture

✅ **Separation of Concerns:** Chaque service a une responsabilité claire
✅ **API First:** GraphQL + REST pour tous les services
✅ **Event-Driven:** Communication asynchrone via events
✅ **Sécurité:** JWT + RBAC sur tous les endpoints
✅ **Scalabilité:** Services indépendants déployables séparément
✅ **Résilience:** Circuit breakers, retry policies
✅ **Observabilité:** Logging, monitoring, tracing

**Design Patterns utilisés:**
- **Repository Pattern:** Abstraction de la couche de données
- **CQRS:** Séparation des commandes et des requêtes (pour rapports)
- **Domain Events:** Communication entre bounded contexts
- **Saga Pattern:** Transactions distribuées (ex: création appel de fonds)

---

## 3. Modèle de Données

### 3.1 Entités Principales

#### Coproperty (Copropriété)
```csharp
public class Coproperty
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string Address { get; set; }
    public string City { get; set; }
    public string PostalCode { get; set; }
    public int TotalUnits { get; set; }
    public int TotalShares { get; set; }
    public Guid ManagerId { get; set; }
    public bool IsActive { get; set; }
    
    // Navigation properties
    public User Manager { get; set; }
    public ICollection<Building> Buildings { get; set; }
    public ICollection<Unit> Units { get; set; }
    public ICollection<Charge> Charges { get; set; }
}
```

#### Unit (Lot)
```csharp
public class Unit
{
    public Guid Id { get; set; }
    public Guid CopropertyId { get; set; }
    public string UnitNumber { get; set; }
    public decimal Area { get; set; }
    public int Shares { get; set; } // Tantièmes
    public string UnitType { get; set; }
    public string OccupancyStatus { get; set; }
    
    // Navigation properties
    public Coproperty Coproperty { get; set; }
    public ICollection<Owner> Owners { get; set; }
    public ICollection<CopropertyInvoice> Invoices { get; set; }
}
```

#### Charge
```csharp
public class Charge
{
    public Guid Id { get; set; }
    public Guid CopropertyId { get; set; }
    public string Name { get; set; }
    public ChargeType ChargeType { get; set; }
    public decimal TotalAmount { get; set; }
    public DistributionMethod DistributionMethod { get; set; }
    public bool IsActive { get; set; }
    
    // Navigation properties
    public Coproperty Coproperty { get; set; }
    public ICollection<ChargeDistribution> Distributions { get; set; }
}

public enum ChargeType
{
    General,
    Special,
    Exceptional,
    Works
}

public enum DistributionMethod
{
    ByShares,
    ByArea,
    Equal,
    Custom
}
```

### 3.2 Schéma de Base de Données

Voir le document complet dans la section 3 de `COPROPERTY_MANAGEMENT_SPEC.md` pour le DDL SQL détaillé incluant:
- Tables complètes avec contraintes
- Index pour performance
- Triggers pour automatisation
- Relations et foreign keys

---

## 4. Endpoints GraphQL

### 4.1 Queries

```graphql
type Query {
  # Coproperties
  coproperty(id: UUID!): Coproperty
  coproperties(filter: CopropertyFilter): [Coproperty!]!
  
  # Units
  unit(id: UUID!): Unit
  unitsByCoproperty(copropertyId: UUID!): [Unit!]!
  
  # Owners
  owner(id: UUID!): Owner
  ownersByUnit(unitId: UUID!): [Owner!]!
  
  # Charges
  charge(id: UUID!): Charge
  chargesByCoproperty(copropertyId: UUID!, year: Int): [Charge!]!
  
  # Invoices
  invoice(id: UUID!): CopropertyInvoice
  invoicesByOwner(ownerId: UUID!): [CopropertyInvoice!]!
  overdueInvoices(copropertyId: UUID!): [CopropertyInvoice!]!
  
  # Assemblies
  assembly(id: UUID!): Assembly
  assembliesByCoproperty(copropertyId: UUID!): [Assembly!]!
  
  # Maintenance
  maintenanceRequest(id: UUID!): MaintenanceRequest
  maintenanceRequestsByCoproperty(
    copropertyId: UUID!
    status: MaintenanceStatus
  ): [MaintenanceRequest!]!
  
  # Reports
  financialReport(copropertyId: UUID!, year: Int!): FinancialReport!
  chargeDistributionReport(chargeId: UUID!): ChargeDistributionReport!
}
```

### 4.2 Mutations

```graphql
type Mutation {
  # Coproperty management
  createCoproperty(input: CreateCopropertyInput!): Coproperty!
  updateCoproperty(id: UUID!, input: UpdateCopropertyInput!): Coproperty!
  deleteCoproperty(id: UUID!): Boolean!
  
  # Unit management
  createUnit(input: CreateUnitInput!): Unit!
  updateUnit(id: UUID!, input: UpdateUnitInput!): Unit!
  assignOwner(unitId: UUID!, ownerId: UUID!): Owner!
  
  # Charge management
  createCharge(input: CreateChargeInput!): Charge!
  distributeCharge(chargeId: UUID!): [ChargeDistribution!]!
  updateChargeDistribution(id: UUID!, amount: Decimal!): ChargeDistribution!
  
  # Fund calls
  createFundCall(input: CreateFundCallInput!): FundCall!
  sendFundCall(fundCallId: UUID!): Boolean!
  
  # Invoices
  generateInvoices(fundCallId: UUID!): [CopropertyInvoice!]!
  recordPayment(input: RecordPaymentInput!): Payment!
  sendPaymentReminder(invoiceId: UUID!, level: Int!): Boolean!
  
  # Assemblies
  createAssembly(input: CreateAssemblyInput!): Assembly!
  sendConvocations(assemblyId: UUID!): Boolean!
  recordVote(input: RecordVoteInput!): Vote!
  closeAssembly(assemblyId: UUID!): Assembly!
  
  # Maintenance
  createMaintenanceRequest(input: CreateMaintenanceRequestInput!): MaintenanceRequest!
  assignMaintenanceRequest(id: UUID!, assignedTo: UUID!): MaintenanceRequest!
  updateMaintenanceStatus(id: UUID!, status: MaintenanceStatus!): MaintenanceRequest!
  
  # Communication
  sendMessage(input: SendMessageInput!): Message!
  sendNotification(input: SendNotificationInput!): Notification!
}
```

### 4.3 Subscriptions (Real-time)

```graphql
type Subscription {
  # Real-time notifications
  notificationReceived(userId: UUID!): Notification!
  
  # Real-time voting
  voteRecorded(resolutionId: UUID!): VoteUpdate!
  
  # Maintenance updates
  maintenanceRequestUpdated(copropertyId: UUID!): MaintenanceRequest!
  
  # Payment notifications
  paymentReceived(copropertyId: UUID!): Payment!
}
```

### 4.4 Endpoints Import/Export (Document Service)

```graphql
type Query {
  # Import/Export History
  getImportHistory(copropertyId: UUID!, pageSize: Int, pageNumber: Int): [ImportDocument!]!
  getExportHistory(copropertyId: UUID!, pageSize: Int, pageNumber: Int): [ExportDocument!]!
}

type Mutation {
  # Import data
  importCopropertyData(
    file: Upload!
    dataType: ImportDataType!
    copropertyId: UUID!
    userId: UUID!
  ): ImportResultPayload!
  
  # Export data
  exportCopropertyData(
    copropertyId: UUID!
    format: ExportFormat!
    dataTypes: [ExportDataType!]!
    userId: UUID!
  ): ExportResultPayload!
  
  # Get import template
  getImportTemplate(
    dataType: ImportDataType!
    format: ExportFormat!
  ): GetImportTemplatePayload!
}

enum ImportDataType {
  Coproperties
  Units
  Owners
  Charges
  Owners_Units
}

enum ExportDataType {
  Coproperties
  Units
  Owners
  Charges
  Invoices
  FinancialReport
  AllData
}

enum ExportFormat {
  CSV
  XLSX
  PDF
  JSON
}

type ImportResultPayload {
  success: Boolean!
  data: ImportResultData
  errorMessage: String
}

type ImportResultData {
  importId: UUID!
  fileName: String!
  recordsImported: Int!
  errorsCount: Int!
  reportUrl: String!
  importedAt: DateTime!
  dataType: String!
}

type ExportResultPayload {
  success: Boolean!
  data: ExportResultData
  errorMessage: String
}

type ExportResultData {
  exportId: UUID!
  fileName: String!
  format: String!
  fileSize: Long!
  downloadUrl: String!
  exportedAt: DateTime!
  dataTypes: [String!]!
}

type GetImportTemplatePayload {
  success: Boolean!
  fileName: String
  content: String
  errorMessage: String
}

type ImportDocument {
  id: UUID!
  fileName: String!
  dataType: String!
  copropertyId: UUID!
  uploadedBy: UUID!
  uploadedAt: DateTime!
  fileSize: Long!
  status: String!
  errorMessage: String
  reportPath: String
}

type ExportDocument {
  id: UUID!
  fileName: String!
  copropertyId: UUID!
  exportedBy: UUID!
  exportedAt: DateTime!
  format: String!
  dataTypes: String!
  fileSize: Long!
  status: String!
}
```

---

## 5. UX/UI - Design des Interfaces

### 5.1 Principes de Design

**Design System:**
- Utilisation de Material Design ou Bootstrap 5
- Palette de couleurs cohérente
- Typographie claire et lisible
- Iconographie Material Icons ou Font Awesome
- Composants réutilisables (Angular Material)

**Responsive Design:**
- Mobile-first approach
- Breakpoints: 320px, 768px, 1024px, 1440px
- Touch-friendly (minimum 44x44px pour les boutons)

**Accessibilité (WCAG 2.1 Level AA):**
- Contraste minimum 4.5:1
- Navigation au clavier
- ARIA labels
- Focus visible
- Support screen readers

### 5.2 Écrans Principaux

#### 🏠 Dashboard Syndic

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  Header (Logo, User Menu, Notifications)       │
├─────┬───────────────────────────────────────────┤
│     │  KPI Cards (4 cols)                       │
│ S   │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │
│ I   │  │ 💰   │ │ 📈   │ │ 🏠   │ │ 🔧   │    │
│ D   │  └──────┘ └──────┘ └──────┘ └──────┘    │
│ E   │                                            │
│ B   │  Charts (2 cols)                          │
│ A   │  ┌─────────────────┐ ┌─────────────────┐ │
│ R   │  │ Trésorerie      │ │ Charges         │ │
│     │  │ (Line Chart)    │ │ (Pie Chart)     │ │
│     │  └─────────────────┘ └─────────────────┘ │
│     │                                            │
│     │  Recent Activity & Quick Actions          │
└─────┴───────────────────────────────────────────┘
```

**Composants:**
- KPI Cards avec icônes et tendances
- Graphiques interactifs (Chart.js/Recharts)
- Liste des activités récentes
- Boutons d'actions rapides

**État de chargement:**
- Skeleton screens pendant le chargement
- Progress bars pour les opérations longues

#### 📋 Liste des Lots

**Features:**
- Tableau avec tri et filtrage
- Recherche full-text
- Filtres avancés (bâtiment, statut, solde)
- Actions en masse (sélection multiple)
- Export CSV/Excel

**Colonnes:**
- Numéro de lot
- Propriétaire(s)
- Surface / Tantièmes
- Solde (avec indicateur visuel)
- Statut d'occupation
- Actions (voir détails, envoyer message)

#### 💰 Gestion des Charges

**Workflow UI:**
1. Sélection de la copropriété

2. Choix du type de charge (Générale, Spéciale, Exceptionnelle, Travaux)

3. Saisie des informations de la charge:

- Libellé

 - Période concernée

Montant total

Méthode de répartition (tantièmes, surface, égalitaire, personnalisée)

Prévisualisation de la répartition par lot

Validation et génération automatique des écritures comptables

Génération des appels de fonds associés

Notification automatique aux copropriétaires

Fonctionnalités UI:

Simulateur de répartition en temps réel

Indicateurs visuels par lot (montant, pourcentage)

Historique des charges par année

Duplication d’une charge existante

Annulation / correction avec traçabilité

🏛️ Assemblées Générales (AG)

Écrans clés:

Liste des AG (passées, en cours, à venir)

Création / édition d’une AG

Gestion de l’ordre du jour

Gestion des résolutions

Interface de vote en ligne

Résultats et statistiques de vote

Fonctionnalités UI:

Drag & drop pour l’ordre du jour

Affichage du quorum en temps réel

Indicateur visuel des majorités atteintes

Génération instantanée du PV après clôture

Téléchargement et diffusion du PV

🔧 Maintenance & Interventions

Écrans clés:

Liste des signalements avec filtres (statut, priorité)

Détail d’un ticket

Planning des interventions

Gestion des prestataires

Fonctionnalités UI:

Timeline du ticket

Upload de photos avant/après intervention

Chat intégré syndic ↔ prestataire

Validation de fin d’intervention

Historique consultable par copropriétaire

📄 Gestion Documentaire (GED)

Écrans clés:

Arborescence documentaire

Vue par catégorie (Légal, Financier, Technique…)

Moteur de recherche

Fonctionnalités UI:

Drag & drop multi-fichiers

Prévisualisation PDF/images

Versioning visible

Badges “Nouveau document”

Gestion fine des droits d’accès

6. Intégrations

Stripe: Paiements CB, abonnements, webhooks

Banques (Open Banking): Synchronisation des comptes

Email: SendGrid / SMTP

SMS: Twilio

Stockage: Azure Blob / AWS S3

Signature électronique: DocuSign / Yousign

Calendrier: Google / Outlook (AG, interventions)

7. Sécurité et Conformité

Sécurité:

Authentification via Keycloak

JWT + Refresh Tokens

RBAC (Syndic, Copropriétaire, Conseil Syndical)

Chiffrement des données sensibles

Audit logs complets

Conformité:

RGPD:

Consentement explicite

Droit à l’oubli

Export des données personnelles

Archivage légal des documents

Traçabilité des votes et paiements

8. Installation et Configuration

Prérequis:

Docker & Docker Compose

PostgreSQL 15+

.NET SDK 10

Node.js 20+

Déploiement:

Environnements: Dev / Staging / Prod

CI/CD (GitHub Actions / Azure DevOps)

Migrations automatiques EF Core

Variables d’environnement sécurisées

Monitoring:

Logs centralisés

Health checks

Alertes applicatives

9. Roadmap et Extensions

Phase 1 (MVP):

Gestion copropriété

Lots & propriétaires

Charges & appels de fonds

Paiements en ligne

GED de base

Phase 2:

Vote électronique

Maintenance avancée

Reporting financier détaillé

Notifications intelligentes

Phase 3:

IA:

Prévision des charges

Détection d’anomalies comptables

Application mobile

Multi-langue

Blockchain pour votes & audits