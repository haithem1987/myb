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
    Task<List<FundCall>> GetByOwnerIdAsync(Guid ownerId);
    Task<FundCallPayment> AddPaymentAsync(Guid fundCallId, AddFundCallPaymentInput input, string userId);
    Task<List<CopropertyInvoice>> GenerateInvoicesFromFundCallAsync(Guid fundCallId, string userId);
    Task<Dictionary<Guid, decimal>> GetExistingFundCallTotalsByOwnerAsync(Guid copropertyId);
}

/// <summary>
/// Service implementation for fund call operations
/// </summary>
public class FundCallService : IFundCallService
{
    private readonly IDbContextFactory<CopropertyDbContext> _contextFactory;
    private readonly IEmailPublisher _emailPublisher;
    private readonly IHttpClientFactory _httpClientFactory;

    public FundCallService(
        IDbContextFactory<CopropertyDbContext> contextFactory,
        IEmailPublisher emailPublisher,
        IHttpClientFactory httpClientFactory)
    {
        _contextFactory = contextFactory;
        _emailPublisher = emailPublisher;
        _httpClientFactory = httpClientFactory;
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

    public async Task<List<FundCall>> GetByOwnerIdAsync(Guid ownerId)
    {
        using var context = _contextFactory.CreateDbContext();

        return await context.FundCalls
            .Where(f => f.OwnerId == ownerId && f.IsActive)
            .Include(f => f.Coproperty)
            .Include(f => f.Owner)
            .Include(f => f.Payments)
            .OrderByDescending(f => f.DueDate)
            .ToListAsync();
    }

    /// <summary>
    /// Returns a dictionary of OwnerId → total remaining amount (Amount - sum of payments)
    /// for all active, unpaid fund calls in a given coproperty.
    /// Used during repartition to avoid double-charging owners.
    /// </summary>
    public async Task<Dictionary<Guid, decimal>> GetExistingFundCallTotalsByOwnerAsync(Guid copropertyId)
    {
        using var context = _contextFactory.CreateDbContext();

        var fundCalls = await context.FundCalls
            .Where(f => f.CopropertyId == copropertyId && f.IsActive && f.OwnerId.HasValue)
            .Include(f => f.Payments)
            .ToListAsync();

        var result = new Dictionary<Guid, decimal>();
        foreach (var fc in fundCalls)
        {
            var ownerId = fc.OwnerId!.Value;
            var paidTotal = fc.Payments.Sum(p => p.Amount);
            var remaining = fc.Amount - paidTotal;
            if (remaining > 0)
            {
                if (result.ContainsKey(ownerId))
                    result[ownerId] += remaining;
                else
                    result[ownerId] = remaining;
            }
        }
        return result;
    }

    public async Task<FundCallPayment> AddPaymentAsync(Guid fundCallId, AddFundCallPaymentInput input, string userId)
    {
        using var context = _contextFactory.CreateDbContext();

        var fundCall = await context.FundCalls
            .Include(f => f.Payments)
            .FirstOrDefaultAsync(f => f.Id == fundCallId);
        if (fundCall == null)
            throw new InvalidOperationException($"FundCall with ID {fundCallId} not found");

        // Resolve the paying owner: prefer the owner linked on the fund call, fall back to
        // the Keycloak user ID of whoever is calling this mutation (supports generic fund calls
        // where OwnerId is null = applies to all owners).
        var payingUserGuid = Guid.TryParse(userId, out var userGuidParsed) ? userGuidParsed : Guid.Empty;

        var effectiveOwnerId = fundCall.OwnerId;
        if (!effectiveOwnerId.HasValue && payingUserGuid != Guid.Empty)
        {
            var ownerByUser = await context.Owners
                .FirstOrDefaultAsync(o => o.UserId == payingUserGuid);
            if (ownerByUser != null)
                effectiveOwnerId = ownerByUser.Id;
        }

        // Calculate remaining amount and prevent overpayment
        var existingTotal = fundCall.Payments.Sum(p => p.Amount);
        var remaining = fundCall.Amount - existingTotal;

        if (remaining <= 0)
            throw new InvalidOperationException("Cet appel de fonds est déjà entièrement réglé.");

        if (input.Amount > remaining)
            throw new InvalidOperationException(
                $"Le montant du versement ({input.Amount:N3} DT) dépasse le reste à payer ({remaining:N3} DT). Montant maximum autorisé: {remaining:N3} DT.");

        if (input.Amount <= 0)
            throw new InvalidOperationException("Le montant du versement doit être supérieur à 0.");

        var payment = new FundCallPayment
        {
            Id = Guid.NewGuid(),
            FundCallId = fundCallId,
            Amount = input.Amount,
            PaymentDate = input.PaymentDate,
            Justificatif = input.Justificatif,
            PaymentMethod = input.PaymentMethod,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = Guid.TryParse(userId, out var userGuid) ? userGuid : Guid.Empty
        };

        context.FundCallPayments.Add(payment);

        // Auto-transition status to Paid if the total payments cover the fund call amount
        if (existingTotal + input.Amount >= fundCall.Amount)
            fundCall.Status = FundCallStatus.Paid;

        fundCall.UpdatedAt = DateTime.UtcNow;

        // Sync payment to charge distributions for this owner/coproperty
        // This ensures coherence between fund call payments and charge payment statuses
        if (effectiveOwnerId.HasValue)
        {
            // Get all unit IDs owned by this owner in this coproperty
            var ownerUnitIds = await context.OwnerUnits
                .Where(ou => ou.OwnerId == effectiveOwnerId.Value)
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
                    .Include(cd => cd.Unit)
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
                    dist.PaymentMethod = input.PaymentMethod ?? "Virement";
                    dist.PaymentTransactionId = input.Justificatif ?? $"FC-{fundCallId}";
                    dist.UpdatedAt = DateTime.UtcNow;

                    if (dist.PaidAmount >= dist.Amount)
                        dist.PaymentStatus = ChargePaymentStatus.Paid;
                    else if (dist.PaidAmount > 0)
                        dist.PaymentStatus = ChargePaymentStatus.PartiallyPaid;

                    // Generate a payment receipt (CopropertyInvoice) for this distribution
                    var unitNumber = dist.Unit?.UnitNumber ?? "";
                    var chargeName = dist.Charge?.Name ?? fundCall.Description ?? "Charge";

                    // Check if a pending invoice already exists for this distribution
                    var existingInvoice = await context.CopropertyInvoices
                        .FirstOrDefaultAsync(i =>
                            i.CopropertyId == fundCall.CopropertyId &&
                            i.UnitId == dist.UnitId &&
                            i.OwnerId == effectiveOwnerId.Value &&
                            i.ChargeId == dist.ChargeId &&
                            i.Status != InvoiceStatus.Paid);

                    if (existingInvoice != null)
                    {
                        // Update existing invoice to reflect payment
                        existingInvoice.Status = dist.PaymentStatus == ChargePaymentStatus.Paid
                            ? InvoiceStatus.Paid : InvoiceStatus.PartiallyPaid;
                        existingInvoice.PaidDate = input.PaymentDate;
                        existingInvoice.PaymentMethod = input.PaymentMethod ?? "Virement";
                        existingInvoice.Notes = input.Justificatif ?? $"FC-{fundCallId}";
                        existingInvoice.UpdatedAt = DateTime.UtcNow;
                    }
                    else
                    {
                        // Create a new payment receipt
                        var seq = await context.CopropertyInvoices
                            .CountAsync(i => i.CopropertyId == fundCall.CopropertyId) + 1;
                        var receipt = new CopropertyInvoice
                        {
                            Id = Guid.NewGuid(),
                            CopropertyId = fundCall.CopropertyId,
                            ChargeId = dist.ChargeId,
                            UnitId = dist.UnitId,
                            OwnerId = effectiveOwnerId.Value,
                            InvoiceNumber = $"PAY-{seq:D4}-{unitNumber}",
                            Amount = payAmount,
                            TaxAmount = 0,
                            TotalAmount = payAmount,
                            InvoiceDate = input.PaymentDate,
                            DueDate = input.PaymentDate,
                            Status = dist.PaymentStatus == ChargePaymentStatus.Paid
                                ? InvoiceStatus.Paid : InvoiceStatus.PartiallyPaid,
                            PaidDate = input.PaymentDate,
                            PaymentMethod = input.PaymentMethod ?? "Virement",
                            Description = $"Paiement de charge : {chargeName} - Lot {unitNumber}",
                            Notes = input.Justificatif ?? $"FC-{fundCallId}",
                            CreatedAt = DateTime.UtcNow,
                            CreatedBy = payingUserGuid
                        };
                        context.CopropertyInvoices.Add(receipt);
                    }

                    remainingPayment -= payAmount;
                }

                // If no distributions were found (no charges yet), create a standalone receipt
                if (unpaidDistributions.Count == 0)
                {
                    var ownerUnit = await context.Units
                        .Where(u => ownerUnitIds.Contains(u.Id))
                        .FirstOrDefaultAsync();
                    var unitNumber = ownerUnit?.UnitNumber ?? "";
                    var seq = await context.CopropertyInvoices
                        .CountAsync(i => i.CopropertyId == fundCall.CopropertyId) + 1;
                    var receipt = new CopropertyInvoice
                    {
                        Id = Guid.NewGuid(),
                        CopropertyId = fundCall.CopropertyId,
                        UnitId = ownerUnit?.Id ?? Guid.Empty,
                        OwnerId = effectiveOwnerId.Value,
                        InvoiceNumber = $"PAY-{seq:D4}-{unitNumber}",
                        Amount = input.Amount,
                        TaxAmount = 0,
                        TotalAmount = input.Amount,
                        InvoiceDate = input.PaymentDate,
                        DueDate = input.PaymentDate,
                        Status = InvoiceStatus.Paid,
                        PaidDate = input.PaymentDate,
                        PaymentMethod = input.PaymentMethod ?? "Virement",
                        Description = $"Paiement : {fundCall.Description} - Lot {unitNumber}",
                        Notes = input.Justificatif ?? $"FC-{fundCallId}",
                        CreatedAt = DateTime.UtcNow,
                        CreatedBy = payingUserGuid
                    };
                    context.CopropertyInvoices.Add(receipt);
                }
            }
        }

        await context.SaveChangesAsync();

        // Notify the syndic (email + real-time) about the payment
        await NotifySyndicPaymentReceived(context, fundCall, payment, input);

        return payment;
    }

    /// <summary>
    /// Sends email and real-time notification to the syndic when an owner submits a payment.
    /// </summary>
    private async Task NotifySyndicPaymentReceived(
        CopropertyDbContext context,
        FundCall fundCall,
        FundCallPayment payment,
        AddFundCallPaymentInput input)
    {
        try
        {
            var coproperty = await context.Coproperties.FindAsync(fundCall.CopropertyId);
            if (coproperty == null) return;

            var owner = fundCall.OwnerId.HasValue
                ? await context.Owners.FindAsync(fundCall.OwnerId.Value)
                : null;
            var ownerName = owner != null ? $"{owner.FirstName} {owner.LastName}" : "Propriétaire inconnu";

            var totalPaid = fundCall.Payments.Sum(p => p.Amount) + input.Amount;
            var remaining = fundCall.Amount - totalPaid;
            var statusText = remaining <= 0 ? "ENTIÈREMENT RÉGLÉ" : $"Reste à payer: {remaining:N3} DT";

            // 1. Email notification to syndic
            // Find syndic email: ManagerId is a Keycloak userId — look for an owner with that userId
            string? syndicEmail = null;
            Guid? syndicUserId = coproperty.ManagerId;

            if (syndicUserId.HasValue)
            {
                var syndicOwner = await context.Owners
                    .FirstOrDefaultAsync(o => o.UserId == syndicUserId.Value);
                syndicEmail = syndicOwner?.Email;
            }

            if (!string.IsNullOrEmpty(syndicEmail))
            {
                await _emailPublisher.PublishAsync(new EmailMessage
                {
                    To = syndicEmail,
                    Subject = $"Paiement reçu — {ownerName} ({input.Amount:N3} DT)",
                    HtmlBody = $@"
                        <div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;'>
                            <h2 style='color:#198754;'>💰 Nouveau paiement reçu</h2>
                            <p>Un copropriétaire a soumis un justificatif de paiement.</p>
                            <table style='width:100%;border-collapse:collapse;margin:15px 0;'>
                                <tr><td style='padding:8px;border:1px solid #ddd;font-weight:bold;'>Copropriété</td><td style='padding:8px;border:1px solid #ddd;'>{coproperty.Name}</td></tr>
                                <tr><td style='padding:8px;border:1px solid #ddd;font-weight:bold;'>Propriétaire</td><td style='padding:8px;border:1px solid #ddd;'>{ownerName}</td></tr>
                                <tr><td style='padding:8px;border:1px solid #ddd;font-weight:bold;'>Montant versé</td><td style='padding:8px;border:1px solid #ddd;color:#198754;font-weight:bold;'>{input.Amount:N3} DT</td></tr>
                                <tr><td style='padding:8px;border:1px solid #ddd;font-weight:bold;'>Mode de paiement</td><td style='padding:8px;border:1px solid #ddd;'>{input.PaymentMethod ?? "-"}</td></tr>
                                <tr><td style='padding:8px;border:1px solid #ddd;font-weight:bold;'>Référence</td><td style='padding:8px;border:1px solid #ddd;'>{input.Justificatif ?? "-"}</td></tr>
                                <tr><td style='padding:8px;border:1px solid #ddd;font-weight:bold;'>Appel de fonds</td><td style='padding:8px;border:1px solid #ddd;'>{fundCall.Description ?? "Appel de fonds"}</td></tr>
                                <tr><td style='padding:8px;border:1px solid #ddd;font-weight:bold;'>Montant total</td><td style='padding:8px;border:1px solid #ddd;'>{fundCall.Amount:N3} DT</td></tr>
                                <tr style='background:#f8f9fa;'><td style='padding:8px;border:1px solid #ddd;font-weight:bold;'>Statut</td><td style='padding:8px;border:1px solid #ddd;font-weight:bold;'>{statusText}</td></tr>
                            </table>
                            <p style='color:#6c757d;font-size:12px;margin-top:20px;'>
                                Connectez-vous à votre espace syndic pour valider ce paiement.<br/>
                                Cordialement, L'équipe MYB
                            </p>
                        </div>",
                    Source = "coproperty-payment"
                });
            }

            // 2. Real-time notification via notification service
            if (syndicUserId.HasValue && owner != null)
            {
                try
                {
                    var httpClient = _httpClientFactory.CreateClient("NotificationService");
                    var notificationPayload = new
                    {
                        senderId = owner.UserId.ToString(),
                        receiverId = syndicUserId.Value.ToString(),
                        message = $"💰 Paiement reçu : {ownerName} a versé {input.Amount:N3} DT ({input.PaymentMethod ?? "Virement"}) pour \"{fundCall.Description ?? "Appel de fonds"}\". {statusText}"
                    };
                    var content = new System.Net.Http.StringContent(
                        System.Text.Json.JsonSerializer.Serialize(notificationPayload),
                        System.Text.Encoding.UTF8,
                        "application/json");
                    await httpClient.PostAsync("/api/Notifications", content);
                }
                catch
                {
                    // Non-blocking: real-time notification failure should not break payment flow
                }
            }
        }
        catch (Exception ex)
        {
            // Non-blocking: notification failure should never break the payment
            Console.Error.WriteLine($"Failed to notify syndic about payment: {ex.Message}");
        }
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
