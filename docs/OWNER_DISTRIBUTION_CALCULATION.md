# 📊 Calcul de la Répartition par Propriétaire

## 📋 Table des Matières
1. [Vue d'ensemble](#vue-densemble)
2. [Architecture des données](#architecture-des-données)
3. [Cas d'usage](#cas-dusage)
4. [Formules de calcul](#formules-de-calcul)
5. [Exemples détaillés](#exemples-détaillés)
6. [Implémentation améliorée](#implémentation-améliorée)
7. [Cas particuliers](#cas-particuliers)

---

## 🎯 Vue d'ensemble

Le système doit calculer la répartition des charges **en deux niveaux** :

```
Niveau 1: UNITÉ (Lot)
    ↓
Niveau 2: PROPRIÉTAIRE(S) de cette unité
```

### Pourquoi deux niveaux ?

**Réalité juridique française :**
- Une unité (appartement) peut avoir **plusieurs propriétaires** (indivision, couples, héritiers)
- Chaque propriétaire détient un **pourcentage de propriété** de l'unité
- La facture finale doit être **divisée entre les co-propriétaires**

---

## 🏗️ Architecture des Données

### Relations entre les entités

```
┌─────────────┐         ┌──────────────┐         ┌──────────┐
│   Charge    │────────>│ChargeDistrib │<────────│   Unit   │
│ (Budget)    │         │              │         │  (Lot)   │
└─────────────┘         └──────────────┘         └────┬─────┘
                                                       │
                                                       │ 1:N
                                                       ▼
                                                ┌──────────────┐
                                                │  OwnerUnit   │
                                                │ (Liaison)    │
                                                └──────┬───────┘
                                                       │
                                                       │ N:1
                                                       ▼
                                                ┌──────────┐
                                                │  Owner   │
                                                │(Proprio) │
                                                └──────────┘
```

### Modèle OwnerUnit

```csharp
public class OwnerUnit
{
    public Guid OwnerId { get; set; }
    public Guid UnitId { get; set; }
    public decimal OwnershipPercentage { get; set; }  // 👈 CLÉ pour le calcul !
    public bool IsMainOwner { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
```

**Règle importante :** La somme des `OwnershipPercentage` pour une unité = 100%

---

## 💼 Cas d'Usage

### Cas 1 : Propriétaire Unique (Simple)
```
Unit A101 → Owner 1 (100%)
```

### Cas 2 : Deux Co-propriétaires (Couple)
```
Unit A102 → Owner 1 (50%) + Owner 2 (50%)
```

### Cas 3 : Trois Co-propriétaires (Indivision)
```
Unit B201 → Owner 1 (50%) + Owner 2 (25%) + Owner 3 (25%)
```

### Cas 4 : Propriété Temporelle (Vente en cours d'année)
```
Unit C301 → Owner 1 (100%, jusqu'au 15/06/2026)
         → Owner 2 (100%, à partir du 16/06/2026)
```

---

## 🧮 Formules de Calcul

### Étape 1 : Montant par Unité

Selon la méthode de distribution choisie :

#### A) Par Tantièmes (BY_SHARES)
```
Montant Unité = (Montant Total × Tantièmes Unité) / Total Tantièmes
```

#### B) Par Surface (BY_AREA)
```
Montant Unité = (Montant Total × Surface Unité) / Surface Totale
```

#### C) Égalitaire (EQUAL)
```
Montant Unité = Montant Total / Nombre d'Unités
```

#### D) Personnalisé (CUSTOM)
```
Montant Unité = Saisi manuellement
```

### Étape 2 : Montant par Propriétaire

Pour chaque propriétaire de l'unité :

```
Montant Propriétaire = Montant Unité × (OwnershipPercentage / 100)
```

---

## 📊 Exemples Détaillés

### Exemple Complet : Copropriété "Les Jardins"

**Configuration :**
- Budget annuel : **10 000 €**
- Méthode : **Par Tantièmes**
- Total tantièmes : **2 000**

#### Unités et Propriétaires :

| Unité | Tantièmes | Propriétaires | % Propriété |
|-------|-----------|---------------|-------------|
| A101  | 500       | Jean Dupont   | 100%        |
| A102  | 600       | Marie Martin  | 50%         |
|       |           | Paul Martin   | 50%         |
| B201  | 400       | Sophie Durand | 60%         |
|       |           | Luc Bernard   | 40%         |
| B202  | 500       | Claire Petit  | 100%        |

---

### 📐 Calcul Détaillé

#### **1. Calcul par Unité (Niveau 1)**

##### Unit A101 (500 tantièmes)
```
Montant = 10 000 € × (500 / 2 000)
        = 10 000 € × 0.25
        = 2 500 €
```

##### Unit A102 (600 tantièmes)
```
Montant = 10 000 € × (600 / 2 000)
        = 10 000 € × 0.30
        = 3 000 €
```

##### Unit B201 (400 tantièmes)
```
Montant = 10 000 € × (400 / 2 000)
        = 10 000 € × 0.20
        = 2 000 €
```

##### Unit B202 (500 tantièmes)
```
Montant = 10 000 € × (500 / 2 000)
        = 10 000 € × 0.25
        = 2 500 €
```

**Total :** 2 500 + 3 000 + 2 000 + 2 500 = **10 000 €** ✅

---

#### **2. Calcul par Propriétaire (Niveau 2)**

##### Unit A101 → Jean Dupont (100%)
```
Montant Jean = 2 500 € × (100 / 100)
             = 2 500 € × 1.00
             = 2 500 €
```

##### Unit A102 → Marie Martin (50%)
```
Montant Marie = 3 000 € × (50 / 100)
              = 3 000 € × 0.50
              = 1 500 €
```

##### Unit A102 → Paul Martin (50%)
```
Montant Paul = 3 000 € × (50 / 100)
             = 3 000 € × 0.50
             = 1 500 €
```

##### Unit B201 → Sophie Durand (60%)
```
Montant Sophie = 2 000 € × (60 / 100)
               = 2 000 € × 0.60
               = 1 200 €
```

##### Unit B201 → Luc Bernard (40%)
```
Montant Luc = 2 000 € × (40 / 100)
            = 2 000 € × 0.40
            = 800 €
```

##### Unit B202 → Claire Petit (100%)
```
Montant Claire = 2 500 € × (100 / 100)
               = 2 500 € × 1.00
               = 2 500 €
```

---

### 📋 Tableau Récapitulatif Final

| Propriétaire   | Unité | % Propriété | Montant Unité | Montant à Payer |
|----------------|-------|-------------|---------------|-----------------|
| Jean Dupont    | A101  | 100%        | 2 500 €       | **2 500 €**     |
| Marie Martin   | A102  | 50%         | 3 000 €       | **1 500 €**     |
| Paul Martin    | A102  | 50%         | 3 000 €       | **1 500 €**     |
| Sophie Durand  | B201  | 60%         | 2 000 €       | **1 200 €**     |
| Luc Bernard    | B201  | 40%         | 2 000 €       | **800 €**       |
| Claire Petit   | B202  | 100%        | 2 500 €       | **2 500 €**     |
| **TOTAL**      |       |             |               | **10 000 €** ✅  |

---

## 💻 Implémentation Améliorée

### Code C# (Backend)

```csharp
/// <summary>
/// Improved distribution calculation with owner-level splitting
/// </summary>
public async Task<IEnumerable<OwnerChargeDistribution>> DistributeChargeWithOwnersAsync(Guid chargeId)
{
    var charge = await _chargeRepository.GetById(chargeId);
    var units = await _unitRepository.GetByCopropertyIdAsync(charge.CopropertyId);
    var ownerDistributions = new List<OwnerChargeDistribution>();

    // Step 1: Calculate amount per unit
    var unitDistributions = CalculateUnitDistributions(charge, units);

    // Step 2: Split unit amount among owners
    foreach (var unitDist in unitDistributions)
    {
        using var context = _contextFactory.CreateDbContext();
        
        // Get all owners of this unit with their ownership percentages
        var ownerUnits = await context.OwnerUnits
            .Include(ou => ou.Owner)
            .Where(ou => ou.UnitId == unitDist.UnitId && 
                         (ou.EndDate == null || ou.EndDate > DateTime.UtcNow))
            .ToListAsync();

        // Validate: sum of ownership percentages should be 100%
        var totalPercentage = ownerUnits.Sum(ou => ou.OwnershipPercentage);
        if (totalPercentage != 100.00m)
        {
            throw new InvalidOperationException(
                $"Unit {unitDist.UnitNumber}: Ownership percentages sum is {totalPercentage}%, expected 100%");
        }

        // Calculate amount for each owner
        foreach (var ownerUnit in ownerUnits)
        {
            var ownerAmount = unitDist.Amount * (ownerUnit.OwnershipPercentage / 100m);

            ownerDistributions.Add(new OwnerChargeDistribution
            {
                Id = Guid.NewGuid(),
                ChargeId = chargeId,
                UnitId = unitDist.UnitId,
                UnitNumber = unitDist.UnitNumber,
                OwnerId = ownerUnit.OwnerId,
                OwnerName = $"{ownerUnit.Owner.FirstName} {ownerUnit.Owner.LastName}",
                OwnershipPercentage = ownerUnit.OwnershipPercentage,
                UnitAmount = unitDist.Amount,
                OwnerAmount = Math.Round(ownerAmount, 2),
                IsMainOwner = ownerUnit.IsMainOwner,
                CalculatedAt = DateTime.UtcNow
            });
        }
    }

    // Save to database
    foreach (var dist in ownerDistributions)
    {
        await _ownerDistributionRepository.InsertAsync(dist);
    }

    return ownerDistributions;
}

private List<UnitDistribution> CalculateUnitDistributions(Charge charge, IEnumerable<Unit> units)
{
    var distributions = new List<UnitDistribution>();

    switch (charge.DistributionMethod)
    {
        case DistributionMethod.ByShares:
            var totalShares = units.Sum(u => u.Shares);
            foreach (var unit in units)
            {
                distributions.Add(new UnitDistribution
                {
                    UnitId = unit.Id,
                    UnitNumber = unit.UnitNumber,
                    Amount = (charge.TotalAmount * unit.Shares) / totalShares,
                    CalculationBasis = $"{unit.Shares} tantièmes / {totalShares} total"
                });
            }
            break;

        case DistributionMethod.ByArea:
            var totalArea = units.Sum(u => u.Area ?? 0);
            foreach (var unit in units)
            {
                distributions.Add(new UnitDistribution
                {
                    UnitId = unit.Id,
                    UnitNumber = unit.UnitNumber,
                    Amount = (charge.TotalAmount * (unit.Area ?? 0)) / totalArea,
                    CalculationBasis = $"{unit.Area}m² / {totalArea}m² total"
                });
            }
            break;

        case DistributionMethod.Equal:
            var amountPerUnit = charge.TotalAmount / units.Count();
            foreach (var unit in units)
            {
                distributions.Add(new UnitDistribution
                {
                    UnitId = unit.Id,
                    UnitNumber = unit.UnitNumber,
                    Amount = amountPerUnit,
                    CalculationBasis = $"Equal split among {units.Count()} units"
                });
            }
            break;
    }

    return distributions;
}

/// <summary>
/// New model to store owner-level distributions
/// </summary>
public class OwnerChargeDistribution : IEntity<Guid>
{
    public Guid Id { get; set; }
    public Guid ChargeId { get; set; }
    public Guid UnitId { get; set; }
    public string UnitNumber { get; set; }
    public Guid OwnerId { get; set; }
    public string OwnerName { get; set; }
    public decimal OwnershipPercentage { get; set; }
    public decimal UnitAmount { get; set; }        // Total pour l'unité
    public decimal OwnerAmount { get; set; }       // Montant pour ce propriétaire
    public bool IsMainOwner { get; set; }
    public DateTime CalculatedAt { get; set; }
    
    // Navigation Properties
    public Charge Charge { get; set; }
    public Unit Unit { get; set; }
    public Owner Owner { get; set; }
}
```

---

### Code TypeScript/Angular (Frontend)

```typescript
export interface OwnerDistributionDetail {
  ownerId: string;
  ownerName: string;
  unitId: string;
  unitNumber: string;
  ownershipPercentage: number;
  unitAmount: number;      // Montant total de l'unité
  ownerAmount: number;     // Montant de ce propriétaire
  isMainOwner: boolean;
  email?: string;
}

export interface DistributionSummary {
  unitId: string;
  unitNumber: string;
  unitAmount: number;
  owners: OwnerDistributionDetail[];
}

// Service method
calculateOwnerDistribution(chargeId: string): Observable<DistributionSummary[]> {
  return this.apollo
    .mutate<{ distributeChargeWithOwners: DistributionSummary[] }>({
      mutation: CALCULATE_OWNER_DISTRIBUTION,
      variables: { chargeId }
    })
    .pipe(map(result => result.data!.distributeChargeWithOwners));
}
```

---

### Template HTML amélioré

```html
<div class="distribution-preview">
  <h4>Répartition détaillée par propriétaire</h4>
  
  <div *ngFor="let summary of distributionSummaries" class="unit-group">
    <!-- Unit Header -->
    <div class="unit-header">
      <h5>
        <i class="bi bi-building"></i>
        Unit {{ summary.unitNumber }}
        <span class="badge bg-primary">{{ summary.unitAmount | currency:'EUR' }}</span>
      </h5>
    </div>

    <!-- Owners breakdown -->
    <div class="table-responsive">
      <table class="table">
        <thead>
          <tr>
            <th>Propriétaire</th>
            <th>% Propriété</th>
            <th>Montant à payer</th>
            <th>Contact</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let owner of summary.owners" 
              [class.main-owner]="owner.isMainOwner">
            <td>
              <i class="bi bi-person-circle me-1"></i>
              {{ owner.ownerName }}
              <span *ngIf="owner.isMainOwner" 
                    class="badge bg-info ms-2">Principal</span>
            </td>
            <td>
              <strong>{{ owner.ownershipPercentage }}%</strong>
            </td>
            <td>
              <strong class="text-primary">
                {{ owner.ownerAmount | currency:'EUR' }}
              </strong>
            </td>
            <td>
              <a [href]="'mailto:' + owner.email">
                <i class="bi bi-envelope"></i> {{ owner.email }}
              </a>
            </td>
          </tr>
          
          <!-- Subtotal for this unit -->
          <tr class="table-active">
            <td colspan="2"><strong>Total Unit {{ summary.unitNumber }}</strong></td>
            <td colspan="2">
              <strong>{{ summary.unitAmount | currency:'EUR' }}</strong>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Grand Total -->
  <div class="grand-total mt-4">
    <h4>
      Total général : 
      <span class="text-success">{{ getGrandTotal() | currency:'EUR' }}</span>
    </h4>
  </div>
</div>
```

---

## ⚠️ Cas Particuliers

### 1. Vérification de cohérence

```csharp
// Validation 1: Sum of ownership percentages = 100%
var totalPercentage = ownerUnits.Sum(ou => ou.OwnershipPercentage);
if (Math.Abs(totalPercentage - 100m) > 0.01m)
{
    throw new ValidationException(
        $"Ownership percentages for unit {unitId} sum to {totalPercentage}%, expected 100%");
}

// Validation 2: Sum of owner amounts = unit amount
var calculatedTotal = ownerDistributions
    .Where(od => od.UnitId == unitId)
    .Sum(od => od.OwnerAmount);
    
if (Math.Abs(calculatedTotal - unitAmount) > 0.01m)
{
    // Adjust rounding error to main owner
    var mainOwner = ownerDistributions
        .First(od => od.UnitId == unitId && od.IsMainOwner);
    mainOwner.OwnerAmount += (unitAmount - calculatedTotal);
}
```

### 2. Changement de propriétaire en cours d'année

```csharp
public async Task<IEnumerable<OwnerDistribution>> DistributeForPeriod(
    Guid chargeId, 
    DateTime periodStart, 
    DateTime periodEnd)
{
    // Get owners active during this period
    var activeOwners = await context.OwnerUnits
        .Where(ou => ou.UnitId == unitId &&
                     ou.StartDate <= periodEnd &&
                     (ou.EndDate == null || ou.EndDate >= periodStart))
        .ToListAsync();

    // Calculate prorated amounts based on days of ownership
    foreach (var ownerUnit in activeOwners)
    {
        var ownerStart = ownerUnit.StartDate > periodStart 
            ? ownerUnit.StartDate : periodStart;
        var ownerEnd = ownerUnit.EndDate < periodEnd 
            ? ownerUnit.EndDate.Value : periodEnd;
        
        var daysOwned = (ownerEnd - ownerStart).Days;
        var totalDays = (periodEnd - periodStart).Days;
        
        var prorataFactor = (decimal)daysOwned / totalDays;
        var ownerAmount = unitAmount * (ownerUnit.OwnershipPercentage / 100m) * prorataFactor;
        
        // ... create distribution
    }
}
```

### 3. Propriétaire absent (logement vacant)

```csharp
// Si aucun propriétaire n'est trouvé
if (!ownerUnits.Any())
{
    // Créer une distribution "en attente" pour l'unité
    ownerDistributions.Add(new OwnerChargeDistribution
    {
        Id = Guid.NewGuid(),
        ChargeId = chargeId,
        UnitId = unitDist.UnitId,
        UnitNumber = unitDist.UnitNumber,
        OwnerId = Guid.Empty,  // Propriétaire inconnu
        OwnerName = "À ATTRIBUER",
        OwnershipPercentage = 100m,
        UnitAmount = unitDist.Amount,
        OwnerAmount = unitDist.Amount,
        IsMainOwner = true,
        Status = DistributionStatus.Pending
    });
}
```

---

## 📈 Rapports et Exports

### Génération de relevés par propriétaire

```csharp
public async Task<byte[]> GenerateOwnerStatement(Guid ownerId, int year)
{
    var distributions = await context.OwnerChargeDistributions
        .Include(d => d.Charge)
        .Include(d => d.Unit)
        .Where(d => d.OwnerId == ownerId && 
                    d.CalculatedAt.Year == year)
        .OrderBy(d => d.CalculatedAt)
        .ToListAsync();

    // Generate PDF statement with:
    // - Owner details
    // - List of all charges for the year
    // - Unit information
    // - Ownership percentage
    // - Amounts breakdown
    // - Total to pay
    
    return GeneratePdf(distributions);
}
```

---

## 🎯 Résumé

### Processus Complet

```
1. Créer le Budget
   ↓
2. Calculer la répartition par UNITÉ
   ↓
3. Pour chaque unité, diviser entre PROPRIÉTAIRES
   ↓
4. Valider que les totaux correspondent
   ↓
5. Créer les factures individuelles
   ↓
6. Envoyer aux propriétaires
```

### Points Clés

✅ **Deux niveaux obligatoires** : Unité → Propriétaire(s)  
✅ **OwnershipPercentage** est la clé du calcul  
✅ **Validation stricte** : sommes = 100% et montants cohérents  
✅ **Cas particuliers** : co-propriété, changement, absence  
✅ **Traçabilité** : chaque calcul est enregistré avec timestamp  

### Avantages

- ✅ **Conforme à la loi** française sur les copropriétés
- ✅ **Transparence totale** pour chaque propriétaire
- ✅ **Automatisation** des calculs complexes
- ✅ **Audit trail** complet
- ✅ **Flexibilité** pour tous les scénarios
