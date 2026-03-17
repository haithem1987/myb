BEGIN;

-- 1. Add Currency to Coproperties
ALTER TABLE "Coproperties" ADD COLUMN IF NOT EXISTS "Currency" character varying(10) NOT NULL DEFAULT 'EUR';

-- 2. Create FundCalls table
CREATE TABLE IF NOT EXISTS "FundCalls" (
    "Id" uuid NOT NULL,
    "CopropertyId" uuid NOT NULL,
    "Amount" numeric(10,2) NOT NULL,
    "DueDate" timestamp with time zone NOT NULL,
    "Description" character varying(2000) NOT NULL,
    "IsActive" boolean NOT NULL DEFAULT true,
    "CreatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" uuid NOT NULL,
    "UpdatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PK_FundCalls" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_FundCalls_Coproperties_CopropertyId" FOREIGN KEY ("CopropertyId") REFERENCES "Coproperties"("Id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IX_FundCalls_CopropertyId" ON "FundCalls" ("CopropertyId");

-- 3. Add FundCalls Status + OwnerId columns
ALTER TABLE "FundCalls" ADD COLUMN IF NOT EXISTS "OwnerId" uuid;
ALTER TABLE "FundCalls" ADD COLUMN IF NOT EXISTS "Status" character varying(20) NOT NULL DEFAULT 'ToPay';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_FundCalls_Owners_OwnerId') THEN
    ALTER TABLE "FundCalls" ADD CONSTRAINT "FK_FundCalls_Owners_OwnerId" FOREIGN KEY ("OwnerId") REFERENCES "Owners"("Id") ON DELETE SET NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "IX_FundCalls_CopropertyId_DueDate_OwnerId" ON "FundCalls" ("CopropertyId", "DueDate", "OwnerId");
CREATE INDEX IF NOT EXISTS "IX_FundCalls_Status" ON "FundCalls" ("Status");
CREATE INDEX IF NOT EXISTS "IX_FundCalls_OwnerId" ON "FundCalls" ("OwnerId");

-- 4. Create FundCallPayments table
CREATE TABLE IF NOT EXISTS "FundCallPayments" (
    "Id" uuid NOT NULL,
    "FundCallId" uuid NOT NULL,
    "Amount" numeric(10,2) NOT NULL,
    "PaymentDate" timestamp with time zone NOT NULL,
    "Justificatif" character varying(1000),
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" uuid NOT NULL,
    CONSTRAINT "PK_FundCallPayments" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_FundCallPayments_FundCalls_FundCallId" FOREIGN KEY ("FundCallId") REFERENCES "FundCalls"("Id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IX_FundCallPayments_FundCallId" ON "FundCallPayments" ("FundCallId");

-- 5. Record pending migrations
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES
  ('20260116_AddFundCall', '8.0.0'),
  ('20260224_FundCallStatusOwnerPayments', '8.0.0'),
  ('20260316_MakeOwnerLegacyColumnsNullable', '8.0.0')
ON CONFLICT DO NOTHING;

COMMIT;
