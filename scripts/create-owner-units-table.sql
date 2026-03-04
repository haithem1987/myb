-- Migration Script: Create OwnerUnits Table for Many-to-Many Relationship
-- This script creates the OwnerUnits join table to support multiple owners per unit

-- Create OwnerUnits table
CREATE TABLE IF NOT EXISTS public."OwnerUnits" (
    "Id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "OwnerId" uuid NOT NULL,
    "UnitId" uuid NOT NULL,
    "OwnershipPercentage" numeric(5,2) NOT NULL DEFAULT 100.00,
    "StartDate" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "EndDate" timestamp with time zone,
    "IsMainOwner" boolean NOT NULL DEFAULT true,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PK_OwnerUnits" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_OwnerUnits_Owners_OwnerId" FOREIGN KEY ("OwnerId") 
        REFERENCES public."Owners"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_OwnerUnits_Units_UnitId" FOREIGN KEY ("UnitId") 
        REFERENCES public."Units"("Id") ON DELETE CASCADE,
    CONSTRAINT "CHK_OwnershipPercentage" CHECK ("OwnershipPercentage" > 0 AND "OwnershipPercentage" <= 100)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "IX_OwnerUnits_OwnerId" ON public."OwnerUnits" ("OwnerId");
CREATE INDEX IF NOT EXISTS "IX_OwnerUnits_UnitId" ON public."OwnerUnits" ("UnitId");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_OwnerUnits_Owner_Unit_StartDate" 
    ON public."OwnerUnits" ("OwnerId", "UnitId", "StartDate");

-- Migrate existing data from Owners table if UnitId column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Owners' AND column_name = 'UnitId'
    ) THEN
        -- Insert existing owner-unit relationships into OwnerUnits
        INSERT INTO public."OwnerUnits" ("Id", "OwnerId", "UnitId", "OwnershipPercentage", "StartDate", "IsMainOwner", "CreatedAt", "UpdatedAt")
        SELECT 
            gen_random_uuid(),
            "Id" as "OwnerId",
            "UnitId",
            100.00 as "OwnershipPercentage",
            COALESCE("CreatedAt", CURRENT_TIMESTAMP) as "StartDate",
            true as "IsMainOwner",
            COALESCE("CreatedAt", CURRENT_TIMESTAMP) as "CreatedAt",
            COALESCE("UpdatedAt", CURRENT_TIMESTAMP) as "UpdatedAt"
        FROM public."Owners"
        WHERE "UnitId" IS NOT NULL
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Migrated existing owner-unit relationships to OwnerUnits table';
    END IF;
END $$;

-- Add comment
COMMENT ON TABLE public."OwnerUnits" IS 'Join table for many-to-many relationship between Owners and Units, supporting co-ownership scenarios';
