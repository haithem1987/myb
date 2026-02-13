# 🚀 Quick Start: Owner Multi-Unit & Currency Features

## TL;DR

### What's New?
1. ✅ **Owners can own multiple lots** - Associate one owner with many units
2. ✅ **Currency selection** - Choose currency for each coproperty (EUR, USD, TND, etc.)

---

## 🔥 Usage Examples

### Frontend: Create Owner with Multiple Lots

```typescript
// In owner-management.component.ts
const input: CreateOwnerWithUnitsInput = {
  userId: 'current-user-id',
  firstName: 'Marie',
  lastName: 'Dupont',
  email: 'marie@example.com',
  phone: '+33612345678',
  units: [
    { unitId: 'unit-101', ownershipPercentage: 100, isMainOwner: true },
    { unitId: 'unit-202', ownershipPercentage: 50, isMainOwner: false }
  ]
};

// Submit via GraphQL mutation
```

### Frontend: Select Currency for Coproperty

```typescript
// In coproperty-new.component.ts
this.copropertyForm.patchValue({
  currency: Currency.EUR // or USD, TND, GBP, CHF, CAD, AED, MAD
});
```

### GraphQL: Create Owner with Units

```graphql
mutation CreateOwner {
  createOwnerWithUnits(input: {
    userId: "user-123"
    firstName: "John"
    lastName: "Doe"
    email: "john@example.com"
    phone: "+1234567890"
    units: [
      { unitId: "abc-123", ownershipPercentage: 100 }
      { unitId: "def-456", ownershipPercentage: 50 }
    ]
  }) {
    id
    firstName
    lastName
    ownerUnits {
      unit { unitNumber }
      ownershipPercentage
    }
  }
}
```

### GraphQL: Query Owner with Units

```graphql
query GetOwner {
  owner(id: "owner-123") {
    id
    firstName
    lastName
    email
    ownerUnits {
      id
      unit {
        unitNumber
        floor
      }
      ownershipPercentage
      isMainOwner
    }
  }
}
```

### GraphQL: Create Coproperty with Currency

```graphql
mutation CreateCoproperty {
  createCoproperty(coproperty: {
    name: "Residence du Lac"
    address: "15 Avenue des Fleurs"
    city: "Tunis"
    postalCode: "1002"
    country: "Tunisia"
    currency: TND
    totalUnits: 30
    totalShares: 1000
  }) {
    id
    name
    currency
  }
}
```

---

## 💾 Database Migration

### Quick Migration
```bash
cd /Volumes/NidhalSSD/Projects/myb
./scripts/migrate_owner_currency_features.sh
```

### Manual Migration
```sql
-- Run this SQL in your PostgreSQL database

-- 1. Add Currency to Coproperties
ALTER TABLE "Coproperties" 
ADD COLUMN "Currency" varchar(10) NOT NULL DEFAULT 'EUR';

-- 2. Create OwnerUnits table
CREATE TABLE "OwnerUnits" (
    "Id" uuid PRIMARY KEY,
    "OwnerId" uuid NOT NULL REFERENCES "Owners"("Id") ON DELETE CASCADE,
    "UnitId" uuid NOT NULL REFERENCES "Units"("Id") ON DELETE CASCADE,
    "OwnershipPercentage" numeric(5,2) NOT NULL DEFAULT 100.00,
    "StartDate" timestamp with time zone NOT NULL DEFAULT NOW(),
    "EndDate" timestamp with time zone,
    "IsMainOwner" boolean NOT NULL DEFAULT true,
    "CreatedAt" timestamp with time zone DEFAULT NOW(),
    "UpdatedAt" timestamp with time zone DEFAULT NOW(),
    CONSTRAINT "CHK_OwnerUnit_Ownership_Percentage" 
        CHECK ("OwnershipPercentage" > 0 AND "OwnershipPercentage" <= 100)
);

CREATE UNIQUE INDEX "IX_OwnerUnits_OwnerId_UnitId" 
    ON "OwnerUnits" ("OwnerId", "UnitId");
```

---

## 🎨 UI Components

### Owner Form - Unit Multiselect
```html
<!-- Multiselect with checkboxes -->
<div class="unit-multiselect border rounded p-2">
  <div *ngFor="let unit of availableUnits" class="form-check">
    <input 
      class="form-check-input" 
      type="checkbox" 
      [id]="'unit-' + unit.id"
      [checked]="isUnitSelected(unit.id)"
      (change)="toggleUnitSelection(unit.id)"
    />
    <label class="form-check-label" [for]="'unit-' + unit.id">
      <i class="bi bi-building"></i> {{ unit.unitNumber }}
    </label>
  </div>
</div>
```

### Coproperty Form - Currency Select
```html
<!-- Currency dropdown -->
<select class="form-select" formControlName="currency">
  <option [value]="currencyOption.value" *ngFor="let currencyOption of currencies">
    {{ currencyOption.label }}
  </option>
</select>
```

---

## 📋 Key Files

### Backend
- `Models/Currency.cs` - Currency enum
- `Models/OwnerUnit.cs` - Owner-Unit relationship
- `GraphQL/Mutations/OwnerMutations.cs` - Create/update owners with units
- `Infrastructure/Repositories/OwnerUnitRepository.cs` - Repository

### Frontend
- `models/owner.model.ts` - TypeScript interfaces
- `components/owner-management/owner-management.component.ts` - Owner form logic
- `components/coproperty-new/coproperty-new.component.ts` - Coproperty form logic

### Documentation
- `docs/COPROPERTY_OWNER_CURRENCY_FEATURES.md` - Full guide
- `docs/IMPLEMENTATION_SUMMARY.md` - Implementation summary

---

## 🔍 Troubleshooting

### Owner can't be created with multiple units
- Check that all unit IDs exist
- Verify units belong to the same coproperty
- Ensure ownership percentages are between 1-100%

### Currency not saving
- Check that currency value is from the Currency enum
- Verify database migration was run
- Ensure frontend sends currency in the payload

### Migration fails
- Check database connection
- Verify user has necessary permissions
- Run migrations one step at a time

---

## 📞 Quick Help

**Need to:**
- Create owner with 1 unit → Use `createOwnerWithUnits` with 1 unit in array
- Create owner with many units → Use `createOwnerWithUnits` with multiple units
- Change currency → Edit coproperty, select new currency from dropdown
- Query owner's units → Use `ownerUnits` field in GraphQL query
- Migrate database → Run `./scripts/migrate_owner_currency_features.sh`

---

## 🎯 Common Patterns

### Pattern 1: Owner owns 100% of multiple units
```typescript
units: [
  { unitId: 'A101', ownershipPercentage: 100, isMainOwner: true },
  { unitId: 'A102', ownershipPercentage: 100, isMainOwner: true }
]
```

### Pattern 2: Co-ownership (multiple owners, one unit)
```typescript
// Owner 1
units: [
  { unitId: 'B201', ownershipPercentage: 60, isMainOwner: true }
]

// Owner 2
units: [
  { unitId: 'B201', ownershipPercentage: 40, isMainOwner: false }
]
```

### Pattern 3: Investment owner (multiple properties)
```typescript
units: [
  { unitId: 'C301', ownershipPercentage: 100, isMainOwner: true },
  { unitId: 'C302', ownershipPercentage: 100, isMainOwner: true },
  { unitId: 'D401', ownershipPercentage: 50, isMainOwner: false }
]
```

---

**💡 Pro Tip**: The `isMainOwner` flag helps identify the primary owner when multiple people own the same unit.

---

*Last Updated: February 12, 2026*
