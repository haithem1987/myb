using Microsoft.EntityFrameworkCore;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Infrastructure.Repositories;
using Myb.Coproperty.Models;
using Myb.Coproperty.Models.Dtos;

namespace Myb.Coproperty.Services;

/// <summary>
/// Service for financial operations including invoice generation, payment tracking, and treasury management
/// </summary>
public class FinanceService : IFinanceService
{
    private readonly IDbContextFactory<CopropertyDbContext> _contextFactory;
    private readonly IChargeRepository _chargeRepository;
    private readonly ICopropertyRepository _copropertyRepository;
    private readonly IUnitRepository _unitRepository;
    private readonly IOwnerRepository _ownerRepository;

    public FinanceService(
        IDbContextFactory<CopropertyDbContext> contextFactory,
        IChargeRepository chargeRepository,
        ICopropertyRepository copropertyRepository,
        IUnitRepository unitRepository,
        IOwnerRepository ownerRepository)
    {
        _contextFactory = contextFactory;
        _chargeRepository = chargeRepository;
        _copropertyRepository = copropertyRepository;
        _unitRepository = unitRepository;
        _ownerRepository = ownerRepository;
    }

    /// <summary>
    /// Get treasury evolution data for the past N months
    /// </summary>
    public async Task<List<TreasuryDataPoint>> GetTreasuryEvolutionAsync(Guid copropertyId, int months = 12)
    {
        using var context = _contextFactory.CreateDbContext();
        
        var dataPoints = new List<TreasuryDataPoint>();
        var currentDate = DateTime.UtcNow;
        
        // Get first day of current month
        var startDate = new DateTime(currentDate.Year, currentDate.Month, 1)
            .AddMonths(-months + 1);

        // Get payments grouped by month
        var payments = await context.Payments
            .Include(p => p.Invoice)
            .Where(p => p.PaymentDate >= startDate)
            .ToListAsync();

        // Calculate monthly amounts
        for (int i = 0; i < months; i++)
        {
            var monthDate = startDate.AddMonths(i);
            var monthStart = new DateTime(monthDate.Year, monthDate.Month, 1);
            var monthEnd = monthStart.AddMonths(1).AddDays(-1);

            var monthlyAmount = payments
                .Where(p => p.PaymentDate >= monthStart && p.PaymentDate <= monthEnd)
                .Sum(p => p.Amount);

            var monthName = monthDate.ToString("MMMM yyyy");
            dataPoints.Add(new TreasuryDataPoint
            {
                Month = monthName,
                Date = monthDate,
                Amount = monthlyAmount
            });
        }

        return dataPoints;
    }

    /// <summary>
    /// Generate invoices from a charge for all units with charge distribution
    /// </summary>
    public async Task<List<CopropertyInvoice>> GenerateInvoicesFromChargeAsync(Guid chargeId, string createdBy)
    {
        using var context = _contextFactory.CreateDbContext();
        
        var charge = await context.Charges
            .Include(c => c.Coproperty)
            .Include(c => c.Distributions)
                .ThenInclude(d => d.Unit)
                    .ThenInclude(u => u.OwnerUnits)
                        .ThenInclude(ou => ou.Owner)
            .FirstOrDefaultAsync(c => c.Id == chargeId);

        if (charge == null)
            throw new InvalidOperationException($"Charge with ID {chargeId} not found");

        var invoices = new List<CopropertyInvoice>();

        // Get all charge distributions for this charge
        var distributions = charge.Distributions.ToList();

        foreach (var distribution in distributions)
        {
            var unit = distribution.Unit;
            var owner = unit.OwnerUnits
                .Where(link => link.EndDate == null)
                .OrderByDescending(link => link.IsMainOwner)
                .Select(link => link.Owner)
                .FirstOrDefault();

            // An invoice must always have a real owner. An unassigned unit can
            // receive its invoice after an owner is assigned.
            if (owner == null)
                continue;

            // Calculate invoice amount based on distribution
            var invoiceAmount = distribution.Percentage > 0 
                ? (charge.TotalAmount * distribution.Percentage) / 100 
                : charge.TotalAmount / distributions.Count;

            // Create invoice
            var invoice = new CopropertyInvoice
            {
                Id = Guid.NewGuid(),
                InvoiceNumber = $"INV-{charge.CopropertyId:N}-{chargeId:N}-{distribution.UnitId:N}".Substring(0, 50),
                CopropertyId = charge.CopropertyId,
                ChargeId = chargeId,
                UnitId = distribution.UnitId,
                OwnerId = owner.Id,
                Amount = invoiceAmount,
                TaxAmount = 0, // Calculate based on tax settings
                TotalAmount = invoiceAmount,
                InvoiceDate = DateTime.UtcNow,
                DueDate = DateTime.UtcNow.AddDays(30),
                Status = InvoiceStatus.Pending,
                CreatedBy = Guid.TryParse(createdBy, out var userGuid) ? userGuid : Guid.Empty,
                Description = charge.Description,
                OwnerNameSnapshot = $"{owner.FirstName} {owner.LastName}".Trim(),
                CopropertyNameSnapshot = charge.Coproperty.Name,
                UnitNumberSnapshot = unit.UnitNumber,
                CurrencySnapshot = charge.Coproperty.Currency,
                CreatedAt = DateTime.UtcNow
            };

            context.CopropertyInvoices.Add(invoice);
            invoices.Add(invoice);
        }

        await context.SaveChangesAsync();
        return invoices;
    }

    /// <summary>
    /// Record a payment for an invoice and update its status
    /// </summary>
    public async Task<Payment> RecordPaymentAsync(RecordPaymentInput input, string createdBy)
    {
        using var context = _contextFactory.CreateDbContext();
        
        var invoice = await context.CopropertyInvoices
            .Include(i => i.Payments)
            .FirstOrDefaultAsync(i => i.Id == input.InvoiceId);

        if (invoice == null)
            throw new InvalidOperationException($"Invoice with ID {input.InvoiceId} not found");

        // Create payment record
        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            InvoiceId = input.InvoiceId,
            Amount = input.Amount,
            PaymentDate = input.PaymentDate,
            PaymentMethod = input.PaymentMethod,
            TransactionId = input.TransactionId ?? input.Reference,
            Notes = input.Notes,
            CreatedBy = Guid.TryParse(input.CreatedBy ?? createdBy, out var userGuid) ? userGuid : Guid.Empty,
            CreatedAt = DateTime.UtcNow
        };

        context.Payments.Add(payment);

        // Update invoice status
        var totalPaid = (invoice.Payments?.Sum(p => p.Amount) ?? 0) + input.Amount;
        
        if (totalPaid >= invoice.TotalAmount)
        {
            invoice.Status = InvoiceStatus.Paid;
            invoice.PaidDate = input.PaymentDate;
        }
        else if (totalPaid > 0)
        {
            invoice.Status = InvoiceStatus.PartiallyPaid;
        }

        invoice.UpdatedAt = DateTime.UtcNow;

        await context.SaveChangesAsync();
        return payment;
    }

    /// <summary>
    /// Send payment reminder for overdue invoice
    /// </summary>
    public async Task SendPaymentReminderAsync(Guid invoiceId, int level = 1)
    {
        using var context = _contextFactory.CreateDbContext();
        
        var invoice = await context.CopropertyInvoices
            .Include(i => i.Unit)
            .Include(i => i.Owner)
            .FirstOrDefaultAsync(i => i.Id == invoiceId);

        if (invoice == null)
            throw new InvalidOperationException($"Invoice with ID {invoiceId} not found");

        if (invoice.Status == InvoiceStatus.Paid)
            return;

        // TODO: Integrate with notification service to send reminders
        // Different levels:
        // Level 1: 5 days after due date
        // Level 2: 15 days after due date
        // Level 3: 30 days after due date (final notice)

        var reminderMessage = $"Payment reminder for invoice {invoice.InvoiceNumber} - Level {level}";
        // Send via notification service
    }

    /// <summary>
    /// Generate financial report for a coproperty
    /// </summary>
    public async Task<FinancialReport> GenerateFinancialReportAsync(Guid copropertyId, int year)
    {
        using var context = _contextFactory.CreateDbContext();
        
        var charges = await context.Charges
            .Where(c => c.CopropertyId == copropertyId && c.CreatedAt.HasValue && c.CreatedAt.Value.Year == year)
            .ToListAsync();

        var invoices = await context.CopropertyInvoices
            .Where(i => i.Charge.CopropertyId == copropertyId && i.CreatedAt.HasValue && i.CreatedAt.Value.Year == year)
            .Include(i => i.Payments)
            .ToListAsync();

        var totalCharges = charges.Sum(c => c.TotalAmount);
        var totalCollected = invoices.Sum(i => i.Payments.Sum(p => p.Amount));
        var totalOverdue = invoices
            .Where(i => i.Status == InvoiceStatus.Overdue || 
                       (i.Status == InvoiceStatus.PartiallyPaid && i.DueDate < DateTime.UtcNow))
            .Sum(i => i.TotalAmount - (i.Payments.Sum(p => p.Amount)));

        var report = new FinancialReport
        {
            CopropertyId = copropertyId,
            Year = year,
            TotalCharges = totalCharges,
            TotalCollected = totalCollected,
            TotalOverdue = totalOverdue,
            Balance = totalCollected - totalCharges,
            MonthlyBalances = GenerateMonthlyBalances(year, totalCharges, totalCollected)
        };

        return report;
    }

    /// <summary>
    /// Get dashboard statistics
    /// </summary>
    public async Task<DashboardStats> GetDashboardStatsAsync(Guid? copropertyId = null)
    {
        using var context = _contextFactory.CreateDbContext();
        
        var copropertiesQuery = context.Coproperties.AsQueryable();
        if (copropertyId.HasValue)
            copropertiesQuery = copropertiesQuery.Where(c => c.Id == copropertyId);

        var totalCoproperties = await copropertiesQuery.CountAsync();

        var unitsQuery = context.Units
            .Where(u => !copropertyId.HasValue || u.CopropertyId == copropertyId);

        var totalUnits = await unitsQuery.CountAsync();
        var occupiedUnits = await unitsQuery.Where(u => u.IsOccupied).CountAsync();
        var totalArea = await unitsQuery.SumAsync(u => u.Area ?? 0m);

        var invoicesQuery = context.CopropertyInvoices.AsQueryable();
        if (copropertyId.HasValue)
            invoicesQuery = invoicesQuery.Where(i => i.Charge.CopropertyId == copropertyId);

        var totalCharges = await invoicesQuery.SumAsync(i => i.Amount);
        var overdueInvoices = await invoicesQuery
            .Where(i => (i.Status == InvoiceStatus.Pending || i.Status == InvoiceStatus.PartiallyPaid) &&
                       i.DueDate < DateTime.UtcNow)
            .CountAsync();

        var pendingMaintenance = await context.MaintenanceRequests
            .Where(m => !copropertyId.HasValue || m.CopropertyId == copropertyId)
            .Where(m => m.Status != MaintenanceStatus.Completed && m.Status != MaintenanceStatus.Cancelled)
            .CountAsync();

        var totalBalance = invoicesQuery
            .Where(i => i.Status != InvoiceStatus.Paid)
            .Include(i => i.Payments)
            .ToListAsync()
            .ContinueWith(task => (decimal)task.Result.Sum(i => i.TotalAmount - (i.Payments?.Sum(p => p.Amount) ?? 0)));

        var totalOwners = await context.OwnerUnits
            .Where(ou => !copropertyId.HasValue || ou.Unit.CopropertyId == copropertyId)
            .Select(ou => ou.OwnerId)
            .Distinct()
            .CountAsync();

        var activeCharges = await context.Charges
            .Where(c => !copropertyId.HasValue || c.CopropertyId == copropertyId)
            .Where(c => c.IsActive)
            .CountAsync();

        var occupancyRate = totalUnits > 0 ? (decimal)occupiedUnits / totalUnits * 100 : 0;

        return new DashboardStats
        {
            TotalCoproperties = totalCoproperties,
            TotalUnits = totalUnits,
            OccupiedUnits = occupiedUnits,
            TotalCharges = totalCharges,
            TotalBalance = totalBalance.Result,
            PendingMaintenance = pendingMaintenance,
            OverdueInvoices = overdueInvoices,
            TotalOwners = totalOwners,
            ActiveCharges = activeCharges,
            TotalArea = totalArea,
            OccupancyRate = Math.Round(occupancyRate, 1)
        };
    }

    private List<MonthlyBalance> GenerateMonthlyBalances(int year, decimal totalCharges, decimal totalCollected)
    {
        var monthlyBalances = new List<MonthlyBalance>();
        var monthNames = new[] { "January", "February", "March", "April", "May", "June",
                               "July", "August", "September", "October", "November", "December" };

        var avgMonthlyCharges = totalCharges / 12;
        var avgMonthlyReceipts = totalCollected / 12;

        decimal openingBalance = 0;
        for (int month = 1; month <= 12; month++)
        {
            var closing = openingBalance + avgMonthlyReceipts - avgMonthlyCharges;
            monthlyBalances.Add(new MonthlyBalance
            {
                Month = month,
                MonthName = monthNames[month - 1],
                Opening = openingBalance,
                Receipts = avgMonthlyReceipts,
                Expenses = avgMonthlyCharges,
                Closing = closing
            });
            openingBalance = closing;
        }

        return monthlyBalances;
    }

    /// <summary>
    /// Get full treasury dashboard with real vs accounting treasury
    /// </summary>
    public async Task<TreasuryDashboard> GetTreasuryDashboardAsync(Guid copropertyId, int months = 12)
    {
        using var context = _contextFactory.CreateDbContext();

        var coproperty = await context.Coproperties.FirstOrDefaultAsync(c => c.Id == copropertyId);
        if (coproperty == null)
            throw new InvalidOperationException($"Coproperty {copropertyId} not found");

        var now = DateTime.UtcNow;
        var startOfYear = new DateTime(now.Year, 1, 1);

        // --- REAL TREASURY (actual cash movements) ---
        // Payments received from owners (encaissements)
        var allPayments = await context.Payments
            .Include(p => p.Invoice)
            .Where(p => p.Invoice.CopropertyId == copropertyId)
            .ToListAsync();

        var paymentsThisYear = allPayments.Where(p => p.PaymentDate >= startOfYear).ToList();
        var totalEncaissements = paymentsThisYear.Sum(p => p.Amount);

        // For decaissements, we use charges that have been actually paid/processed
        // In a real system this would connect to supplier payments
        // Here we approximate with charge amounts for charges marked active within the period
        var chargesThisYear = await context.Charges
            .Where(c => c.CopropertyId == copropertyId && c.IsActive)
            .Where(c => c.CreatedAt.HasValue && c.CreatedAt.Value >= startOfYear)
            .ToListAsync();
        var totalDecaissements = chargesThisYear.Sum(c => c.TotalAmount);

        // Opening balance: sum of all payments before this year minus all charges before this year
        var paymentsBefore = allPayments.Where(p => p.PaymentDate < startOfYear).Sum(p => p.Amount);
        var chargesBefore = await context.Charges
            .Where(c => c.CopropertyId == copropertyId)
            .Where(c => c.CreatedAt.HasValue && c.CreatedAt.Value < startOfYear)
            .SumAsync(c => c.TotalAmount);
        var openingBalance = paymentsBefore - chargesBefore;

        var realTreasury = new RealTreasury
        {
            OpeningBalance = openingBalance,
            TotalEncaissements = totalEncaissements,
            TotalDecaissements = totalDecaissements,
            CurrentBalance = openingBalance + totalEncaissements - totalDecaissements
        };

        // --- ACCOUNTING TREASURY (obligations) ---
        var allInvoices = await context.CopropertyInvoices
            .Include(i => i.Payments)
            .Include(i => i.Charge)
            .Where(i => i.CopropertyId == copropertyId)
            .ToListAsync();

        var totalChargesEngaged = await context.Charges
            .Where(c => c.CopropertyId == copropertyId && c.IsActive)
            .SumAsync(c => c.TotalAmount);

        var totalInvoiced = allInvoices.Sum(i => i.TotalAmount);
        var totalCollected = allInvoices.Sum(i => i.Payments.Sum(p => p.Amount));
        var totalOutstanding = allInvoices
            .Where(i => i.Status != InvoiceStatus.Paid && i.Status != InvoiceStatus.Cancelled)
            .Sum(i => i.TotalAmount - i.Payments.Sum(p => p.Amount));
        var totalOverdue = allInvoices
            .Where(i => (i.Status == InvoiceStatus.Pending || i.Status == InvoiceStatus.PartiallyPaid || i.Status == InvoiceStatus.Overdue)
                        && i.DueDate < now)
            .Sum(i => i.TotalAmount - i.Payments.Sum(p => p.Amount));

        var accountingTreasury = new AccountingTreasury
        {
            TotalChargesEngaged = totalChargesEngaged,
            TotalInvoiced = totalInvoiced,
            TotalCollected = totalCollected,
            TotalOutstanding = totalOutstanding,
            TotalOverdue = totalOverdue,
            AccountingBalance = totalCollected - totalChargesEngaged
        };

        // Collection rate
        var collectionRate = totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0;

        // Treasury evolution
        var evolution = await GetTreasuryEvolutionAsync(copropertyId, months);

        // Expense breakdown by charge type
        var chargesByType = await context.Charges
            .Where(c => c.CopropertyId == copropertyId && c.IsActive)
            .GroupBy(c => c.ChargeType)
            .Select(g => new { Type = g.Key, Amount = g.Sum(c => c.TotalAmount) })
            .ToListAsync();

        var totalChargeAmount = chargesByType.Sum(c => c.Amount);
        var expensesByType = chargesByType.Select(c => new ExpenseBreakdown
        {
            Category = c.Type.ToString(),
            Amount = c.Amount,
            Percentage = totalChargeAmount > 0 ? (c.Amount / totalChargeAmount) * 100 : 0
        }).ToList();

        return new TreasuryDashboard
        {
            CopropertyId = copropertyId,
            CopropertyName = coproperty.Name,
            RealTreasury = realTreasury,
            AccountingTreasury = accountingTreasury,
            WorkingCapitalGap = realTreasury.CurrentBalance - accountingTreasury.AccountingBalance,
            CollectionRate = collectionRate,
            Evolution = evolution,
            ExpensesByType = expensesByType
        };
    }

    /// <summary>
    /// Get unpaid/late payment summary across all owners for a coproperty
    /// </summary>
    public async Task<UnpaidPaymentsSummary> GetUnpaidPaymentsSummaryAsync(Guid copropertyId)
    {
        using var context = _contextFactory.CreateDbContext();
        var now = DateTime.UtcNow;

        var invoices = await context.CopropertyInvoices
            .Include(i => i.Payments)
            .Include(i => i.Unit)
            .Include(i => i.Owner)
            .Include(i => i.Charge)
            .Where(i => i.CopropertyId == copropertyId)
            .Where(i => i.Status != InvoiceStatus.Paid && i.Status != InvoiceStatus.Cancelled)
            .ToListAsync();

        var grouped = invoices.GroupBy(i => i.OwnerId);
        var ownerSummaries = new List<OwnerPaymentSummary>();

        foreach (var group in grouped)
        {
            var owner = group.First().Owner;
            var ownerInvoices = group.ToList();

            var totalDue = ownerInvoices.Sum(i => i.TotalAmount);
            var totalPaid = ownerInvoices.Sum(i => i.Payments.Sum(p => p.Amount));
            var totalOutstanding = totalDue - totalPaid;

            var overdueInvoices = ownerInvoices.Where(i => i.DueDate < now).ToList();
            var totalOverdue = overdueInvoices.Sum(i => i.TotalAmount - i.Payments.Sum(p => p.Amount));
            var oldestOverdue = overdueInvoices.OrderBy(i => i.DueDate).FirstOrDefault()?.DueDate;
            var daysOverdue = oldestOverdue.HasValue ? (int)(now - oldestOverdue.Value).TotalDays : 0;

            var healthStatus = GetHealthStatus(daysOverdue, overdueInvoices.Count);

            var unitNumbers = ownerInvoices.Select(i => i.Unit?.UnitNumber ?? "N/A").Distinct().ToList();

            var invoiceDetails = ownerInvoices.Select(i => new OwnerInvoiceDetail
            {
                InvoiceId = i.Id,
                InvoiceNumber = i.InvoiceNumber,
                UnitNumber = i.Unit?.UnitNumber ?? "N/A",
                ChargeName = i.Charge?.Name ?? "N/A",
                Amount = i.TotalAmount,
                PaidAmount = i.Payments.Sum(p => p.Amount),
                RemainingAmount = i.TotalAmount - i.Payments.Sum(p => p.Amount),
                DueDate = i.DueDate,
                DaysLate = i.DueDate < now ? (int)(now - i.DueDate).TotalDays : 0,
                Status = i.Status,
                ReminderLevel = GetReminderLevel(i.DueDate, now)
            }).OrderByDescending(d => d.DaysLate).ToList();

            ownerSummaries.Add(new OwnerPaymentSummary
            {
                OwnerId = owner?.Id ?? group.Key,
                OwnerName = owner != null ? $"{owner.FirstName} {owner.LastName}" : "Unknown",
                Email = owner?.Email ?? "",
                Phone = owner?.Phone,
                UnitNumbers = unitNumbers,
                TotalDue = totalDue,
                TotalPaid = totalPaid,
                TotalOutstanding = totalOutstanding,
                TotalOverdue = totalOverdue,
                OverdueInvoiceCount = overdueInvoices.Count,
                PendingInvoiceCount = ownerInvoices.Count - overdueInvoices.Count,
                OldestOverdueDate = oldestOverdue,
                DaysOverdue = daysOverdue,
                HealthStatus = healthStatus,
                Invoices = invoiceDetails
            });
        }

        // Sort by severity (worst first)
        ownerSummaries = ownerSummaries
            .OrderByDescending(o => o.HealthStatus)
            .ThenByDescending(o => o.TotalOverdue)
            .ToList();

        var allOverdue = invoices.Where(i => i.DueDate < now).ToList();
        var avgDaysOverdue = allOverdue.Any()
            ? (int)allOverdue.Average(i => (now - i.DueDate).TotalDays)
            : 0;

        return new UnpaidPaymentsSummary
        {
            CopropertyId = copropertyId,
            TotalOwners = ownerSummaries.Count,
            OwnersWithOverdue = ownerSummaries.Count(o => o.OverdueInvoiceCount > 0),
            TotalOverdueInvoices = allOverdue.Count,
            TotalOverdueAmount = allOverdue.Sum(i => i.TotalAmount - i.Payments.Sum(p => p.Amount)),
            TotalPendingAmount = invoices.Where(i => i.DueDate >= now).Sum(i => i.TotalAmount - i.Payments.Sum(p => p.Amount)),
            AverageDaysOverdue = avgDaysOverdue,
            OwnerSummaries = ownerSummaries
        };
    }

    /// <summary>
    /// Get payment summary for a specific owner
    /// </summary>
    public async Task<OwnerPaymentSummary> GetOwnerPaymentSummaryAsync(Guid ownerId, Guid? copropertyId = null)
    {
        using var context = _contextFactory.CreateDbContext();
        var now = DateTime.UtcNow;

        var query = context.CopropertyInvoices
            .Include(i => i.Payments)
            .Include(i => i.Unit)
            .Include(i => i.Owner)
            .Include(i => i.Charge)
            .Where(i => i.OwnerId == ownerId);

        if (copropertyId.HasValue)
            query = query.Where(i => i.CopropertyId == copropertyId.Value);

        var invoices = await query.ToListAsync();
        var owner = invoices.FirstOrDefault()?.Owner;

        var unpaidInvoices = invoices.Where(i => i.Status != InvoiceStatus.Paid && i.Status != InvoiceStatus.Cancelled).ToList();
        var overdueInvoices = unpaidInvoices.Where(i => i.DueDate < now).ToList();

        var totalDue = invoices.Sum(i => i.TotalAmount);
        var totalPaid = invoices.Sum(i => i.Payments.Sum(p => p.Amount));
        var totalOutstanding = unpaidInvoices.Sum(i => i.TotalAmount - i.Payments.Sum(p => p.Amount));
        var totalOverdue = overdueInvoices.Sum(i => i.TotalAmount - i.Payments.Sum(p => p.Amount));
        var oldestOverdue = overdueInvoices.OrderBy(i => i.DueDate).FirstOrDefault()?.DueDate;
        var daysOverdue = oldestOverdue.HasValue ? (int)(now - oldestOverdue.Value).TotalDays : 0;

        var invoiceDetails = unpaidInvoices.Select(i => new OwnerInvoiceDetail
        {
            InvoiceId = i.Id,
            InvoiceNumber = i.InvoiceNumber,
            UnitNumber = i.Unit?.UnitNumber ?? "N/A",
            ChargeName = i.Charge?.Name ?? "N/A",
            Amount = i.TotalAmount,
            PaidAmount = i.Payments.Sum(p => p.Amount),
            RemainingAmount = i.TotalAmount - i.Payments.Sum(p => p.Amount),
            DueDate = i.DueDate,
            DaysLate = i.DueDate < now ? (int)(now - i.DueDate).TotalDays : 0,
            Status = i.Status,
            ReminderLevel = GetReminderLevel(i.DueDate, now)
        }).OrderByDescending(d => d.DaysLate).ToList();

        return new OwnerPaymentSummary
        {
            OwnerId = ownerId,
            OwnerName = owner != null ? $"{owner.FirstName} {owner.LastName}" : "Unknown",
            Email = owner?.Email ?? "",
            Phone = owner?.Phone,
            UnitNumbers = invoices.Select(i => i.Unit?.UnitNumber ?? "N/A").Distinct().ToList(),
            TotalDue = totalDue,
            TotalPaid = totalPaid,
            TotalOutstanding = totalOutstanding,
            TotalOverdue = totalOverdue,
            OverdueInvoiceCount = overdueInvoices.Count,
            PendingInvoiceCount = unpaidInvoices.Count - overdueInvoices.Count,
            OldestOverdueDate = oldestOverdue,
            DaysOverdue = daysOverdue,
            HealthStatus = GetHealthStatus(daysOverdue, overdueInvoices.Count),
            Invoices = invoiceDetails
        };
    }

    private static PaymentHealthStatus GetHealthStatus(int daysOverdue, int overdueCount)
    {
        if (overdueCount == 0) return PaymentHealthStatus.Pending;
        if (daysOverdue > 90) return PaymentHealthStatus.Delinquent;
        if (daysOverdue > 30) return PaymentHealthStatus.Critical;
        return PaymentHealthStatus.Late;
    }

    private static int GetReminderLevel(DateTime dueDate, DateTime now)
    {
        if (dueDate >= now) return 0;
        var daysLate = (int)(now - dueDate).TotalDays;
        if (daysLate > 30) return 3;
        if (daysLate > 15) return 2;
        if (daysLate > 5) return 1;
        return 0;
    }
}
