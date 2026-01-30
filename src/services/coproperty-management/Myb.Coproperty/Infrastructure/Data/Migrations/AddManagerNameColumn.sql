-- Add ManagerName column to Coproperties table
ALTER TABLE "Coproperties" 
ADD COLUMN IF NOT EXISTS "ManagerName" character varying(200);

-- Make ManagerId nullable if it isn't already
ALTER TABLE "Coproperties" 
ALTER COLUMN "ManagerId" DROP NOT NULL;
