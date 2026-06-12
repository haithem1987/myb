# MYB Platform - Fake Data Generation Guide

This guide explains how to generate realistic test data for development and testing.

## Quick Start

### Option 1: Using Docker Compose (Recommended)

If your database is running via Docker Compose:

```bash
# Make sure PostgreSQL container is running
docker-compose up -d postgresql

# Generate fake data
./scripts/generate-fake-data.sh
```

### Option 2: Direct PostgreSQL Connection

```bash
# Set database credentials and run
export PGHOST=localhost
export PGPORT=5432
export PGUSER=postgres
export PGPASSWORD=yourpassword
export PGDATABASE=myb

./scripts/generate-fake-data.sh
```

### Option 3: Using Connection String

```bash
export DATABASE_CONNECTION="Host=localhost;Port=5432;Username=postgres;Password=yourpassword;Database=myb"
./scripts/generate-fake-data.sh
```

### Option 4: Direct psql Command

```bash
psql -h localhost -p 5432 -U postgres -d myb -f scripts/generate-fake-data.sql
```

## Generated Data Overview

### Coproperties (4)
- **Résidence Les Jardins** - Tunis (12 units)
- **Villa Minerve** - Ariana (4 villas)
- **Immeuble Carthage** - Carthage (15 units)
- **Complexe Résidentiel Sousse** - Sousse (TBD)

### Owners (6)
Realistic Tunisian names with contact info:
- Haithem Khalifa
- Fatima Ben Ali
- Mohamed Triki
- Amina Mabrouk
- Karim Salah
- Leila Zahra

### Units (14+)
Mix of apartments and villas across all properties:
- B12, B13, C21, C22 (Résidence Les Jardins)
- A01, A02, A03, A04 (Villa Minerve)
- E11, E12, E13, F21 (Immeuble Carthage)

### Financial Data
- **Total Fund Calls**: ~38.5M DT
- **Fund Call Statuses**:
  - TO_PAY: Awaiting payment
  - PendingValidation: Awaiting syndic validation
  - Paid: Completed
- **Charge Types**: Maintenance, Special Works, Optional
- **Payment Methods**: Virement, Chèque, Espèces, Mandat Postal

### Charge Distributions Status
- Some marked as Paid (100%)
- Some PartiallyPaid (partial payment received)
- Some Unpaid (no payment yet)

## Data Structure

```
Coproperty
├── Units
│   └── OwnerUnits (ownership relationships)
├── Charges
│   └── ChargeDistributions (per-unit breakdown)
├── Budget
├── FundCalls
│   └── FundCallPayments (owner submissions)
└── CopropertyInvoices (receipts)
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PGHOST | localhost | Database host |
| PGPORT | 5432 | Database port |
| PGUSER | postgres | Database user |
| PGPASSWORD | (none) | Database password |
| PGDATABASE | myb | Database name |
| DATABASE_CONNECTION | (none) | Full connection string (overrides individual vars) |

## Resetting Data

To start fresh, drop and recreate the tables:

```bash
# Drop existing data (use with caution!)
dropdb -h localhost -U postgres myb

# Recreate database
createdb -h localhost -U postgres myb

# Run migrations (application-dependent)
# Then generate fresh fake data
./scripts/generate-fake-data.sh
```

## Customizing Data

To modify the generated data, edit `scripts/generate-fake-data.sql`:

1. **Change owner data**: Modify the `Owners` INSERT statement
2. **Add more units**: Duplicate unit entries with new UUIDs
3. **Adjust fund call amounts**: Update the `Amount` field in FundCalls
4. **Change dates**: Modify `DueDate`, `PaymentDate` values

### Generating new UUIDs

Use PostgreSQL's UUID generator:
```sql
SELECT gen_random_uuid();
```

Or in bash:
```bash
uuidgen  # macOS/Linux
```

## Testing Scenarios

### Scenario 1: Complete Payment Flow
1. Fund call with status TO_PAY
2. Owner submits payment justification with PDF
3. Payment marked as PENDING_VALIDATION
4. Syndic approves payment
5. Fund call status changes to PAID

**Test account**: Lot B13 (Fatima Ben Ali) - Already has paid fund call

### Scenario 2: Partial Payment
1. Fund call with large amount (8.9M DT)
2. Owner makes partial payment (500K DT)
3. Fund call remains TO_PAY with reduced balance
4. Additional payments can be made

**Test account**: Lot C21 (Mohamed Triki)

### Scenario 3: Multiple Charges
1. Property has multiple charges (Maintenance + Special Works)
2. Each distributed across units by ownership
3. Owner sees aggregated balance

**Test account**: Résidence Les Jardins (all owners)

## Verification Queries

Check data was inserted correctly:

```sql
-- Count all entities
SELECT 'Coproperties' as entity, COUNT(*) FROM "Coproperties"
UNION ALL SELECT 'Owners', COUNT(*) FROM "Owners"
UNION ALL SELECT 'Units', COUNT(*) FROM "Units"
UNION ALL SELECT 'FundCalls', COUNT(*) FROM "FundCalls";

-- Total fund calls by status
SELECT "Status", COUNT(*) as count, SUM("Amount") as total
FROM "FundCalls"
GROUP BY "Status";

-- Owner fund call balances
SELECT 
  CONCAT(o."FirstName", ' ', o."LastName") as owner,
  u."UnitNumber" as unit,
  SUM(fc."Amount") as total_amount,
  COALESCE(SUM(fcp."Amount"), 0) as paid,
  SUM(fc."Amount") - COALESCE(SUM(fcp."Amount"), 0) as remaining
FROM "Owners" o
JOIN "OwnerUnits" ou ON o."Id" = ou."OwnerId"
JOIN "Units" u ON ou."UnitId" = u."Id"
LEFT JOIN "FundCalls" fc ON o."Id" = fc."OwnerId"
LEFT JOIN "FundCallPayments" fcp ON fc."Id" = fcp."FundCallId"
GROUP BY o."Id", o."FirstName", o."LastName", u."UnitNumber"
ORDER BY o."FirstName";
```

## Troubleshooting

### Connection Refused
```
Error: could not connect to server
```
**Solution**: Ensure PostgreSQL is running and accessible
```bash
# Check if running
docker ps | grep postgres

# Or start it
docker-compose up -d postgresql
```

### Permission Denied
```
Error: permission denied for schema public
```
**Solution**: Ensure user has proper permissions
```bash
psql -U postgres -d myb -c "GRANT ALL ON SCHEMA public TO postgres;"
```

### Table Already Exists
```
Error: relation "Coproperties" already exists
```
**Solution**: Data is already generated. To regenerate, update UUIDs in the SQL or manually delete old records.

### psql Command Not Found
```
command not found: psql
```
**Solution**: Install PostgreSQL client tools
```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# Or use Docker
docker run -it --rm -v $PWD:/sql postgres:15 psql ...
```

## Notes

- All timestamps use `NOW()` (current time)
- All monetary amounts in Tunisian Dinars (DT)
- User IDs are example UUIDs (not linked to actual Keycloak users)
- Fund call amounts are realistic based on Tunisian real estate values
- Phone numbers follow Tunisian format (+216)
- CIN numbers are placeholder values

## Next Steps

After generating fake data:

1. **Test the frontend**: Login as an owner and view fund calls
2. **Test payments**: Submit payment justification with PDF
3. **Test syndic admin**: Review and approve payments
4. **Load testing**: Generate more data by running the script multiple times with different UUIDs
5. **Performance testing**: Test queries with large datasets

## Support

For issues or improvements to the data generation script:
1. Check existing test data structures
2. Verify database schema matches expected columns
3. Review application Entity Framework models
4. Adjust SQL as needed for your specific schema

---

**Last Updated**: 2026-06-04
**Database**: PostgreSQL 13+
**ORM**: Entity Framework Core .NET
