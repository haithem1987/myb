#!/bin/bash

# Coproperty Owner & Currency Features - Database Migration Script
# This script creates the necessary database changes for:
# 1. Multi-unit owner associations (OwnerUnits table)
# 2. Currency support for coproperties

set -e

echo "🚀 Starting Coproperty Owner & Currency Features Migration"
echo "=============================================="

# Database connection details (update these as needed)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-myb_coproperty}"
DB_USER="${DB_USER:-postgres}"

echo "Database: $DB_NAME@$DB_HOST:$DB_PORT"
echo ""

# SQL Migration Script
SQL_MIGRATION=$(cat <<'EOF'
-- ============================================
-- Migration: Add OwnerUnits table and Currency support
-- Date: 2026-02-12
-- Description: 
--   1. Create OwnerUnits table for many-to-many Owner-Unit relationship
--   2. Add Currency column to Coproperties table
--   3. Migrate existing Owner data
-- ============================================

BEGIN TRANSACTION;

-- Step 1: Add Currency column to Coproperties
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Coproperties' AND column_name = 'Currency'
    ) THEN
        ALTER TABLE "Coproperties" 
        ADD COLUMN "Currency" varchar(10) NOT NULL DEFAULT 'EUR';
        RAISE NOTICE 'Added Currency column to Coproperties table';
    ELSE
        RAISE NOTICE 'Currency column already exists in Coproperties table';
    END IF;
END $$;

-- Step 2: Create OwnerUnits table
CREATE TABLE IF NOT EXISTS "OwnerUnits" (
    "Id" uuid NOT NULL,
    "OwnerId" uuid NOT NULL,
    "UnitId" uuid NOT NULL,
    "OwnershipPercentage" numeric(5,2) NOT NULL DEFAULT 100.00,
    "StartDate" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
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

RAISE NOTICE 'Created OwnerUnits table';

-- Step 3: Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "IX_OwnerUnits_OwnerId_UnitId" 
    ON "OwnerUnits" ("OwnerId", "UnitId");

CREATE INDEX IF NOT EXISTS "IX_OwnerUnits_OwnerId" 
    ON "OwnerUnits" ("OwnerId");

CREATE INDEX IF NOT EXISTS "IX_OwnerUnits_UnitId" 
    ON "OwnerUnits" ("UnitId");

RAISE NOTICE 'Created indexes on OwnerUnits table';

-- Step 4: Migrate existing Owner-Unit relationships
-- Only migrate if UnitId column exists in Owners table
DO $$ 
DECLARE
    migrated_count INTEGER;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Owners' AND column_name = 'UnitId'
    ) THEN
        INSERT INTO "OwnerUnits" 
            ("Id", "OwnerId", "UnitId", "OwnershipPercentage", "StartDate", "IsMainOwner", "CreatedAt", "UpdatedAt")
        SELECT 
            gen_random_uuid(),
            o."Id",
            o."UnitId",
            COALESCE(o."OwnershipPercentage", 100.00),
            COALESCE(o."StartDate", o."CreatedAt", CURRENT_TIMESTAMP),
            COALESCE(o."IsMainOwner", true),
            COALESCE(o."CreatedAt", CURRENT_TIMESTAMP),
            COALESCE(o."UpdatedAt", CURRENT_TIMESTAMP)
        FROM "Owners" o
        WHERE o."UnitId" IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM "OwnerUnits" ou 
            WHERE ou."OwnerId" = o."Id" AND ou."UnitId" = o."UnitId"
        );
        
        GET DIAGNOSTICS migrated_count = ROW_COUNT;
        RAISE NOTICE 'Migrated % existing Owner-Unit relationships', migrated_count;
    ELSE
        RAISE NOTICE 'UnitId column does not exist in Owners table - skipping migration';
    END IF;
END $$;

-- Step 5: Update Owner table structure
-- Remove old columns (optional - can be done later for backward compatibility)
-- Uncomment these lines when ready to remove deprecated columns:
/*
ALTER TABLE "Owners" DROP COLUMN IF EXISTS "UnitId";
ALTER TABLE "Owners" DROP COLUMN IF EXISTS "OwnershipPercentage";
ALTER TABLE "Owners" DROP COLUMN IF EXISTS "StartDate";
ALTER TABLE "Owners" DROP COLUMN IF EXISTS "EndDate";
ALTER TABLE "Owners" DROP COLUMN IF EXISTS "IsMainOwner";
RAISE NOTICE 'Removed deprecated columns from Owners table';
*/

COMMIT;

RAISE NOTICE '✅ Migration completed successfully!';
EOF
)

# Execute migration
echo "📝 Executing migration SQL..."
echo ""

# Option 1: Using psql (uncomment if you have psql installed)
# echo "$SQL_MIGRATION" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"

# Option 2: Save to file for manual execution
MIGRATION_FILE="migration_owner_currency_$(date +%Y%m%d_%H%M%S).sql"
echo "$SQL_MIGRATION" > "$MIGRATION_FILE"

echo "✅ Migration SQL saved to: $MIGRATION_FILE"
echo ""
echo "To execute the migration, run:"
echo "  psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $MIGRATION_FILE"
echo ""
echo "OR execute the SQL directly in your database management tool."
echo ""

# Verification queries
echo "📊 After migration, you can verify with these queries:"
echo ""
echo "-- Check OwnerUnits table"
echo "SELECT COUNT(*) FROM \"OwnerUnits\";"
echo ""
echo "-- Check Currency column"
echo "SELECT \"Id\", \"Name\", \"Currency\" FROM \"Coproperties\" LIMIT 5;"
echo ""
echo "-- Check Owner-Unit associations"
echo "SELECT o.\"FirstName\", o.\"LastName\", u.\"UnitNumber\", ou.\"OwnershipPercentage\""
echo "FROM \"Owners\" o"
echo "JOIN \"OwnerUnits\" ou ON o.\"Id\" = ou.\"OwnerId\""
echo "JOIN \"Units\" u ON ou.\"UnitId\" = u.\"Id\""
echo "LIMIT 10;"

echo ""
echo "🎉 Migration script preparation complete!"
