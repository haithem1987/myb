-- Insert test owners with their units
-- This creates sample data to test the owner management functionality

-- Insert test owners (with obsolete columns set to defaults for backward compatibility)
INSERT INTO public."Owners" ("Id", "UserId", "FirstName", "LastName", "Email", "Phone", "OwnershipPercentage", "StartDate", "IsMainOwner", "CreatedAt", "UpdatedAt")
VALUES 
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Jean', 'Dupont', 'jean.dupont@example.com', '+33612345678', 100.00, CURRENT_TIMESTAMP, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000002', 'Marie', 'Martin', 'marie.martin@example.com', '+33612345679', 100.00, CURRENT_TIMESTAMP, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000003', 'Pierre', 'Bernard', 'pierre.bernard@example.com', '+33612345680', 100.00, CURRENT_TIMESTAMP, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000004', 'Sophie', 'Dubois', 'sophie.dubois@example.com', '+33612345681', 100.00, CURRENT_TIMESTAMP, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("Id") DO NOTHING;

-- Associate owners with units from the existing units
-- Jean Dupont owns 100% of unit A23
INSERT INTO public."OwnerUnits" ("Id", "OwnerId", "UnitId", "OwnershipPercentage", "StartDate", "IsMainOwner", "CreatedAt", "UpdatedAt")
SELECT 
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111',
    "Id",
    100.00,
    CURRENT_TIMESTAMP,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM public."Units"
WHERE "UnitNumber" = 'A23'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Marie Martin and Pierre Bernard co-own unit B13 (60% and 40%)
INSERT INTO public."OwnerUnits" ("Id", "OwnerId", "UnitId", "OwnershipPercentage", "StartDate", "IsMainOwner", "CreatedAt", "UpdatedAt")
SELECT 
    gen_random_uuid(),
    '22222222-2222-2222-2222-222222222222',
    "Id",
    60.00,
    CURRENT_TIMESTAMP,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM public."Units"
WHERE "UnitNumber" = 'B13'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public."OwnerUnits" ("Id", "OwnerId", "UnitId", "OwnershipPercentage", "StartDate", "IsMainOwner", "CreatedAt", "UpdatedAt")
SELECT 
    gen_random_uuid(),
    '33333333-3333-3333-3333-333333333333',
    "Id",
    40.00,
    CURRENT_TIMESTAMP,
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM public."Units"
WHERE "UnitNumber" = 'B13'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Sophie Dubois has no units yet (new owner)

SELECT 'Test data inserted successfully!' as status;

-- Display the created test data
SELECT 
    o."FirstName" || ' ' || o."LastName" as "Owner",
    o."Email",
    COALESCE(u."UnitNumber", 'No unit') as "UnitNumber",
    COALESCE(ou."OwnershipPercentage"::text, 'N/A') as "Ownership%"
FROM public."Owners" o
LEFT JOIN public."OwnerUnits" ou ON o."Id" = ou."OwnerId"
LEFT JOIN public."Units" u ON ou."UnitId" = u."Id"
ORDER BY o."LastName", o."FirstName";
