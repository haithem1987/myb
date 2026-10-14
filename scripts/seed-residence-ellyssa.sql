-- Additive, idempotent demo data for Residence Ellyssa (Jardins de Carthage).
-- Safe to run repeatedly against the current coproperty schema.

BEGIN;

INSERT INTO "Coproperties" (
  "Id", "Name", "Address", "City", "PostalCode", "Country", "Currency",
  "Description", "TotalUnits", "TotalShares", "CommonAreas", "IsActive",
  "IsDeleted", "ManagerId", "ManagerName", "CreatedAt", "UpdatedAt"
) VALUES (
  'e1100000-0000-4000-8000-000000000001',
  'Residence Ellyssa',
  'Jardins de Carthage, R7XW+WCW',
  'Tunis',
  '2046',
  'Tunisia',
  'TND',
  'Résidence tunisienne aux Jardins de Carthage avec parking, ascenseur, gardiennage et espaces verts.',
  8,
  1000,
  'Hall d''entrée, Ascenseur, Parking, Jardin commun, Terrasse commune',
  TRUE,
  FALSE,
  'c45668bc-c371-424f-80ab-a77a6666e8ae',
  'Syndic Ellyssa',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("Id") DO UPDATE SET
  "Name" = EXCLUDED."Name",
  "Address" = EXCLUDED."Address",
  "City" = EXCLUDED."City",
  "PostalCode" = EXCLUDED."PostalCode",
  "Country" = EXCLUDED."Country",
  "Currency" = EXCLUDED."Currency",
  "Description" = EXCLUDED."Description",
  "TotalUnits" = EXCLUDED."TotalUnits",
  "TotalShares" = EXCLUDED."TotalShares",
  "CommonAreas" = EXCLUDED."CommonAreas",
  "IsActive" = TRUE,
  "IsDeleted" = FALSE,
  "DeletedAt" = NULL,
  "ManagerId" = EXCLUDED."ManagerId",
  "ManagerName" = EXCLUDED."ManagerName",
  "UpdatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "Units" (
  "Id", "CopropertyId", "UnitNumber", "Floor", "Area", "Shares", "UnitType",
  "Description", "IsOccupied", "IsDeleted", "CreatedAt", "UpdatedAt"
) VALUES
  ('e1200000-0000-4000-8000-000000000001', 'e1100000-0000-4000-8000-000000000001', 'A01', 0, 110.00, 140, 'Apartment', 'Appartement S+2 avec terrasse sur jardin', TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('e1200000-0000-4000-8000-000000000002', 'e1100000-0000-4000-8000-000000000001', 'A02', 0, 92.00, 120, 'Apartment', 'Appartement S+2 au rez-de-chaussée', TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('e1200000-0000-4000-8000-000000000003', 'e1100000-0000-4000-8000-000000000001', 'B11', 1, 125.00, 160, 'Apartment', 'Appartement S+3 avec balcon', TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('e1200000-0000-4000-8000-000000000004', 'e1100000-0000-4000-8000-000000000001', 'B12', 1, 105.00, 135, 'Apartment', 'Appartement S+2, orientation sud', TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('e1200000-0000-4000-8000-000000000005', 'e1100000-0000-4000-8000-000000000001', 'C21', 2, 145.00, 185, 'Apartment', 'Appartement S+3 avec suite parentale', TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('e1200000-0000-4000-8000-000000000006', 'e1100000-0000-4000-8000-000000000001', 'C22', 2, 118.00, 155, 'Apartment', 'Appartement S+3, vue dégagée', TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('e1200000-0000-4000-8000-000000000007', 'e1100000-0000-4000-8000-000000000001', 'P01', -1, 15.00, 55, 'Parking', 'Place de parking couverte', FALSE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('e1200000-0000-4000-8000-000000000008', 'e1100000-0000-4000-8000-000000000001', 'P02', -1, 15.00, 50, 'Parking', 'Place de parking couverte', FALSE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("Id") DO UPDATE SET
  "CopropertyId" = EXCLUDED."CopropertyId",
  "UnitNumber" = EXCLUDED."UnitNumber",
  "Floor" = EXCLUDED."Floor",
  "Area" = EXCLUDED."Area",
  "Shares" = EXCLUDED."Shares",
  "UnitType" = EXCLUDED."UnitType",
  "Description" = EXCLUDED."Description",
  "IsOccupied" = EXCLUDED."IsOccupied",
  "IsDeleted" = FALSE,
  "DeletedAt" = NULL,
  "UpdatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "Owners" (
  "Id", "UserId", "FirstName", "LastName", "Email", "Phone",
  "IsDeleted", "CreatedAt", "UpdatedAt"
) VALUES
  ('e1300000-0000-4000-8000-000000000001', 'e1310000-0000-4000-8000-000000000001', 'Amira', 'Ben Salah', 'amira.bensalah@example.tn', '+216 20 145 301', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('e1300000-0000-4000-8000-000000000002', 'e1310000-0000-4000-8000-000000000002', 'Youssef', 'Trabelsi', 'youssef.trabelsi@example.tn', '+216 22 384 512', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('e1300000-0000-4000-8000-000000000003', 'e1310000-0000-4000-8000-000000000003', 'Inès', 'Gharbi', 'ines.gharbi@example.tn', '+216 25 672 148', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('e1300000-0000-4000-8000-000000000004', 'e1310000-0000-4000-8000-000000000004', 'Mehdi', 'Jlassi', 'mehdi.jlassi@example.tn', '+216 27 918 436', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('e1300000-0000-4000-8000-000000000005', 'e1310000-0000-4000-8000-000000000005', 'Sarra', 'Chaabane', 'sarra.chaabane@example.tn', '+216 29 453 780', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('e1300000-0000-4000-8000-000000000006', 'e1310000-0000-4000-8000-000000000006', 'Walid', 'Mansouri', 'walid.mansouri@example.tn', '+216 21 806 925', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("Id") DO UPDATE SET
  "FirstName" = EXCLUDED."FirstName",
  "LastName" = EXCLUDED."LastName",
  "Email" = EXCLUDED."Email",
  "Phone" = EXCLUDED."Phone",
  "IsDeleted" = FALSE,
  "DeletedAt" = NULL,
  "UpdatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "OwnerUnits" (
  "Id", "OwnerId", "UnitId", "OwnershipPercentage", "StartDate",
  "EndDate", "IsMainOwner", "CreatedAt", "UpdatedAt"
) VALUES
  ('e1400000-0000-4000-8000-000000000001', 'e1300000-0000-4000-8000-000000000001', 'e1200000-0000-4000-8000-000000000001', 100.00, DATE '2025-01-01', NULL, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('e1400000-0000-4000-8000-000000000002', 'e1300000-0000-4000-8000-000000000002', 'e1200000-0000-4000-8000-000000000002', 100.00, DATE '2025-01-01', NULL, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('e1400000-0000-4000-8000-000000000003', 'e1300000-0000-4000-8000-000000000003', 'e1200000-0000-4000-8000-000000000003', 100.00, DATE '2025-01-01', NULL, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('e1400000-0000-4000-8000-000000000004', 'e1300000-0000-4000-8000-000000000004', 'e1200000-0000-4000-8000-000000000004', 100.00, DATE '2025-01-01', NULL, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('e1400000-0000-4000-8000-000000000005', 'e1300000-0000-4000-8000-000000000005', 'e1200000-0000-4000-8000-000000000005', 100.00, DATE '2025-01-01', NULL, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('e1400000-0000-4000-8000-000000000006', 'e1300000-0000-4000-8000-000000000006', 'e1200000-0000-4000-8000-000000000006', 100.00, DATE '2025-01-01', NULL, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("Id") DO UPDATE SET
  "OwnerId" = EXCLUDED."OwnerId",
  "UnitId" = EXCLUDED."UnitId",
  "OwnershipPercentage" = EXCLUDED."OwnershipPercentage",
  "StartDate" = EXCLUDED."StartDate",
  "EndDate" = NULL,
  "IsMainOwner" = TRUE,
  "UpdatedAt" = CURRENT_TIMESTAMP;

-- In MYB, budget lines are represented by Charges and allocated through ChargeDistributions.
INSERT INTO "Charges" (
  "Id", "CopropertyId", "Name", "Description", "ChargeType", "Frequency",
  "TotalAmount", "DistributionMethod", "StartDate", "EndDate", "IsActive",
  "IsContribution", "CreatedBy", "CreatedAt", "UpdatedAt"
) VALUES
  ('e1500000-0000-4000-8000-000000000001', 'e1100000-0000-4000-8000-000000000001', 'Gardiennage et entretien', 'Gardiennage, nettoyage du hall et entretien des espaces verts', 'Maintenance', 'Annual', 24000.00, 'ByShares', TIMESTAMPTZ '2026-01-01 00:00:00+01', TIMESTAMPTZ '2026-12-31 23:59:59+01', TRUE, FALSE, 'c45668bc-c371-424f-80ab-a77a6666e8ae', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('e1500000-0000-4000-8000-000000000002', 'e1100000-0000-4000-8000-000000000001', 'Eau et électricité communes', 'Consommation des parties communes et éclairage extérieur', 'Electricity', 'Annual', 12000.00, 'ByShares', TIMESTAMPTZ '2026-01-01 00:00:00+01', TIMESTAMPTZ '2026-12-31 23:59:59+01', TRUE, FALSE, 'c45668bc-c371-424f-80ab-a77a6666e8ae', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('e1500000-0000-4000-8000-000000000003', 'e1100000-0000-4000-8000-000000000001', 'Contrat ascenseur', 'Maintenance préventive et dépannage de l''ascenseur', 'Maintenance', 'Annual', 9600.00, 'ByShares', TIMESTAMPTZ '2026-01-01 00:00:00+01', TIMESTAMPTZ '2026-12-31 23:59:59+01', TRUE, FALSE, 'c45668bc-c371-424f-80ab-a77a6666e8ae', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('e1500000-0000-4000-8000-000000000004', 'e1100000-0000-4000-8000-000000000001', 'Fonds travaux façade', 'Réfection et peinture de la façade principale', 'Other', 'Exceptional', 45000.00, 'ByShares', TIMESTAMPTZ '2026-03-01 00:00:00+01', TIMESTAMPTZ '2026-09-30 23:59:59+02', TRUE, FALSE, 'c45668bc-c371-424f-80ab-a77a6666e8ae', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("Id") DO UPDATE SET
  "Name" = EXCLUDED."Name",
  "Description" = EXCLUDED."Description",
  "ChargeType" = EXCLUDED."ChargeType",
  "Frequency" = EXCLUDED."Frequency",
  "TotalAmount" = EXCLUDED."TotalAmount",
  "DistributionMethod" = EXCLUDED."DistributionMethod",
  "StartDate" = EXCLUDED."StartDate",
  "EndDate" = EXCLUDED."EndDate",
  "IsActive" = TRUE,
  "UpdatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "ChargeDistributions" (
  "Id", "ChargeId", "UnitId", "UnitNumberSnapshot", "Amount", "Percentage",
  "CalculatedAt", "PaymentStatus", "PaidAmount", "CreatedAt", "UpdatedAt"
)
SELECT
  md5(charge."Id"::text || ':' || unit."Id"::text)::uuid,
  charge."Id",
  unit."Id",
  unit."UnitNumber",
  ROUND(charge."TotalAmount" * unit."Shares" / 1000.0, 2),
  unit."Shares" / 10.0,
  CURRENT_TIMESTAMP,
  'Unpaid',
  0.00,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Charges" AS charge
JOIN "Units" AS unit ON unit."CopropertyId" = charge."CopropertyId"
WHERE charge."CopropertyId" = 'e1100000-0000-4000-8000-000000000001'
ON CONFLICT ("ChargeId", "UnitId") DO UPDATE SET
  "UnitNumberSnapshot" = EXCLUDED."UnitNumberSnapshot",
  "Amount" = EXCLUDED."Amount",
  "Percentage" = EXCLUDED."Percentage",
  "CalculatedAt" = CURRENT_TIMESTAMP,
  "UpdatedAt" = CURRENT_TIMESTAMP;

COMMIT;

SELECT
  coproperty."Name",
  coproperty."Currency",
  COUNT(DISTINCT unit."Id") AS lots,
  COUNT(DISTINCT owner_unit."OwnerId") AS proprietaires,
  COUNT(DISTINCT charge."Id") AS lignes_budgetaires,
  COALESCE(SUM(DISTINCT charge."TotalAmount"), 0) AS budget_total
FROM "Coproperties" AS coproperty
LEFT JOIN "Units" AS unit ON unit."CopropertyId" = coproperty."Id"
LEFT JOIN "OwnerUnits" AS owner_unit ON owner_unit."UnitId" = unit."Id" AND owner_unit."EndDate" IS NULL
LEFT JOIN "Charges" AS charge ON charge."CopropertyId" = coproperty."Id" AND charge."IsActive" = TRUE
WHERE coproperty."Id" = 'e1100000-0000-4000-8000-000000000001'
GROUP BY coproperty."Name", coproperty."Currency";
