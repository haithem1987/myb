# Git Workflow - Module Copropriété

## Guide de création de branche et développement

### Étape 1: Préparer l'environnement

- current updated branch is `feature/upgrade-angular21-client-app`
- merge with develop and create new branch 
```bash
# Se placer sur la branche develop
cd /path/to/myb
git checkout develop

# Mettre à jour develop avec les dernières modifications
git pull origin-haithem develop

# Vérifier l'état du repository
git status
```

### Étape 2: Créer la branche feature

```bash
# Créer et basculer sur la nouvelle branche
git checkout -b feature/coproperty-management

# Vérifier qu'on est bien sur la nouvelle branche
git branch
# Output attendu: * feature/coproperty-management

# Pousser la branche vers le remote
git push -u origin-haithem feature/coproperty-management
```

### Étape 3: Structure du travail

#### 3.1 Créer les fichiers de documentation

```bash
# Créer le fichier de documentation principal
touch COPROPERTY_MODULE.md

# Ajouter le contenu de la documentation (copier depuis l'artifact)
# Utiliser votre éditeur préféré: vim, nano, VS Code, etc.
code COPROPERTY_MODULE.md
```

#### 3.2 Mettre à jour README.md

```bash
# Éditer le README
code README.md

# Ajouter la section "5. Coproperty Management Service"
# (voir le contenu dans l'artifact "README Update")
```

#### 3.3 Créer la structure backend

```bash
# Créer le dossier du service
mkdir -p src/services/coproperty-management/Myb.Coproperty

# Naviguer vers le dossier
cd src/services/coproperty-management

# Créer le projet ASP.NET Core
dotnet new webapi -n Myb.Coproperty
cd Myb.Coproperty

# Créer les dossiers nécessaires
mkdir Controllers Services Models GraphQL Infrastructure
mkdir GraphQL/Queries GraphQL/Mutations GraphQL/Types
mkdir Infrastructure/Data Infrastructure/Repositories

# Retourner à la racine
cd ../../../..
```

#### 3.4 Créer la structure frontend

```bash
# Créer le module Angular
cd src/front/myb.front

# Utiliser Nx pour générer le module
nx generate @nx/angular:library coproperty-module

# Créer les composants
cd libs/coproperty-module/src/lib
mkdir components services models

# Créer les dossiers de composants
mkdir components/coproperty-list
mkdir components/coproperty-detail
mkdir components/unit-management
mkdir components/charge-management
mkdir components/payment-tracking
mkdir components/maintenance-requests

# Retourner à la racine
cd ../../../../../..
```

### Étape 4: Premier commit - Structure

```bash
# Ajouter les fichiers de documentation
git add COPROPERTY_MODULE.md
git add README.md

# Ajouter la structure créée
git add src/services/coproperty-management/
git add src/front/myb.front/libs/coproperty-module/

# Créer le commit
git commit -m "feat: add coproperty module structure and documentation

- Add comprehensive technical documentation (COPROPERTY_MODULE.md)
- Update README.md with coproperty service section
- Create backend service structure (ASP.NET Core)
- Create frontend module structure (Angular/Nx)
- Setup database schema design"

# Pousser vers le remote
git push origin-haithem feature/coproperty-management
```

### Étape 5: Développement itératif

#### 5.1 Backend - Modèles et DbContext

```bash
# Créer les fichiers de modèles
# (Implémenter les classes C# basées sur le schéma de la doc)

git add src/services/coproperty-management/Myb.Coproperty/Models/
git commit -m "feat(coproperty): add domain models

- Add Coproperty, Unit, Owner models
- Add Charge, ChargeDistribution models
- Add CopropertyInvoice, Payment models
- Add MaintenanceRequest model
- Configure entity relationships"

git push origin-haithem feature/coproperty-management
```

#### 5.2 Backend - DbContext et Migrations

```bash
# Créer le DbContext et les configurations

git add src/services/coproperty-management/Myb.Coproperty/Infrastructure/
git commit -m "feat(coproperty): add database context and configurations

- Create CopropertyDbContext
- Add entity configurations (Fluent API)
- Configure relationships and constraints
- Add database connection settings"

# Créer la migration initiale
cd src/services/coproperty-management/Myb.Coproperty
dotnet ef migrations add InitialCreate
cd ../../../..

git add src/services/coproperty-management/Myb.Coproperty/Migrations/
git commit -m "feat(coproperty): add initial database migration"

git push origin-haithem feature/coproperty-management
```

#### 5.3 Backend - Services

```bash
# Implémenter les services métier

git add src/services/coproperty-management/Myb.Coproperty/Services/
git commit -m "feat(coproperty): add business logic services

- Add CopropertyService (CRUD operations)
- Add ChargeService (distribution algorithms)
- Add InvoiceService (invoice generation)
- Add MaintenanceService (workflow management)
- Implement charge distribution by shares/area/equal"

git push origin-haithem feature/coproperty-management
```

#### 5.4 Backend - GraphQL

```bash
# Ajouter les types, queries et mutations GraphQL

git add src/services/coproperty-management/Myb.Coproperty/GraphQL/
git commit -m "feat(coproperty): add GraphQL API

- Add GraphQL types for all entities
- Implement queries (list, get by ID, filters)
- Implement mutations (create, update, delete)
- Add charge distribution mutation
- Add invoice generation mutation
- Configure HotChocolate middleware"

git push origin-haithem feature/coproperty-management
```

#### 5.5 Backend - Controllers REST (optionnel)

```bash
git add src/services/coproperty-management/Myb.Coproperty/Controllers/
git commit -m "feat(coproperty): add REST API controllers

- Add CopropertiesController
- Add UnitsController
- Add ChargesController
- Add MaintenanceController
- Configure API routes and authentication"

git push origin-haithem feature/coproperty-management
```

#### 5.6 Docker Configuration

```bash
# Créer le Dockerfile
cat > src/services/coproperty-management/Dockerfile << 'EOF'
FROM mcr.microsoft.com/dotnet/aspnet:7.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:7.0 AS build
WORKDIR /src
COPY ["Myb.Coproperty/Myb.Coproperty.csproj", "Myb.Coproperty/"]
RUN dotnet restore "Myb.Coproperty/Myb.Coproperty.csproj"
COPY . .
WORKDIR "/src/Myb.Coproperty"
RUN dotnet build "Myb.Coproperty.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Myb.Coproperty.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Myb.Coproperty.dll"]
EOF

# Mettre à jour docker-compose.yml
# (Ajouter les services coproperty-service et copropertyDB)

git add src/services/coproperty-management/Dockerfile
git add docker-compose.yml
git commit -m "feat(coproperty): add Docker configuration

- Add Dockerfile for coproperty service
- Update docker-compose.yml with coproperty service
- Add copropertyDB PostgreSQL container
- Configure service dependencies and networking"

git push origin-haithem feature/coproperty-management
```

#### 5.7 Frontend - Services

```bash
# Créer les services Angular

git add src/front/myb.front/libs/coproperty-module/src/lib/services/
git commit -m "feat(coproperty): add frontend services

- Add CopropertyService (GraphQL queries/mutations)
- Add ChargeService (charge management)
- Add MaintenanceService (maintenance requests)
- Add PaymentService (payment integration)
- Configure Apollo Client integration"

git push origin-haithem feature/coproperty-management
```

#### 5.8 Frontend - Composants

```bash
# Créer les composants un par un

# Liste des copropriétés
git add src/front/myb.front/libs/coproperty-module/src/lib/components/coproperty-list/
git commit -m "feat(coproperty): add coproperty list component"

# Détail d'une copropriété
git add src/front/myb.front/libs/coproperty-module/src/lib/components/coproperty-detail/
git commit -m "feat(coproperty): add coproperty detail component"

# Gestion des lots
git add src/front/myb.front/libs/coproperty-module/src/lib/components/unit-management/
git commit -m "feat(coproperty): add unit management component"

# Gestion des charges
git add src/front/myb.front/libs/coproperty-module/src/lib/components/charge-management/
git commit -m "feat(coproperty): add charge management component"

# Suivi des paiements
git add src/front/myb.front/libs/coproperty-module/src/lib/components/payment-tracking/
git commit -m "feat(coproperty): add payment tracking component"

# Demandes de maintenance
git add src/front/myb.front/libs/coproperty-module/src/lib/components/maintenance-requests/
git commit -m "feat(coproperty): add maintenance request component"

git push origin-haithem feature/coproperty-management
```

### Étape 6: Tests

```bash
# Ajouter les tests unitaires backend
git add src/tests/unit-tests/Myb.Coproperty.Tests/
git commit -m "test(coproperty): add backend unit tests

- Add service tests (CopropertyService, ChargeService)
- Add repository tests
- Add charge distribution algorithm tests
- Configure test database"

# Ajouter les tests frontend
git add src/front/myb.front/libs/coproperty-module/src/lib/**/*.spec.ts
git commit -m "test(coproperty): add frontend unit tests

- Add component tests
- Add service tests
- Add integration tests with Apollo"

git push origin-haithem feature/coproperty-management
```

### Étape 7: Intégrations

```bash
# Intégration avec les autres services
git add src/services/coproperty-management/Myb.Coproperty/Integrations/
git commit -m "feat(coproperty): add service integrations

- Integrate with Invoice Service
- Integrate with Payment Service (Stripe)
- Integrate with Notification Service
- Integrate with Document Service
- Add authentication via User Manager/Keycloak"

git push origin-haithem feature/coproperty-management
```

### Étape 8: Documentation finale

```bash
# Mettre à jour tous les fichiers de documentation
git add COPROPERTY_MODULE.md README.md
git commit -m "docs(coproperty): finalize documentation

- Complete API documentation
- Add usage examples
- Update integration guides
- Add troubleshooting section"

git push origin-haithem feature/coproperty-management
```

### Étape 9: Pull Request

```bash
# Vérifier que tout est à jour
git status

# Récupérer les dernières modifications de develop
git fetch origin-haithem develop
git rebase origin-haithem/develop

# Résoudre les conflits si nécessaire
# git add <fichiers-résolus>
# git rebase --continue

# Pousser les modifications
git push origin-haithem feature/coproperty-management --force-with-lease
```

#### Créer la Pull Request sur GitHub/GitLab

**Titre:**
```
feat: Add Coproperty Management Module
```

**Description:**
```markdown
## 📋 Description
Ajout d'un nouveau module complet de gestion de copropriété incluant:
- Gestion des copropriétés et lots
- Suivi des copropriétaires
- Calcul et répartition des charges
- Facturation et paiements
- Gestion de la maintenance

## ✨ Fonctionnalités principales
- ✅ CRUD complet des copropriétés
- ✅ Gestion des lots avec tantièmes
- ✅ Algorithmes de distribution des charges (par tantièmes, surface, égal)
- ✅ Génération automatique de factures
- ✅ Intégration Stripe pour les paiements
- ✅ Workflow de maintenance
- ✅ Notifications automatiques

## 🏗️ Architecture
- Backend: ASP.NET Core + PostgreSQL + GraphQL
- Frontend: Angular 17 + Nx + Apollo Client
- Intégrations: Invoice, Payment, Notification, Document services

## 📊 Base de données
- 8 nouvelles tables
- Relations complètes
- Migrations incluses

## 🧪 Tests
- [x] Tests unitaires backend
- [x] Tests unitaires frontend
- [x] Tests d'intégration
- [ ] Tests E2E (à venir)

## 📚 Documentation
- [x] Documentation technique complète (COPROPERTY_MODULE.md)
- [x] Mise à jour README.md
- [x] Commentaires dans le code
- [x] Exemples d'utilisation GraphQL

## 🔗 Services intégrés
- User Manager (authentification)
- Invoice Service (génération factures)
- Payment Service (Stripe)
- Notification Service (alertes)
- Document Service (contrats, PV)

## ✅ Checklist
- [x] Code backend implémenté
- [x] Code frontend implémenté
- [x] Base de données configurée
- [x] Docker configuration
- [x] Tests ajoutés
- [x] Documentation complète
- [x] Aucun conflit avec develop

## 📦 Breaking Changes
Aucun - module complètement indépendant

## 🚀 Déploiement
```bash
# Démarrer tous les services
docker-compose up -d

# Vérifier le service coproperty
curl http://localhost:5008/graphql
```

Closes #XXX (si issue existe)
```

### Étape 10: Après merge

```bash
# Revenir sur develop
git checkout develop

# Mettre à jour develop
git pull origin-haithem develop

# Supprimer la branche locale
git branch -d feature/coproperty-management

# Supprimer la branche remote (optionnel)
git push origin-haithem --delete feature/coproperty-management

# Créer un tag de version
git tag -a v1.1.0 -m "Release v1.1.0 - Coproperty Management Module"
git push origin-haithem v1.1.0
```

---

## Conventions de commit

Suivre la convention **Conventional Commits** pour tous les commits:

### Types de commits

```
feat:     Nouvelle fonctionnalité
fix:      Correction de bug
docs:     Documentation uniquement
style:    Formatage (espaces, virgules, etc.)
refactor: Refactorisation du code
test:     Ajout de tests
chore:    Maintenance (mise à jour dépendances, etc.)
perf:     Amélioration des performances
ci:       Configuration CI/CD
build:    Système de build (webpack, docker, etc.)
```

### Format

```
<type>(<scope>): <description courte>

<description longue optionnelle>

<footer optionnel>
```

### Exemples

```bash
# Feature
git commit -m "feat(coproperty): add charge distribution algorithm"

# Fix
git commit -m "fix(coproperty): correct calculation for area-based charges"

# Documentation
git commit -m "docs(coproperty): add API usage examples"

# Tests
git commit -m "test(coproperty): add unit tests for ChargeService"

# Avec description longue
git commit -m "feat(coproperty): implement maintenance workflow

- Add maintenance request creation
- Add technician assignment
- Add status tracking
- Add cost tracking

Closes #123"
```

---

## Bonnes pratiques

### 1. Commits atomiques
- Un commit = une modification logique
- Ne pas mélanger plusieurs fonctionnalités
- Facilite le revert si nécessaire

### 2. Messages descriptifs
- Utiliser l'impératif ("add" pas "added")
- Être précis et concis
- Expliquer le "pourquoi" dans la description longue

### 3. Synchronisation régulière
```bash
# Récupérer develop régulièrement
git fetch origin-haithem develop
git rebase origin-haithem/develop

# Pousser souvent
git push origin-haithem feature/coproperty-management
```

### 4. Revue de code avant push
```bash
# Vérifier les modifications
git diff

# Vérifier les fichiers ajoutés
git status

# Vérifier l'historique
git log --oneline -5
```

### 5. Ne jamais commit
- ❌ Secrets/API keys
- ❌ Fichiers de configuration locale
- ❌ node_modules/
- ❌ bin/, obj/
- ❌ .env files avec credentials

---

## Résolution de problèmes

### Conflit lors du rebase

```bash
# Voir les conflits
git status

# Éditer les fichiers en conflit
# Chercher les marqueurs <<<<<<< ======= >>>>>>>

# Marquer comme résolu
git add <fichier-résolu>

# Continuer le rebase
git rebase --continue

# Ou annuler
git rebase --abort
```

### Modifier le dernier commit

```bash
# Modifier le message
git commit --amend -m "nouveau message"

# Ajouter des fichiers oubliés
git add fichier-oublié.ts
git commit --amend --no-edit
```

### Annuler des modifications

```bash
# Annuler modifications non commitées
git checkout -- fichier.ts

# Annuler dernier commit (garde les modifications)
git reset --soft HEAD~1

# Annuler dernier commit (perd les modifications)
git reset --hard HEAD~1
```

---

## Checklist finale avant PR

- [ ] Tous les tests passent
- [ ] Code formaté correctement
- [ ] Documentation à jour
- [ ] Aucun warning de compilation
- [ ] Docker build réussit
- [ ] Pas de secrets dans le code
- [ ] Commits bien organisés et nommés
- [ ] Branch à jour avec develop
- [ ] README.md mis à jour si nécessaire