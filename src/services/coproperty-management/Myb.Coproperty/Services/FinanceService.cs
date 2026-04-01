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
            .Include(c => c.Distributions)
            .FirstOrDefaultAsync(c => c.Id == chargeId);

        if (charge == null)
            throw new InvalidOperationException($"Charge with ID {chargeId} not found");

        var invoices = new List<CopropertyInvoice>();

        // Get all charge distributions for this charge
        var distributions = charge.Distributions.ToList();

        foreach (var distribution in distributions)
        {
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
                OwnerId = Guid.Empty,
                Amount = invoiceAmount,
                TaxAmount = 0, // Calculate based on tax settings
                TotalAmount = invoiceAmount,
                InvoiceDate = DateTime.UtcNow,
                DueDate = DateTime.UtcNow.AddDays(30),
                Status = InvoiceStatus.Pending,
                CreatedBy = Guid.TryParse(createdBy, out var userGuid) ? userGuid : Guid.Empty,
                Description = charge.Description,
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
        var totalUnits = await context.Units
            .Where(u => !copropertyId.HasValue || u.CopropertyId == copropertyId)
            .CountAsync();

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

        return new DashboardStats
        {
            TotalCoproperties = totalCoproperties,
            TotalUnits = totalUnits,
            TotalCharges = totalCharges,
            TotalBalance = totalBalance.Result,
            PendingMaintenance = pendingMaintenance,
            OverdueInvoices = overdueInvoices
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
}
