-- Fix Owners table by making obsolete columns nullable
-- These columns are now stored in OwnerUnits table

-- Make obsolete columns nullable
ALTER TABLE public."Owners" ALTER COLUMN "UnitId" DROP NOT NULL;
ALTER TABLE public."Owners" ALTER COLUMN "StartDate" DROP NOT NULL;
ALTER TABLE public."Owners" ALTER COLUMN "IsMainOwner" DROP NOT NULL;
ALTER TABLE public."Owners" ALTER COLUMN "OwnershipPercentage" DROP NOT NULL;

-- Set default values for backward compatibility
ALTER TABLE public."Owners" ALTER COLUMN "StartDate" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public."Owners" ALTER COLUMN "IsMainOwner" SET DEFAULT true;
ALTER TABLE public."Owners" ALTER COLUMN "OwnershipPercentage" SET DEFAULT 100.0;

-- Add comments
COMMENT ON COLUMN public."Owners"."UnitId" IS 'Deprecated: Use OwnerUnits table instead';
COMMENT ON COLUMN public."Owners"."StartDate" IS 'Deprecated: Use OwnerUnits.StartDate instead';
COMMENT ON COLUMN public."Owners"."IsMainOwner" IS 'Deprecated: Use OwnerUnits.IsMainOwner instead';
COMMENT ON COLUMN public."Owners"."OwnershipPercentage" IS 'Deprecated: Use OwnerUnits.OwnershipPercentage instead';

SELECT 'Owners table constraints fixed successfully!' as status;
