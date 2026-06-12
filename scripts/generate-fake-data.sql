-- MYB Platform: Fake Data Generation Script
-- Generates realistic test data for development and testing
-- Includes: Coproperties, Owners, Units, Charges, Fund Calls, Budgets, Payments

-- ============================================
-- 1. COPROPERTIES
-- ============================================
INSERT INTO "Coproperties" ("Id", "Name", "Address", "City", "PostalCode", "Country", 
                           "TaxRegistration", "BankAccount", "Status", "CreatedAt", "UpdatedAt")
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Résidence Les Jardins', '45 Avenue Habib Bourguiba', 'Tunis', '1000', 'Tunisia', 'TN-1234567890', 'TN59-00123-456789012345678901', 'Active', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'Villa Minerve', '78 Rue de la Paix', 'Ariana', '2080', 'Tunisia', 'TN-0987654321', 'TN59-00456-789012345678901234', 'Active', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440003', 'Immeuble Carthage', '12 Boulevard El Amir', 'Carthage', '2070', 'Tunisia', 'TN-5555555555', 'TN59-00789-012345678901234567', 'Active', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440004', 'Complexe Résidentiel Sousse', '33 Avenue de la Plage', 'Sousse', '4000', 'Tunisia', 'TN-6666666666', 'TN59-00112-345678901234567890', 'Active', NOW(), NOW());

-- ============================================
-- 2. OWNERS (Keycloak Users)
-- ============================================
INSERT INTO "Owners" ("Id", "UserId", "FirstName", "LastName", "Email", "PhoneNumber", 
                      "CIN", "Status", "CreatedAt", "UpdatedAt")
VALUES 
  ('650e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', 'Haithem', 'Khalifa', 'haithem.khalifa@example.com', '+216 95 123 456', '12345678', 'Active', NOW(), NOW()),
  ('650e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440002', 'Fatima', 'Ben Ali', 'fatima.benali@example.com', '+216 94 234 567', '23456789', 'Active', NOW(), NOW()),
  ('650e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440003', 'Mohamed', 'Triki', 'mohamed.triki@example.com', '+216 93 345 678', '34567890', 'Active', NOW(), NOW()),
  ('650e8400-e29b-41d4-a716-446655440004', '750e8400-e29b-41d4-a716-446655440004', 'Amina', 'Mabrouk', 'amina.mabrouk@example.com', '+216 92 456 789', '45678901', 'Active', NOW(), NOW()),
  ('650e8400-e29b-41d4-a716-446655440005', '750e8400-e29b-41d4-a716-446655440005', 'Karim', 'Salah', 'karim.salah@example.com', '+216 91 567 890', '56789012', 'Active', NOW(), NOW()),
  ('650e8400-e29b-41d4-a716-446655440006', '750e8400-e29b-41d4-a716-446655440006', 'Leila', 'Zahra', 'leila.zahra@example.com', '+216 90 678 901', '67890123', 'Active', NOW(), NOW());

-- ============================================
-- 3. UNITS (Apartments/Lots)
-- ============================================
INSERT INTO "Units" ("Id", "CopropertyId", "UnitNumber", "UnitType", "Area", "Floor", 
                     "Status", "CreatedAt", "UpdatedAt")
VALUES 
  -- Résidence Les Jardins (12 units)
  ('850e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'B12', 'Apartment', 120.5, 1, 'Active', NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'B13', 'Apartment', 95.0, 1, 'Active', NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'C21', 'Apartment', 140.0, 2, 'Active', NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'C22', 'Apartment', 110.0, 2, 'Active', NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 'D31', 'Apartment', 135.0, 3, 'Active', NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', 'D32', 'Apartment', 100.0, 3, 'Active', NOW(), NOW()),
  
  -- Villa Minerve (8 units)
  ('850e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002', 'A01', 'Villa', 250.0, 0, 'Active', NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440002', 'A02', 'Villa', 280.0, 0, 'Active', NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440002', 'A03', 'Villa', 260.0, 0, 'Active', NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440002', 'A04', 'Villa', 245.0, 0, 'Active', NOW(), NOW()),
  
  -- Immeuble Carthage (15 units)
  ('850e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440003', 'E11', 'Apartment', 85.0, 1, 'Active', NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440003', 'E12', 'Apartment', 95.0, 1, 'Active', NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440003', 'E13', 'Apartment', 90.0, 1, 'Active', NOW(), NOW()),
  ('850e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440003', 'F21', 'Apartment', 100.0, 2, 'Active', NOW(), NOW());

-- ============================================
-- 4. OWNER-UNIT RELATIONSHIPS
-- ============================================
INSERT INTO "OwnerUnits" ("Id", "OwnerId", "UnitId", "OwnershipPercentage", "CreatedAt", "UpdatedAt")
VALUES 
  ('950e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440001', 100.0, NOW(), NOW()),
  ('950e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', '850e8400-e29b-41d4-a716-446655440002', 100.0, NOW(), NOW()),
  ('950e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440003', '850e8400-e29b-41d4-a716-446655440003', 100.0, NOW(), NOW()),
  ('950e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440004', '850e8400-e29b-41d4-a716-446655440004', 100.0, NOW(), NOW()),
  ('950e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440005', '850e8400-e29b-41d4-a716-446655440007', 100.0, NOW(), NOW()),
  ('950e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440006', '850e8400-e29b-41d4-a716-446655440011', 100.0, NOW(), NOW());

-- ============================================
-- 5. BUDGETS
-- ============================================
INSERT INTO "Budgets" ("Id", "CopropertyId", "Year", "TotalBudget", "Status", "CreatedAt", "UpdatedAt")
VALUES 
  ('a50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 2026, 125000.00, 'Approved', NOW(), NOW()),
  ('a50e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 2026, 85000.00, 'Approved', NOW(), NOW()),
  ('a50e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 2026, 180000.00, 'Approved', NOW(), NOW()),
  ('a50e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 2026, 150000.00, 'Approved', NOW(), NOW());

-- ============================================
-- 6. CHARGES (Maintenance Charges)
-- ============================================
INSERT INTO "Charges" ("Id", "CopropertyId", "Name", "Description", "Amount", "ChargeType", 
                       "Frequency", "Status", "CreatedAt", "UpdatedAt")
VALUES 
  ('b50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Charges Courantes', 'Maintenance et gardiennage', 8500.00, 'Maintenance', 'Monthly', 'Active', NOW(), NOW()),
  ('b50e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Travaux Façade 2026', 'Ravalement de façade prévu Q2 2026', 35000.00, 'Special', 'Once', 'Active', NOW(), NOW()),
  ('b50e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'Charges d''Exploitation', 'Eau, électricité, chauffage commun', 6200.00, 'Maintenance', 'Monthly', 'Active', NOW(), NOW()),
  ('b50e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'Piscine - Maintenance', 'Entretien et chloration piscine', 2800.00, 'Optional', 'Monthly', 'Active', NOW(), NOW()),
  ('b50e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', 'Charges Communes', 'Gardiennage, ascenseurs, électricité', 9200.00, 'Maintenance', 'Monthly', 'Active', NOW(), NOW()),
  ('b50e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', 'Remplacement Ascenseurs', 'Modernisation des 3 ascenseurs', 65000.00, 'Special', 'Once', 'Active', NOW(), NOW());

-- ============================================
-- 7. CHARGE DISTRIBUTIONS
-- ============================================
INSERT INTO "ChargeDistributions" ("Id", "ChargeId", "UnitId", "Amount", "PaidAmount", "PaymentStatus", 
                                  "PaidAt", "CalculatedAt", "CreatedAt", "UpdatedAt")
VALUES 
  -- Charges Courantes - Résidence Les Jardins
  ('c50e8400-e29b-41d4-a716-446655440001', 'b50e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440001', 1200.00, 1200.00, 'Paid', NOW(), NOW(), NOW(), NOW()),
  ('c50e8400-e29b-41d4-a716-446655440002', 'b50e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440002', 1000.00, 500.00, 'PartiallyPaid', NOW(), NOW(), NOW(), NOW()),
  ('c50e8400-e29b-41d4-a716-446655440003', 'b50e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440003', 1350.00, 0.00, 'Unpaid', NULL, NOW(), NOW(), NOW()),
  ('c50e8400-e29b-41d4-a716-446655440004', 'b50e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440004', 1100.00, 1100.00, 'Paid', NOW(), NOW(), NOW(), NOW()),
  
  -- Travaux Façade - Résidence Les Jardins
  ('c50e8400-e29b-41d4-a716-446655440005', 'b50e8400-e29b-41d4-a716-446655440002', '850e8400-e29b-41d4-a716-446655440001', 5200.00, 5200.00, 'Paid', NOW(), NOW(), NOW(), NOW()),
  ('c50e8400-e29b-41d4-a716-446655440006', 'b50e8400-e29b-41d4-a716-446655440002', '850e8400-e29b-41d4-a716-446655440002', 4100.00, 0.00, 'Unpaid', NULL, NOW(), NOW(), NOW()),
  ('c50e8400-e29b-41d4-a716-446655440007', 'b50e8400-e29b-41d4-a716-446655440002', '850e8400-e29b-41d4-a716-446655440003', 5800.00, 2900.00, 'PartiallyPaid', NOW(), NOW(), NOW(), NOW());

-- ============================================
-- 8. FUND CALLS (Appels de Fonds)
-- ============================================
INSERT INTO "FundCalls" ("Id", "CopropertyId", "OwnerId", "Description", "Amount", "DueDate", 
                         "Status", "CreatedAt", "UpdatedAt")
VALUES 
  ('d50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 
   'Appel de fonds - Répartition 2026 - Lot B12', 7699970.00, '2026-06-05', 'PendingValidation', NOW(), NOW()),
   
  ('d50e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440002', 
   'Appel de fonds - Répartition 2026 - Lot B13', 5200000.00, '2026-05-31', 'Paid', NOW(), NOW()),
   
  ('d50e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440003', 
   'Appel de fonds - Répartition 2026 - Lot C21', 8900500.00, '2026-06-15', 'TO_PAY', NOW(), NOW()),
   
  ('d50e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440005', 
   'Appel de fonds - Charges 2026 Q2 - Villa A01', 4500000.00, '2026-07-01', 'TO_PAY', NOW(), NOW()),
   
  ('d50e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440006', 
   'Appel de fonds - Travaux Ascenseurs 2026 - Lot E11', 12250000.00, '2026-08-15', 'TO_PAY', NOW(), NOW());

-- ============================================
-- 9. FUND CALL PAYMENTS
-- ============================================
INSERT INTO "FundCallPayments" ("Id", "FundCallId", "Amount", "PaymentDate", "PaymentMethod", 
                               "Justificatif", "ValidationStatus", "RejectionReason", 
                               "CreatedAt", "CreatedBy", "UpdatedAt")
VALUES 
  ('e50e8400-e29b-41d4-a716-446655440001', 'd50e8400-e29b-41d4-a716-446655440001', 300000.00, 
   '2026-06-01', 'Virement', 'Ref: 123456789', 'Pending', NULL, NOW(), '750e8400-e29b-41d4-a716-446655440001', NOW()),
   
  ('e50e8400-e29b-41d4-a716-446655440002', 'd50e8400-e29b-41d4-a716-446655440002', 5200000.00, 
   '2026-05-25', 'Chèque', 'Chèque N°123456', 'Approved', NULL, NOW(), '750e8400-e29b-41d4-a716-446655440002', NOW()),
   
  ('e50e8400-e29b-41d4-a716-446655440003', 'd50e8400-e29b-41d4-a716-446655440001', 400000.00, 
   '2026-06-02', 'Espèces', 'Reçu d''espèces', 'Approved', NULL, NOW(), '750e8400-e29b-41d4-a716-446655440001', NOW());

-- ============================================
-- 10. STATISTICS & VALIDATION
-- ============================================

-- Verify data integrity
SELECT 'Coproperties' as entity, COUNT(*) as count FROM "Coproperties"
UNION ALL
SELECT 'Owners', COUNT(*) FROM "Owners"
UNION ALL
SELECT 'Units', COUNT(*) FROM "Units"
UNION ALL
SELECT 'OwnerUnits', COUNT(*) FROM "OwnerUnits"
UNION ALL
SELECT 'Budgets', COUNT(*) FROM "Budgets"
UNION ALL
SELECT 'Charges', COUNT(*) FROM "Charges"
UNION ALL
SELECT 'ChargeDistributions', COUNT(*) FROM "ChargeDistributions"
UNION ALL
SELECT 'FundCalls', COUNT(*) FROM "FundCalls"
UNION ALL
SELECT 'FundCallPayments', COUNT(*) FROM "FundCallPayments";

-- Summary by Coproperty
SELECT 
  c."Name",
  COUNT(DISTINCT u."Id") as units_count,
  COUNT(DISTINCT ou."OwnerId") as owners_count,
  COUNT(DISTINCT fc."Id") as fund_calls_count,
  COALESCE(SUM(fc."Amount"), 0) as total_fund_calls
FROM "Coproperties" c
LEFT JOIN "Units" u ON c."Id" = u."CopropertyId"
LEFT JOIN "OwnerUnits" ou ON u."Id" = ou."UnitId"
LEFT JOIN "FundCalls" fc ON c."Id" = fc."CopropertyId"
GROUP BY c."Id", c."Name"
ORDER BY c."Name";
