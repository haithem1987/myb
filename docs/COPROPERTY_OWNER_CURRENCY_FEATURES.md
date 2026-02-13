# Coproperty Owner & Currency Features - Implementation Guide

## Overview

This document describes the implementation of two major features:
1. **Multi-Unit Owner Association**: Allow coproperty owners to be associated with multiple lots (units)
2. **Currency Selection**: Add currency support to coproperty management

## Feature 1: Multi-Unit Owner Association

### Backend Changes

#### 1. New Models

**Currency Enum** (`Models/Currency.cs`):
- Supported currencies: USD, EUR, TND, GBP, CHF, CAD, AED, MAD

**OwnerUnit Model** (`Models/OwnerUnit.cs`):
- Many-to-many relationship between Owner and Unit
- Properties:
  - `OwnerId`: Reference to the owner
  - `UnitId`: Reference to the unit
  - `OwnershipPercentage`: Percentage of ownership (0-100%)
  - `StartDate`: When ownership started
  - `EndDate`: When ownership ended (nullable)
  - `IsMainOwner`: Whether this is the main owner

#### 2. Updated Models

**Owner Model** (`Models/Owner.cs`):
- Removed single `UnitId` property (marked as obsolete)
- Added `OwnerUnits` collection for many-to-many relationship
- Now stores:
  - `FirstName`, `LastName`, `Email`, `Phone`
  - Collection of `OwnerUnit` associations

**Coproperty Model** (`Models/Coproperty.cs`):
- Added `Currency` property (enum)
- Default value: EUR

**Unit Model** (`Models/Unit.cs`):
- Updated to use `OwnerUnits` collection instead of direct `Owners`

#### 3. Database Configuration

**DbContext Updates** (`Infrastructure/Data/CopropertyDbContext.cs`):
- Added `OwnerUnits` DbSet
- Configured OwnerUnit entity with:
  - Composite unique index on (OwnerId, UnitId)
  - Foreign key relationships
  - Check constraint for ownership percentage
- Added Currency enum conversion for Coproperty

#### 4. GraphQL Types

**New Types**:
- `CurrencyType`: Enum type for currency selection
- `OwnerUnitType`: Object type for owner-unit associations
- `OwnerUnitInputType`: Input type for creating owner-unit associations
- `CreateOwnerWithUnitsInput`: Input for creating owners with multiple units

**Updated Types**:
- `CopropertyType`: Added currency field
- `CopropertyInputType`: Added currency field with EUR default
- `OwnerType`: Updated to return `ownerUnits` collection with backward compatibility

#### 5. GraphQL Mutations

**OwnerMutations** (`GraphQL/Mutations/OwnerMutations.cs`):
- `CreateOwnerWithUnits`: Create an owner with multiple unit associations
- `UpdateOwnerWithUnits`: Update an owner and their unit associations
- `AddOwner`: Deprecated - maintained for backward compatibility
- `RemoveOwner`: Delete an owner and all their unit associations

#### 6. Repository Layer

**New Repository**:
- `IOwnerUnitRepository` and `OwnerUnitRepository`
- Methods:
  - `GetByOwnerIdAsync`: Get all units for an owner
  - `GetByUnitIdAsync`: Get all owners for a unit

**Registered Services** (`Program.cs`):
- Added OwnerUnit repository
- Registered all new GraphQL types

### Frontend Changes

#### 1. Updated Models

**Owner Model** (`models/owner.model.ts`):
```typescript
export interface OwnerUnit {
  id: string;
  ownerId: string;
  unitId: string;
  ownershipPercentage: number;
  startDate: Date;
  endDate?: Date;
  isMainOwner: boolean;
}

export interface Owner {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  ownerUnits?: OwnerUnit[];
}

export interface CreateOwnerWithUnitsInput {
  id?: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  units: OwnerUnitInput[];
}
```

**Coproperty Model** (`models/coproperty.model.ts`):
```typescript
export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  TND = 'TND',
  GBP = 'GBP',
  CHF = 'CHF',
  CAD = 'CAD',
  AED = 'AED',
  MAD = 'MAD'
}

export interface Coproperty {
  // ... existing properties
  currency: Currency;
}
```

#### 2. Updated Components

**Owner Management Component** (`components/owner-management/owner-management.component.ts`):
- Added multiselect for units using checkboxes
- Form control: `selectedUnits` (string array)
- Methods:
  - `toggleUnitSelection(unitId)`: Toggle unit selection
  - `isUnitSelected(unitId)`: Check if unit is selected
  - `getOwnerUnits(owner)`: Display owner's units as badges

**Owner Management Template** (`owner-management.component.html`):
- Added unit multiselect section with Bootstrap checkboxes
- Displays selected units as badges with Bootstrap icons
- Shows ownership percentage if not 100%

**Coproperty New Component** (`components/coproperty-new/coproperty-new.component.ts`):
- Added currency dropdown
- Available currencies with icons:
  - USD (bi-currency-dollar)
  - EUR (bi-currency-euro)
  - TND, GBP, CHF, CAD, AED, MAD (bi-cash)
- Default: EUR

**Coproperty New Template** (`coproperty-new.component.html`):
- Added currency select field after country
- Bootstrap icon: `bi-currency-exchange`
- Includes help text

#### 3. Translation Keys

**English** (`i18n/en.json`):
```json
{
  "coproperty": {
    "form": {
      "currencyLabel": "Currency",
      "currencyHelp": "Select the currency for this coproperty"
    },
    "owner": {
      "units": "Owned Lots"
    }
  }
}
```

**French** (`i18n/fr.json`):
```json
{
  "coproperty": {
    "form": {
      "currencyLabel": "Devise",
      "currencyHelp": "Sélectionnez la devise pour cette copropriété"
    },
    "owner": {
      "units": "Lots Possédés"
    }
  }
}
```

## Usage Examples

### GraphQL: Create Owner with Multiple Units

```graphql
mutation CreateOwnerWithUnits {
  createOwnerWithUnits(
    input: {
      userId: "user-123"
      firstName: "John"
      lastName: "Doe"
      email: "john.doe@example.com"
      phone: "+33612345678"
      units: [
        {
          unitId: "unit-1"
          ownershipPercentage: 100
          isMainOwner: true
        }
        {
          unitId: "unit-2"
          ownershipPercentage: 50
          isMainOwner: false
        }
      ]
    }
  ) {
    id
    firstName
    lastName
    ownerUnits {
      id
      unit {
        unitNumber
      }
      ownershipPercentage
    }
  }
}
```

### GraphQL: Create Coproperty with Currency

```graphql
mutation CreateCoproperty {
  createCoproperty(
    coproperty: {
      name: "Garden Residences"
      address: "123 Main St"
      city: "Paris"
      postalCode: "75001"
      country: "France"
      currency: EUR
      totalUnits: 50
      totalShares: 1000
    }
  ) {
    id
    name
    currency
  }
}
```

## Database Migration

A database migration will be required to:
1. Create the `OwnerUnits` table
2. Add `Currency` column to `Coproperties` table
3. Migrate existing Owner data to OwnerUnit records (if applicable)
4. Remove deprecated `UnitId` from Owner table (optional - for cleanup)

### Migration Script Example

```sql
-- Create OwnerUnits table
CREATE TABLE "OwnerUnits" (
    "Id" uuid NOT NULL,
    "OwnerId" uuid NOT NULL,
    "UnitId" uuid NOT NULL,
    "OwnershipPercentage" numeric(5,2) NOT NULL DEFAULT 100.00,
    "StartDate" timestamp with time zone NOT NULL,
    "EndDate" timestamp with time zone,
    "IsMainOwner" boolean NOT NULL DEFAULT true,
    "CreatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PK_OwnerUnits" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_OwnerUnits_Owners" FOREIGN KEY ("OwnerId") 
        REFERENCES "Owners"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_OwnerUnits_Units" FOREIGN KEY ("UnitId") 
        REFERENCES "Units"("Id") ON DELETE CASCADE,
    CONSTRAINT "CHK_OwnerUnit_Ownership_Percentage" 
        CHECK ("OwnershipPercentage" > 0 AND "OwnershipPercentage" <= 100)
);

CREATE UNIQUE INDEX "IX_OwnerUnits_OwnerId_UnitId" 
    ON "OwnerUnits" ("OwnerId", "UnitId");

-- Add Currency column to Coproperties
ALTER TABLE "Coproperties" 
    ADD COLUMN "Currency" varchar(10) NOT NULL DEFAULT 'EUR';

-- Migrate existing Owner-Unit relationships
INSERT INTO "OwnerUnits" ("Id", "OwnerId", "UnitId", "OwnershipPercentage", "StartDate", "IsMainOwner")
SELECT 
    gen_random_uuid(),
    o."Id",
    o."UnitId",
    o."OwnershipPercentage",
    o."StartDate",
    o."IsMainOwner"
FROM "Owners" o
WHERE o."UnitId" IS NOT NULL;
```

## Testing Checklist

### Backend
- [ ] Create owner with single unit
- [ ] Create owner with multiple units
- [ ] Update owner units
- [ ] Delete owner (cascades to OwnerUnits)
- [ ] Query owners with ownerUnits
- [ ] Create coproperty with currency
- [ ] Update coproperty currency

### Frontend
- [ ] Display owner form with unit multiselect
- [ ] Select multiple units for owner
- [ ] Submit owner form with units
- [ ] Display owner's units as badges
- [ ] Filter available units by coproperty
- [ ] Create coproperty with currency dropdown
- [ ] Edit coproperty currency
- [ ] Display currency in coproperty details

## Best Practices

1. **Backward Compatibility**: Old `unitId` and `unit` fields are deprecated but still accessible
2. **Default Values**: Currency defaults to EUR, ownership percentage to 100%
3. **Validation**: Ownership percentage must be between 1-100%
4. **UX**: Use Bootstrap icons throughout (bi-building, bi-currency-exchange)
5. **Translation**: All user-facing text is translatable

## Future Enhancements

1. Add ownership percentage input in UI (currently defaults to 100%)
2. Add start/end date selectors for ownership periods
3. Show ownership history for units
4. Currency conversion features
5. Multi-currency reporting
6. Ownership transfer workflow

## References

- [Owner Model](../src/services/coproperty-management/Myb.Coproperty/Models/Owner.cs)
- [Coproperty Model](../src/services/coproperty-management/Myb.Coproperty/Models/Coproperty.cs)
- [OwnerUnit Model](../src/services/coproperty-management/Myb.Coproperty/Models/OwnerUnit.cs)
- [Currency Enum](../src/services/coproperty-management/Myb.Coproperty/Models/Currency.cs)
- [Owner Mutations](../src/services/coproperty-management/Myb.Coproperty/GraphQL/Mutations/OwnerMutations.cs)
