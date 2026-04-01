using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;
using Myb.Coproperty.Models.Dtos;
using Myb.Common.Messaging;
using Myb.Common.Messaging.Models;
using Microsoft.EntityFrameworkCore;

namespace Myb.Coproperty.Services;

/// <summary>
/// Service interface for fund call operations
/// </summary>
public interface IFundCallService
{
    Task<FundCall> CreateAsync(CreateFundCallInput input, string userId);
    Task<FundCall> UpdateAsync(Guid id, CreateFundCallInput input, string userId);
    Task<FundCall> UpdateStatusAsync(Guid id, UpdateFundCallInput input, string userId);
    Task DeleteAsync(Guid id);
    Task<FundCall?> GetByIdAsync(Guid id);
    Task<List<FundCall>> GetByCopropertyIdAsync(Guid copropertyId, Guid? ownerId = null, int? year = null);
    Task<List<FundCall>> GetAllAsync();
    Task<FundCallPayment> AddPaymentAsync(Guid fundCallId, AddFundCallPaymentInput input, string userId);
    Task<List<CopropertyInvoice>> GenerateInvoicesFromFundCallAsync(Guid fundCallId, string userId);
}

/// <summary>
/// Service implementation for fund call operations
/// </summary>
public class FundCallService : IFundCallService
{
    private readonly IDbContextFactory<CopropertyDbContext> _contextFactory;
    private readonly IEmailPublisher _emailPublisher;

    public FundCallService(IDbContextFactory<CopropertyDbContext> contextFactory, IEmailPublisher emailPublisher)
    {
        _contextFactory = contextFactory;
        _emailPublisher = emailPublisher;
    }

    public async Task<FundCall> CreateAsync(CreateFundCallInput input, string userId)
    {
        if (!input.CopropertyId.HasValue || input.CopropertyId.Value == Guid.Empty)
            throw new ArgumentException("CopropertyId is required to create a fund call");

        using var context = _contextFactory.CreateDbContext();

        // Verify coproperty exists
        var copropertyExists = await context.Coproperties
            .AnyAsync(c => c.Id == input.CopropertyId.Value);

        if (!copropertyExists)
            throw new ArgumentException($"Coproperty with ID {input.CopropertyId.Value} not found");

        // Duplicate check: same coproperty + same calendar day (UTC) + same OwnerId
        // Use a date range to avoid date_trunc type-mismatch with timestamptz columns
        var dueDayUtc = DateTime.SpecifyKind(input.DueDate.Date, DateTimeKind.Utc);
        var nextDayUtc = dueDayUtc.AddDays(1);
        var existingFundCall = await context.FundCalls.FirstOrDefaultAsync(f =>
            f.CopropertyId == input.CopropertyId.Value &&
            f.OwnerId == input.OwnerId &&
            f.DueDate >= dueDayUtc && f.DueDate < nextDayUtc);

        // If a fund call already exists, update its amount and description instead of rejecting
        if (existingFundCall != null)
        {
            existingFundCall.Amount = input.Amount;
            existingFundCall.Description = input.Description;
            existingFundCall.Status = input.Status ?? existingFundCall.Status;
            existingFundCall.UpdatedAt = DateTime.UtcNow;
            await context.SaveChangesAsync();
            return existingFundCall;
        }

        var fundCall = new FundCall
        {
            Id = Guid.NewGuid(),
            CopropertyId = input.CopropertyId.Value,
            OwnerId = input.OwnerId,
            Amount = input.Amount,
            DueDate = input.DueDate,
            Description = input.Description,
            Status = input.Status ?? FundCallStatus.ToPay,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = Guid.TryParse(userId, out var userGuid) ? userGuid : Guid.Empty,
            UpdatedAt = DateTime.UtcNow
        };

        context.FundCalls.Add(fundCall);
        await context.SaveChangesAsync();

        // Send email notification to the owner if fund call targets a specific owner
        if (input.OwnerId.HasValue)
        {
            var owner = await context.Owners.FindAsync(input.OwnerId.Value);
            if (owner != null && !string.IsNullOrEmpty(owner.Email))
            {
                await _emailPublisher.PublishAsync(new EmailMessage
                {
                    To = owner.Email,
                    Subject = $"Appel de fonds - {fundCall.Description}",
                    HtmlBody = $@"<h1>Nouvel appel de fonds</h1>
                        <p>Bonjour {owner.FirstName} {owner.LastName},</p>
                        <p>Un nouvel appel de fonds a été créé pour votre copropriété.</p>
                        <table style='border-collapse:collapse;'>
                            <tr><td><strong>Description :</strong></td><td>{fundCall.Description}</td></tr>
                            <tr><td><strong>Montant :</strong></td><td>{fundCall.Amount:N2} €</td></tr>
                            <tr><td><strong>Date d'échéance :</strong></td><td>{fundCall.DueDate:dd/MM/yyyy}</td></tr>
                        </table>
                        <br/>
                        <p>Cordialement,<br/>L'équipe MYB</p>",
                    Source = "coproperty-service"
                });
            }
        }

        return fundCall;
    }

    public async Task<FundCall> UpdateAsync(Guid id, CreateFundCallInput input, string userId)
    {
        using var context = _contextFactory.CreateDbContext();

        var fundCall = await context.FundCalls.FindAsync(id);
        if (fundCall == null)
            throw new InvalidOperationException($"FundCall with ID {id} not found");

        fundCall.Amount = input.Amount;
        fundCall.DueDate = input.DueDate;
        fundCall.Description = input.Description;
        fundCall.OwnerId = input.OwnerId;
        fundCall.Status = input.Status ?? fundCall.Status;
        fundCall.UpdatedAt = DateTime.UtcNow;

        await context.SaveChangesAsync();

        return fundCall;
    }

    public async Task<FundCall> UpdateStatusAsync(Guid id, UpdateFundCallInput input, string userId)
    {
        using var context = _contextFactory.CreateDbContext();

        var fundCall = await context.FundCalls.FindAsync(id);
        if (fundCall == null)
            throw new InvalidOperationException($"FundCall with ID {id} not found");

        fundCall.Status = input.Status;
        fundCall.UpdatedAt = DateTime.UtcNow;

        await context.SaveChangesAsync();

        return fundCall;
    }

    public async Task DeleteAsync(Guid id)
    {
        using var context = _contextFactory.CreateDbContext();

        var fundCall = await context.FundCalls.FindAsync(id);
        if (fundCall != null)
        {
            context.FundCalls.Remove(fundCall);
            await context.SaveChangesAsync();
        }
    }

    public async Task<FundCall?> GetByIdAsync(Guid id)
    {
        using var context = _contextFactory.CreateDbContext();

        return await context.FundCalls
            .Include(f => f.Coproperty)
            .Include(f => f.Owner)
            .Include(f => f.Invoices)
            .Include(f => f.Payments)
            .FirstOrDefaultAsync(f => f.Id == id);
    }

    public async Task<List<FundCall>> GetByCopropertyIdAsync(Guid copropertyId, Guid? ownerId = null, int? year = null)
    {
        using var context = _contextFactory.CreateDbContext();

        var query = context.FundCalls
            .Where(f => f.CopropertyId == copropertyId)
            .AsQueryable();

        if (ownerId.HasValue)
            query = query.Where(f => f.OwnerId == ownerId.Value);

        if (year.HasValue)
            query = query.Where(f => f.DueDate.Year == year.Value);

        return await query
            .Include(f => f.Owner)
            .Include(f => f.Invoices)
            .Include(f => f.Payments)
            .OrderByDescending(f => f.DueDate)
            .ToListAsync();
    }

    public async Task<List<FundCall>> GetAllAsync()
    {
        using var context = _contextFactory.CreateDbContext();

        return await context.FundCalls
            .Include(f => f.Owner)
            .Include(f => f.Invoices)
            .Include(f => f.Payments)
            .OrderByDescending(f => f.DueDate)
            .ToListAsync();
    }

    public async Task<FundCallPayment> AddPaymentAsync(Guid fundCallId, AddFundCallPaymentInput input, string userId)
    {
        using var context = _contextFactory.CreateDbContext();

        var fundCall = await context.FundCalls.FindAsync(fundCallId);
        if (fundCall == null)
            throw new InvalidOperationException($"FundCall with ID {fundCallId} not found");

        var payment = new FundCallPayment
        {
            Id = Guid.NewGuid(),
            FundCallId = fundCallId,
            Amount = input.Amount,
            PaymentDate = input.PaymentDate,
            Justificatif = input.Justificatif,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = Guid.TryParse(userId, out var userGuid) ? userGuid : Guid.Empty
        };

        context.FundCallPayments.Add(payment);

        // Auto-transition status to Paid if the total payments cover the fund call amount
        var existingTotal = await context.FundCallPayments
            .Where(p => p.FundCallId == fundCallId)
            .SumAsync(p => p.Amount);

        if (existingTotal + input.Amount >= fundCall.Amount)
            fundCall.Status = FundCallStatus.Paid;

        fundCall.UpdatedAt = DateTime.UtcNow;

        // Sync payment to charge distributions for this owner/coproperty
        // This ensures coherence between fund call payments and charge payment statuses
        if (fundCall.OwnerId.HasValue)
        {
            // Get all unit IDs owned by this owner in this coproperty
            var ownerUnitIds = await context.OwnerUnits
                .Where(ou => ou.OwnerId == fundCall.OwnerId.Value)
                .Join(context.Units,
                    ou => ou.UnitId,
                    u => u.Id,
                    (ou, u) => new { ou.UnitId, u.CopropertyId })
                .Where(x => x.CopropertyId == fundCall.CopropertyId)
                .Select(x => x.UnitId)
                .ToListAsync();

            if (ownerUnitIds.Count > 0)
            {
                // Get unpaid charge distributions for these units, ordered by oldest first (FIFO)
                var unpaidDistributions = await context.ChargeDistributions
                    .Include(cd => cd.Charge)
                    .Where(cd => ownerUnitIds.Contains(cd.UnitId)
                        && cd.Charge.CopropertyId == fundCall.CopropertyId
                        && cd.PaymentStatus != ChargePaymentStatus.Paid)
                    .OrderBy(cd => cd.CalculatedAt)
                    .ToListAsync();

                // Distribute payment across unpaid distributions (FIFO)
                var remainingPayment = input.Amount;
                foreach (var dist in unpaidDistributions)
                {
                    if (remainingPayment <= 0) break;

                    var amountDue = dist.Amount - dist.PaidAmount;
                    var payAmount = Math.Min(remainingPayment, amountDue);

                    dist.PaidAmount += payAmount;
                    dist.PaidAt = input.PaymentDate;
                    dist.PaymentMethod = "BankTransfer";
                    dist.PaymentTransactionId = input.Justificatif ?? $"FC-{fundCallId}";
                    dist.UpdatedAt = DateTime.UtcNow;

                    if (dist.PaidAmount >= dist.Amount)
                        dist.PaymentStatus = ChargePaymentStatus.Paid;
                    else if (dist.PaidAmount > 0)
                        dist.PaymentStatus = ChargePaymentStatus.PartiallyPaid;

                    remainingPayment -= payAmount;
                }
            }
        }

        await context.SaveChangesAsync();

        return payment;
    }

    public async Task<List<CopropertyInvoice>> GenerateInvoicesFromFundCallAsync(Guid fundCallId, string userId)
    {
        using var context = _contextFactory.CreateDbContext();

        var fundCall = await context.FundCalls
            .Include(f => f.Coproperty)
            .FirstOrDefaultAsync(f => f.Id == fundCallId);

        if (fundCall == null)
            throw new InvalidOperationException($"FundCall with ID {fundCallId} not found");

        var coproperty = await context.Coproperties
            .Include(c => c.Units)
            .ThenInclude(u => u.Owners)
            .FirstOrDefaultAsync(c => c.Id == fundCall.CopropertyId);

        if (coproperty == null)
            throw new InvalidOperationException($"Coproperty with ID {fundCall.CopropertyId} not found");

        var invoices = new List<CopropertyInvoice>();
        var totalShares = coproperty.Units.Sum(u => u.Shares);

        foreach (var unit in coproperty.Units)
        {
            if (unit.Owners.Any())
            {
                var sharePercentage = totalShares > 0 ? (decimal)unit.Shares / totalShares : 0;
                var unitAmount = fundCall.Amount * sharePercentage;

                var owner = unit.Owners.First();

                // Skip if a pending invoice already exists for this unit + owner + coproperty
                var existingInvoice = await context.CopropertyInvoices
                    .AnyAsync(i =>
                        i.CopropertyId == fundCall.CopropertyId &&
                        i.UnitId == unit.Id &&
                        i.OwnerId == owner.Id &&
                        i.Status != InvoiceStatus.Paid);
                if (existingInvoice) continue;

                var invoice = new CopropertyInvoice
                {
                    Id = Guid.NewGuid(),
                    CopropertyId = fundCall.CopropertyId,
                    UnitId = unit.Id,
                    OwnerId = owner.Id,
                    InvoiceNumber = $"FC-{fundCall.Id.ToString().Substring(0, 8)}-{unit.UnitNumber}",
                    TotalAmount = unitAmount,
                    DueDate = fundCall.DueDate,
                    Status = InvoiceStatus.Pending,
                    Description = fundCall.Description,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = Guid.TryParse(userId, out var userGuid) ? userGuid : Guid.Empty
                };

                context.CopropertyInvoices.Add(invoice);
                invoices.Add(invoice);
            }
        }

        await context.SaveChangesAsync();

        return invoices;
    }
}
