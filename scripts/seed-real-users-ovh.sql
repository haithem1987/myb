-- ============================================================
-- MYB Platform: Real Data for OVH Production Database
-- Users: khalifa.haithem@gmail.com & nidhal.bnmaad@gmail.com
-- Keycloak IDs confirmed from MYB realm
-- ============================================================

BEGIN;

-- ============================================================
-- STEP 1: CLEAN UP ALL EXISTING DATA (in safe order)
-- ============================================================
DELETE FROM "FundCallPayments";
DELETE FROM "CopropertyInvoices";
DELETE FROM "FundCalls";
DELETE FROM "ChargeDistributions";
DELETE FROM "OwnerUnits";
DELETE FROM "Owners";
DELETE FROM "Charges";
DELETE FROM "Assemblies";
DELETE FROM "MaintenanceRequests";
DELETE FROM "Interventions";
DELETE FROM "Units";
DELETE FROM "Coproperties";

-- ============================================================
-- STEP 2: COPROPERTY - Résidence Les Jardins, Tunis
-- Manager = Nidhal Ben MAAD (syndic)
-- ============================================================
INSERT INTO "Coproperties" (
  "Id", "Name", "Address", "City", "PostalCode", "Country",
  "Description", "TotalUnits", "TotalShares", "CommonAreas",
  "IsActive", "ManagerId", "ManagerName", "Currency", "CreatedAt", "UpdatedAt"
) VALUES (
  '91db3442-4845-4fe4-b00b-f4960a73f498',
  'Résidence Les Jardins',
  '45 Avenue Habib Bourguiba',
  'Tunis',
  '1000',
  'Tunisia',
  'Résidence haut standing en plein cœur de Tunis avec espaces verts, ascenseur et sécurité 24h/24',
  2,
  200,
  'Hall d''entrée, Ascenseur, Parking souterrain, Jardin commun, Local poubelles',
  true,
  '7a7b80bd-ff01-4838-a9b4-e523711a3c08',
  'Nidhal Ben MAAD',
  'TND',
  NOW(),
  NOW()
);

-- ============================================================
-- STEP 3: UNITS - One per owner
-- ============================================================

-- Lot B12 → Haithem (Apartment, Floor 1, 120m2)
INSERT INTO "Units" (
  "Id", "CopropertyId", "UnitNumber", "Floor", "Area", "Shares",
  "UnitType", "Description", "IsOccupied", "OccupancyStatus", "CreatedAt", "UpdatedAt"
) VALUES (
  'a1234567-abcd-abcd-abcd-a12345678901',
  '91db3442-4845-4fe4-b00b-f4960a73f498',
  'B12',
  1,
  120.00,
  100,
  'Apartment',
  'Appartement T3, 120m², Étage 1, vue sur jardin, balcon, parking inclus',
  true,
  'Occupied',
  NOW(),
  NOW()
);

-- Lot A23 → Nidhal (Apartment, Floor 2, 150m2)
INSERT INTO "Units" (
  "Id", "CopropertyId", "UnitNumber", "Floor", "Area", "Shares",
  "UnitType", "Description", "IsOccupied", "OccupancyStatus", "CreatedAt", "UpdatedAt"
) VALUES (
  'b1234567-abcd-abcd-abcd-b12345678901',
  '91db3442-4845-4fe4-b00b-f4960a73f498',
  'A23',
  2,
  150.00,
  100,
  'Apartment',
  'Appartement T4, 150m², Étage 2, vue panoramique, double séjour, 2 balcons',
  true,
  'Occupied',
  NOW(),
  NOW()
);

-- ============================================================
-- STEP 4: OWNERS - Real Keycloak User IDs
-- ============================================================

-- Haithem Khalifa: Keycloak ID 8fb9dae2-cc27-41d4-96d1-2812870e8851
INSERT INTO "Owners" (
  "Id", "UserId", "UnitId", "OwnershipPercentage", "StartDate",
  "IsMainOwner", "Email", "FirstName", "LastName", "Phone", "CreatedAt", "UpdatedAt"
) VALUES (
  'c1234567-abcd-abcd-abcd-c12345678901',
  '8fb9dae2-cc27-41d4-96d1-2812870e8851',
  'a1234567-abcd-abcd-abcd-a12345678901',
  100.00,
  NOW(),
  true,
  'khalifa.haithem@gmail.com',
  'Haithem',
  'Khalifa',
  '+216 98 123 456',
  NOW(),
  NOW()
);

-- Nidhal Ben MAAD: Keycloak ID 7a7b80bd-ff01-4838-a9b4-e523711a3c08
INSERT INTO "Owners" (
  "Id", "UserId", "UnitId", "OwnershipPercentage", "StartDate",
  "IsMainOwner", "Email", "FirstName", "LastName", "Phone", "CreatedAt", "UpdatedAt"
) VALUES (
  'd1234567-abcd-abcd-abcd-d12345678901',
  '7a7b80bd-ff01-4838-a9b4-e523711a3c08',
  'b1234567-abcd-abcd-abcd-b12345678901',
  100.00,
  NOW(),
  true,
  'nidhal.bnmaad@gmail.com',
  'Nidhal',
  'Ben MAAD',
  '+216 97 456 789',
  NOW(),
  NOW()
);

-- ============================================================
-- STEP 5: OWNER UNITS - Link owners to their units
-- ============================================================

INSERT INTO "OwnerUnits" (
  "Id", "OwnerId", "UnitId", "OwnershipPercentage",
  "StartDate", "IsMainOwner", "CreatedAt", "UpdatedAt"
) VALUES (
  'e1234567-abcd-abcd-abcd-e12345678901',
  'c1234567-abcd-abcd-abcd-c12345678901',
  'a1234567-abcd-abcd-abcd-a12345678901',
  100.00,
  NOW(),
  true,
  NOW(),
  NOW()
);

INSERT INTO "OwnerUnits" (
  "Id", "OwnerId", "UnitId", "OwnershipPercentage",
  "StartDate", "IsMainOwner", "CreatedAt", "UpdatedAt"
) VALUES (
  'f1234567-abcd-abcd-abcd-f12345678901',
  'd1234567-abcd-abcd-abcd-d12345678901',
  'b1234567-abcd-abcd-abcd-b12345678901',
  100.00,
  NOW(),
  true,
  NOW(),
  NOW()
);

-- ============================================================
-- STEP 6: CHARGES
-- ============================================================

-- Monthly maintenance charge
INSERT INTO "Charges" (
  "Id", "CopropertyId", "Name", "Description", "ChargeType", "Frequency",
  "TotalAmount", "DistributionMethod", "StartDate", "IsActive",
  "CreatedBy", "IsContribution", "CreatedAt", "UpdatedAt"
) VALUES (
  'a9234567-abcd-abcd-abcd-a12345678901',
  '91db3442-4845-4fe4-b00b-f4960a73f498',
  'Maintenance générale',
  'Charges mensuelles de maintenance des parties communes, espaces verts, ascenseur et sécurité',
  'Maintenance',
  'Monthly',
  8500.00,
  'ByShares',
  NOW(),
  true,
  '7a7b80bd-ff01-4838-a9b4-e523711a3c08',
  false,
  NOW(),
  NOW()
);

-- One-time facade renovation charge
INSERT INTO "Charges" (
  "Id", "CopropertyId", "Name", "Description", "ChargeType", "Frequency",
  "TotalAmount", "DistributionMethod", "StartDate", "IsActive",
  "CreatedBy", "IsContribution", "CreatedAt", "UpdatedAt"
) VALUES (
  'b9234567-abcd-abcd-abcd-b12345678901',
  '91db3442-4845-4fe4-b00b-f4960a73f498',
  'Travaux façade 2026',
  'Rénovation complète de la façade et isolation thermique - travaux été 2026',
  'SpecialWork',
  'OneTime',
  45000.00,
  'ByShares',
  NOW(),
  true,
  '7a7b80bd-ff01-4838-a9b4-e523711a3c08',
  false,
  NOW(),
  NOW()
);

-- ============================================================
-- STEP 7: CHARGE DISTRIBUTIONS (50/50 split per unit)
-- ============================================================

-- Maintenance → Haithem B12 (50%)
INSERT INTO "ChargeDistributions" (
  "Id", "ChargeId", "UnitId", "Amount", "CalculatedAt", "Percentage",
  "PaymentStatus", "PaidAmount", "CreatedAt", "UpdatedAt"
) VALUES (
  'c9234567-abcd-abcd-abcd-c12345678901',
  'a9234567-abcd-abcd-abcd-a12345678901',
  'a1234567-abcd-abcd-abcd-a12345678901',
  4250.00, NOW(), 50.00, 'Unpaid', 0.00, NOW(), NOW()
);

-- Maintenance → Nidhal A23 (50%)
INSERT INTO "ChargeDistributions" (
  "Id", "ChargeId", "UnitId", "Amount", "CalculatedAt", "Percentage",
  "PaymentStatus", "PaidAmount", "CreatedAt", "UpdatedAt"
) VALUES (
  'd9234567-abcd-abcd-abcd-d12345678901',
  'a9234567-abcd-abcd-abcd-a12345678901',
  'b1234567-abcd-abcd-abcd-b12345678901',
  4250.00, NOW(), 50.00, 'Unpaid', 0.00, NOW(), NOW()
);

-- Facade works → Haithem B12 (50%)
INSERT INTO "ChargeDistributions" (
  "Id", "ChargeId", "UnitId", "Amount", "CalculatedAt", "Percentage",
  "PaymentStatus", "PaidAmount", "CreatedAt", "UpdatedAt"
) VALUES (
  'e9234567-abcd-abcd-abcd-e12345678901',
  'b9234567-abcd-abcd-abcd-b12345678901',
  'a1234567-abcd-abcd-abcd-a12345678901',
  22500.00, NOW(), 50.00, 'Unpaid', 0.00, NOW(), NOW()
);

-- Facade works → Nidhal A23 (50%)
INSERT INTO "ChargeDistributions" (
  "Id", "ChargeId", "UnitId", "Amount", "CalculatedAt", "Percentage",
  "PaymentStatus", "PaidAmount", "CreatedAt", "UpdatedAt"
) VALUES (
  'f9234567-abcd-abcd-abcd-f12345678901',
  'b9234567-abcd-abcd-abcd-b12345678901',
  'b1234567-abcd-abcd-abcd-b12345678901',
  22500.00, NOW(), 50.00, 'Unpaid', 0.00, NOW(), NOW()
);

-- ============================================================
-- STEP 8: FUND CALLS - Appels de Fonds (one per owner per charge)
-- ============================================================

-- Haithem - Maintenance Juin 2026 (due in 30 days)
INSERT INTO "FundCalls" (
  "Id", "CopropertyId", "Amount", "DueDate", "Description",
  "IsActive", "CreatedBy", "OwnerId", "Status", "CreatedAt", "UpdatedAt"
) VALUES (
  'a0234567-abcd-abcd-abcd-a12345678901',
  '91db3442-4845-4fe4-b00b-f4960a73f498',
  4250.00,
  NOW() + INTERVAL '30 days',
  'Appel de fonds - Maintenance mensuelle Juin 2026 - Lot B12',
  true,
  '7a7b80bd-ff01-4838-a9b4-e523711a3c08',
  'c1234567-abcd-abcd-abcd-c12345678901',
  'ToPay',
  NOW(),
  NOW()
);

-- Nidhal - Maintenance Juin 2026 (due in 30 days)
INSERT INTO "FundCalls" (
  "Id", "CopropertyId", "Amount", "DueDate", "Description",
  "IsActive", "CreatedBy", "OwnerId", "Status", "CreatedAt", "UpdatedAt"
) VALUES (
  'b0234567-abcd-abcd-abcd-b12345678901',
  '91db3442-4845-4fe4-b00b-f4960a73f498',
  4250.00,
  NOW() + INTERVAL '30 days',
  'Appel de fonds - Maintenance mensuelle Juin 2026 - Lot A23',
  true,
  '7a7b80bd-ff01-4838-a9b4-e523711a3c08',
  'd1234567-abcd-abcd-abcd-d12345678901',
  'ToPay',
  NOW(),
  NOW()
);

-- Haithem - Travaux façade (due in 60 days)
INSERT INTO "FundCalls" (
  "Id", "CopropertyId", "Amount", "DueDate", "Description",
  "IsActive", "CreatedBy", "OwnerId", "Status", "CreatedAt", "UpdatedAt"
) VALUES (
  'c0234567-abcd-abcd-abcd-c12345678901',
  '91db3442-4845-4fe4-b00b-f4960a73f498',
  22500.00,
  NOW() + INTERVAL '60 days',
  'Appel de fonds - Travaux façade 2026 - Lot B12',
  true,
  '7a7b80bd-ff01-4838-a9b4-e523711a3c08',
  'c1234567-abcd-abcd-abcd-c12345678901',
  'ToPay',
  NOW(),
  NOW()
);

-- Nidhal - Travaux façade (due in 60 days)
INSERT INTO "FundCalls" (
  "Id", "CopropertyId", "Amount", "DueDate", "Description",
  "IsActive", "CreatedBy", "OwnerId", "Status", "CreatedAt", "UpdatedAt"
) VALUES (
  'd0234567-abcd-abcd-abcd-d12345678901',
  '91db3442-4845-4fe4-b00b-f4960a73f498',
  22500.00,
  NOW() + INTERVAL '60 days',
  'Appel de fonds - Travaux façade 2026 - Lot A23',
  true,
  '7a7b80bd-ff01-4838-a9b4-e523711a3c08',
  'd1234567-abcd-abcd-abcd-d12345678901',
  'ToPay',
  NOW(),
  NOW()
);

COMMIT;

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT 'Coproperty' as entity, "Id"::text, "Name", "City" FROM "Coproperties";
SELECT 'Unit' as entity, "Id"::text, "UnitNumber", "UnitType", "Shares"::text FROM "Units";
SELECT 'Owner' as entity, "Id"::text, "Email", "FirstName" || ' ' || "LastName" as name FROM "Owners";
SELECT 'FundCall' as entity, "Id"::text, "Description", "Amount"::text, "Status" FROM "FundCalls" ORDER BY "OwnerId", "DueDate";
SELECT '--- DONE ---' as result, COUNT(*)::text as fund_calls FROM "FundCalls";
