# Budget Generation Script - Documentation

## Overview

The `generate-budgets.sh` script creates realistic fund call budgets (Appels de Fonds) for all coproperties in the MYB platform. It generates:

- **Quarterly maintenance budgets** - 4 per year for ongoing charges
- **Special works budgets** - One-time fund calls for renovations and repairs
- **Multi-property support** - Automatically scales based on each property's charges

## Quick Start

```bash
./scripts/generate-budgets.sh
```

**Time:** ~2 seconds  
**Output:** 19 Fund Calls totaling 636,400 TND

## What Gets Created

### By Coproperty

| Property | Fund Calls | Amount | Description |
|----------|-----------|--------|-------------|
| Résidence Les Jardins | 5 | 137,000 TND | 4 quarterly + 1 special works |
| Villa Minerve Premium | 4 | 204,000 TND | 4 quarterly (high maintenance) |
| Immeuble Carthage Elite | 6 | 193,400 TND | 4 quarterly + 2 special works |
| Complexe Résidentiel Sousse | 4 | 102,000 TND | 4 quarterly only |
| **TOTAL** | **19** | **636,400 TND** | |

### Budget Categories

#### 1. Quarterly Maintenance (Q1-Q4 2026)

**Due dates:**
- Q1: March 31, 2026
- Q2: June 30, 2026
- Q3: September 30, 2026
- Q4: December 31, 2026

**Amounts calculated from:**
- Maintenance charges (monthly × 3)
- Utilities, security, shared services
- Variable by property size and services

**Example:**
```
Résidence Les Jardins (Q1):
- Base maintenance: 8,500/month × 3 = 25,500 TND
- Description: Charges courantes - Entretien, gardiennage, électricité
```

#### 2. Special Works

Specific one-time projects:

| Property | Project | Due Date | Amount | Type |
|----------|---------|----------|--------|------|
| Résidence Les Jardins | Façade work | Jun 30 | 35,000 | Renovation |
| Immeuble Carthage Elite | Elevator replacement | Sep 30 | 65,000 | Major upgrade |
| Immeuble Carthage Elite | Roof waterproofing | Jul 31 | 18,000 | Repair |

## Database Schema (FundCalls table)

```sql
Id               UUID         -- Unique identifier
CopropertyId     UUID         -- Which property
Amount           NUMERIC      -- Total amount (TND)
DueDate          TIMESTAMP    -- Payment deadline
Description      VARCHAR      -- Budget description
IsActive         BOOLEAN      -- Is this budget active?
CreatedBy        UUID         -- Admin who created it
Status           VARCHAR      -- 'ToPay', 'Paid', 'Partial'
OwnerId          UUID         -- Optional: for specific owner only
CreatedAt        TIMESTAMP    -- Creation timestamp
UpdatedAt        TIMESTAMP    -- Last update
```

## Status Values

- **ToPay**: Budget pending payment (default)
- **Paid**: Fully paid by owners
- **Partial**: Partially paid

## Distribution Methods

Budgets are distributed among owners using property configurations:
- By unit area (most common)
- By shares (weighted ownership)
- By equal distribution

## Usage

### Generate All Budgets

```bash
./scripts/generate-budgets.sh
```

### View Budgets in Database

```bash
# By coproperty
docker exec myb-copropertyDB-1 psql -U postgres -d copropertyDB -c "
SELECT c.Name, COUNT(*) as count, SUM(Amount) as total
FROM FundCalls f
JOIN Coproperties c ON f.CopropertyId = c.Id
GROUP BY c.Name
"

# By status
docker exec myb-copropertyDB-1 psql -U postgres -d copropertyDB -c "
SELECT Status, COUNT(*) as count, SUM(Amount) as total
FROM FundCalls
GROUP BY Status
"
```

### Update Budget Status (Manual)

```bash
# Mark budget as paid
docker exec myb-copropertyDB-1 psql -U postgres -d copropertyDB -c "
UPDATE FundCalls
SET Status = 'Paid'
WHERE Id = 'f50e8400-e29b-41d4-a716-446655440001'
"
```

## Web Interface

After generation, budgets appear in the application:

1. **View Budgets:**
   - Navigate to: `Budget` → `Gestion de Budget`
   - See all fund calls by coproperty
   - Filter by status, type, date range

2. **Assign to Owners:**
   - Each fund call is automatically distributed to all owners
   - Distribution based on unit ownership percentage
   - Owners receive notifications

3. **Track Payments:**
   - Section: `Paiements Charges`
   - See payment status per owner
   - Track partial vs full payments

## Configuration

### Modify Amounts (Optional)

Edit `scripts/generate-budgets.sh` before running:

```bash
# Find the VALUES section for fund calls
# Edit amounts for different quarters
# Example:
# 25500.00 → 30000.00 (increase by 18%)
```

### Change Due Dates

Modify the YYYY-MM-DD dates in the SQL:

```bash
# Change Q1 due date from March 31 to different date
'2026-03-31 23:59:59+00' → '2026-04-15 23:59:59+00'
```

## Troubleshooting

### Error: "Cannot find copropertyDB container"

```bash
# Check container is running
docker ps | grep copropert

# Start if needed
docker compose -f docker-compose.yml up -d copropertyDB
```

### Error: "Column not found"

Database schema mismatch. Verify:

```bash
# Check FundCalls table structure
docker exec myb-copropertyDB-1 psql -U postgres -d copropertyDB -c "\d FundCalls"
```

### Budgets Not Appearing in UI

1. Refresh browser (Ctrl+Shift+R)
2. Check if user has appropriate role/permissions
3. Verify coproperty is marked as "IsActive = true"

## Integration

### With Owner Portal

- Owners see their assigned budgets
- Can track payment status
- Receive notifications when due

### With Accounting

- Export budgets for accounting system
- Track cash flow projections
- Generate reports per property

### With Charges

Budgets are calculated based on:
- Monthly charges (maintenance, utilities)
- Special works (renovations, repairs)
- Multiplied by number of months/quarters

## Best Practices

1. **Run During Setup:** Execute after real data generation
2. **Regular Updates:** Regenerate before new quarter starts
3. **Archive Old:** Archive paid/completed budgets
4. **Communicate:** Notify owners of upcoming due dates
5. **Monitor:** Track payment collection rates

## Related Scripts

- `./scripts/setup-real-data.sh` - Generate coproperties and charges
- `./scripts/generate-charges.sh` - Generate charge definitions (if available)

## Support

For issues or customization:

1. Check database directly:
   ```bash
   docker exec myb-copropertyDB-1 psql -U postgres -d copropertyDB
   SELECT * FROM FundCalls LIMIT 5;
   ```

2. Review SQL in script:
   ```bash
   grep -A 5 "INSERT INTO FundCalls" scripts/generate-budgets.sh
   ```

3. Check application logs:
   ```bash
   docker compose logs myb-coproperty | grep -i budget
   ```
