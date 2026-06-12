using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;
using Myb.Coproperty.Models.Dtos;
using Myb.Common.Messaging;
using Myb.Common.Messaging.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

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
    Task<FundCallPayment> ReviewPaymentAsync(Guid paymentId, bool approved, string? rejectionReason, string userId);
    Task<List<FundCallPayment>> GetPaymentsByOwnerUserIdAsync(Guid ownerUserId);
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
    private readonly IKeycloakAdminService _keycloakAdminService;
    private readonly string _frontendUrl;

    public FundCallService(
        IDbContextFactory<CopropertyDbContext> contextFactory,
        IEmailPublisher emailPublisher,
        IHttpClientFactory httpClientFactory,
        IKeycloakAdminService keycloakAdminService,
        IConfiguration configuration)
    {
        _contextFactory = contextFactory;
        _emailPublisher = emailPublisher;
        _httpClientFactory = httpClientFactory;
        _keycloakAdminService = keycloakAdminService;
        _frontendUrl = configuration["Services:FrontendUrl"] ?? "https://myb-platform.com";
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

            // Also notify the owner that the fund call has been updated
            if (input.OwnerId.HasValue)
            {
                var snapshotOwnerId = input.OwnerId.Value;
                var snapshotAmount = existingFundCall.Amount;
                var snapshotDescription = existingFundCall.Description;
                var snapshotDueDate = existingFundCall.DueDate;
                _ = Task.Run(async () =>
                {
                    try { await SendFundCallEmailToOwner(snapshotOwnerId, snapshotAmount, snapshotDescription, snapshotDueDate); }
                    catch (Exception ex) { Console.Error.WriteLine($"[FundCallEmail] Background email failed: {ex.GetType().Name}: {ex.Message}"); }
                });
            }

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
            var snapshotOwnerId = input.OwnerId.Value;
            var snapshotAmount = fundCall.Amount;
            var snapshotDescription = fundCall.Description;
            var snapshotDueDate = fundCall.DueDate;
            _ = Task.Run(async () =>
            {
                try { await SendFundCallEmailToOwner(snapshotOwnerId, snapshotAmount, snapshotDescription, snapshotDueDate); }
                catch (Exception ex) { Console.Error.WriteLine($"[FundCallEmail] Background email failed: {ex.GetType().Name}: {ex.Message}"); }
            });
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

        // Find the Keycloak UserId for this owner, then collect ALL owner records
        // linked to the same Keycloak user (handles duplicate owner records and
        // cases where the fund call was created under a different owner record for
        // the same physical person).
        var owner = await context.Owners.FindAsync(ownerId);
        if (owner == null) return new List<FundCall>();

        var allOwnerIds = await context.Owners
            .Where(o => o.UserId == owner.UserId)
            .Select(o => o.Id)
            .ToListAsync();

        return await context.FundCalls
            .Where(f => f.OwnerId.HasValue && allOwnerIds.Contains(f.OwnerId.Value) && f.IsActive)
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
                $"Le montant du versement ({input.Amount:N3}) dépasse le reste à payer ({remaining:N3}). Montant maximum autorisé: {remaining:N3}.");

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

        // Set status to PendingValidation — the syndic must review and approve the payment
        // before the fund call is marked as Paid.
        fundCall.Status = FundCallStatus.PendingValidation;
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

                // Calculate the starting sequence number ONCE before the loop to avoid
                // duplicate InvoiceNumber when multiple invoices are created in the same
                // transaction (EF hasn't flushed yet so CountAsync returns the same value
                // on every iteration, causing a unique constraint violation).
                var invoiceSeqBase = await context.CopropertyInvoices
                    .CountAsync(i => i.CopropertyId == fundCall.CopropertyId);
                var invoiceSeqCounter = invoiceSeqBase;

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
                        // Increment counter for each new invoice to guarantee unique InvoiceNumber
                        invoiceSeqCounter++;
                        var receipt = new CopropertyInvoice
                        {
                            Id = Guid.NewGuid(),
                            CopropertyId = fundCall.CopropertyId,
                            ChargeId = dist.ChargeId,
                            UnitId = dist.UnitId,
                            OwnerId = effectiveOwnerId.Value,
                            InvoiceNumber = $"PAY-{invoiceSeqCounter:D4}-{unitNumber}",
                            Amount = payAmount,
                            TaxAmount = 0,
                            TotalAmount = payAmount,
                            InvoiceDate = input.PaymentDate,
                            DueDate = input.PaymentDate,
                            Status = dist.PaymentStatus == ChargePaymentStatus.Paid
                                ? InvoiceStatus.Paid : InvoiceStatus.PartiallyPaid,
                            PaidDate = input.PaymentDate,
                            PaymentMethod = input.PaymentMethod ?? "Virement",
                            Description = $"Appel de fonds - {chargeName} - Lot {unitNumber}",
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
                    invoiceSeqCounter++;
                    var receipt = new CopropertyInvoice
                    {
                        Id = Guid.NewGuid(),
                        CopropertyId = fundCall.CopropertyId,
                        UnitId = ownerUnit?.Id ?? Guid.Empty,
                        OwnerId = effectiveOwnerId.Value,
                        InvoiceNumber = $"PAY-{invoiceSeqCounter:D4}-{unitNumber}",
                        Amount = input.Amount,
                        TaxAmount = 0,
                        TotalAmount = input.Amount,
                        InvoiceDate = input.PaymentDate,
                        DueDate = input.PaymentDate,
                        Status = InvoiceStatus.Paid,
                        PaidDate = input.PaymentDate,
                        PaymentMethod = input.PaymentMethod ?? "Virement",
                        Description = $"Appel de fonds - {fundCall.Description} - Lot {unitNumber}",
                        Notes = input.Justificatif ?? $"FC-{fundCallId}",
                        CreatedAt = DateTime.UtcNow,
                        CreatedBy = payingUserGuid
                    };
                    context.CopropertyInvoices.Add(receipt);
                }
            }
        }

        await context.SaveChangesAsync();

        // Fire-and-forget: notification must never block or deadlock the mutation.
        // Capture only primitive values so the closed-over state is independent of the EF context.
        var snapshotFundCallId = fundCall.Id;
        var snapshotCopropertyId = fundCall.CopropertyId;
        var snapshotOwnerId = fundCall.OwnerId;
        var snapshotFundCallAmount = fundCall.Amount;
        var snapshotDescription = fundCall.Description;
        var snapshotPaymentAmount = input.Amount;
        var snapshotPaymentDate = input.PaymentDate;
        var snapshotPaymentMethod = input.PaymentMethod;
        var snapshotJustificatif = input.Justificatif;
        _ = Task.Run(async () =>
        {
            try
            {
                await NotifySyndicPaymentReceived(
                    snapshotFundCallId, snapshotCopropertyId, snapshotOwnerId,
                    snapshotFundCallAmount, snapshotDescription,
                    snapshotPaymentAmount, snapshotPaymentDate,
                    snapshotPaymentMethod, snapshotJustificatif);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[NotifySyndic] Background task failed: {ex.GetType().Name}: {ex.Message}");
            }
        });

        return payment;
    }

    /// <summary>
    /// Sends email and real-time notification to the syndic when an owner submits a payment.
    /// Runs in the background — must never block the mutation response.
    /// </summary>
    private async Task NotifySyndicPaymentReceived(
        Guid fundCallId,
        Guid copropertyId,
        Guid? ownerId,
        decimal fundCallAmount,
        string? fundCallDescription,
        decimal paymentAmount,
        DateTime paymentDate,
        string? paymentMethod,
        string? justificatif)
    {
        try
        {
            using var context = _contextFactory.CreateDbContext();

            var coproperty = await context.Coproperties.FindAsync(copropertyId);
            if (coproperty == null) return;

            var owner = ownerId.HasValue
                ? await context.Owners.FindAsync(ownerId.Value)
                : null;
            var ownerName = owner != null ? $"{owner.FirstName} {owner.LastName}" : "Propriétaire inconnu";

            // Sum all payments already in the DB (the new payment is committed at this point)
            var totalPaid = await context.FundCallPayments
                .Where(p => p.FundCallId == fundCallId)
                .SumAsync(p => p.Amount);
            var remaining = fundCallAmount - totalPaid;
            var isPaidInFull = remaining <= 0;
            var statusText = isPaidInFull ? "ENTIÈREMENT RÉGLÉ" : $"Reste à payer : {remaining:N2}";
            var statusColor = isPaidInFull ? "#16a34a" : "#d97706";
            var statusBg = isPaidInFull ? "#dcfce7" : "#fef3c7";
            var fundCallUrl = $"{_frontendUrl}/admin/coproperty/syndic/fund-calls";

            // 1. Email notification to syndic
            // Resolution order (stop as soon as an email is found):
            //   A) ManagerId set  → look up owner record by Keycloak UserId in Owners table
            //   B) ManagerId set, A failed → fetch email directly from Keycloak (syndic may not be in Owners table)
            //   C) ManagerId unset → last-resort name match in Owners table via ManagerName
            string? syndicEmail = null;
            Guid? syndicUserId = coproperty.ManagerId;

            // Strategy A: ManagerId known → try the Owners table first (fast path)
            if (syndicUserId.HasValue)
            {
                var syndicOwner = await context.Owners
                    .FirstOrDefaultAsync(o => o.UserId == syndicUserId.Value);
                syndicEmail = syndicOwner?.Email;
            }

            // Strategy B: ManagerId known but not in Owners table → ask Keycloak
            // (covers the common case where the syndic is a manager account, not an owner)
            if (string.IsNullOrEmpty(syndicEmail) && syndicUserId.HasValue)
            {
                var keycloakUser = await _keycloakAdminService.GetUserByIdAsync(syndicUserId.Value.ToString());
                if (keycloakUser != null && !string.IsNullOrEmpty(keycloakUser.Email))
                {
                    syndicEmail = keycloakUser.Email;
                    Console.Error.WriteLine($"[NotifySyndic] Resolved syndic email from Keycloak: {syndicEmail}");
                }
            }

            // Strategy C: ManagerId not set → fall back to name-matching in Owners table
            // Only used when no ManagerId is available to avoid matching the wrong person.
            if (string.IsNullOrEmpty(syndicEmail) && !syndicUserId.HasValue && !string.IsNullOrWhiteSpace(coproperty.ManagerName))
            {
                var parts = coproperty.ManagerName.Trim().Split(' ', 2);
                var firstName = parts[0];
                var lastName = parts.Length > 1 ? parts[1] : "";
                var syndicByName = await context.Owners.FirstOrDefaultAsync(o =>
                    o.FirstName.ToLower() == firstName.ToLower() &&
                    o.LastName.ToLower() == lastName.ToLower());
                if (syndicByName != null)
                {
                    syndicEmail = syndicByName.Email;
                    syndicUserId ??= syndicByName.UserId;
                }
            }

            Console.Error.WriteLine($"[NotifySyndic] ManagerId={coproperty.ManagerId}, syndicEmail={syndicEmail ?? "NULL"}");


            if (!string.IsNullOrEmpty(syndicEmail))
            {
                var paymentDateStr = paymentDate.ToString("dd/MM/yyyy");
                var htmlBody = $@"<!DOCTYPE html>
<html lang='fr'>
<head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1.0'>
<title>Paiement reçu</title></head>
<body style='margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;'>
  <table width='100%' cellpadding='0' cellspacing='0' style='background:#f4f6f9;padding:32px 0;'>
    <tr><td align='center'>
      <table width='600' cellpadding='0' cellspacing='0' style='max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);'>

        <!-- HEADER -->
        <tr>
          <td style='background:linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 100%);padding:32px 40px;text-align:center;'>
            <h1 style='color:#ffffff;margin:0;font-size:24px;font-weight:700;letter-spacing:-0.5px;'>MYB Copropriété</h1>
            <p style='color:#bfdbfe;margin:8px 0 0;font-size:14px;'>Gestion de votre copropriété</p>
          </td>
        </tr>

        <!-- BANNER -->
        <tr>
          <td style='background:#22c55e;padding:14px 40px;text-align:center;'>
            <p style='color:#ffffff;margin:0;font-size:18px;font-weight:700;'>💰 Nouveau paiement reçu</p>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style='padding:32px 40px;'>
            <p style='color:#374151;font-size:15px;margin:0 0 24px;'>
              Un paiement vient d'être soumis pour l'appel de fonds de la copropriété
              <strong>{System.Net.WebUtility.HtmlEncode(coproperty.Name)}</strong>.
              Veuillez vérifier et valider ce paiement dans votre espace syndic.
            </p>

            <!-- DETAILS TABLE -->
            <table width='100%' cellpadding='0' cellspacing='0' style='border-collapse:collapse;margin-bottom:24px;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;'>
              <thead>
                <tr style='background:#f9fafb;'>
                  <th colspan='2' style='padding:12px 16px;text-align:left;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #e5e7eb;'>Détails du paiement</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style='padding:12px 16px;color:#6b7280;font-size:14px;border-bottom:1px solid #f3f4f6;width:45%;'>Copropriété</td>
                  <td style='padding:12px 16px;color:#111827;font-size:14px;font-weight:600;border-bottom:1px solid #f3f4f6;'>{System.Net.WebUtility.HtmlEncode(coproperty.Name)}</td>
                </tr>
                <tr style='background:#fafafa;'>
                  <td style='padding:12px 16px;color:#6b7280;font-size:14px;border-bottom:1px solid #f3f4f6;'>Propriétaire</td>
                  <td style='padding:12px 16px;color:#111827;font-size:14px;font-weight:600;border-bottom:1px solid #f3f4f6;'>{System.Net.WebUtility.HtmlEncode(ownerName)}</td>
                </tr>
                <tr>
                  <td style='padding:12px 16px;color:#6b7280;font-size:14px;border-bottom:1px solid #f3f4f6;'>Appel de fonds</td>
                  <td style='padding:12px 16px;color:#111827;font-size:14px;border-bottom:1px solid #f3f4f6;'>{System.Net.WebUtility.HtmlEncode(fundCallDescription ?? "Appel de fonds")}</td>
                </tr>
                <tr style='background:#fafafa;'>
                  <td style='padding:12px 16px;color:#6b7280;font-size:14px;border-bottom:1px solid #f3f4f6;'>Date de paiement</td>
                  <td style='padding:12px 16px;color:#111827;font-size:14px;border-bottom:1px solid #f3f4f6;'>{paymentDateStr}</td>
                </tr>
                <tr>
                  <td style='padding:12px 16px;color:#6b7280;font-size:14px;border-bottom:1px solid #f3f4f6;'>Montant versé</td>
                  <td style='padding:12px 16px;color:#16a34a;font-size:16px;font-weight:700;border-bottom:1px solid #f3f4f6;'>{paymentAmount:N2}</td>
                </tr>
                <tr style='background:#fafafa;'>
                  <td style='padding:12px 16px;color:#6b7280;font-size:14px;border-bottom:1px solid #f3f4f6;'>Mode de paiement</td>
                  <td style='padding:12px 16px;color:#111827;font-size:14px;border-bottom:1px solid #f3f4f6;'>{System.Net.WebUtility.HtmlEncode(paymentMethod ?? "-")}</td>
                </tr>
                <tr>
                  <td style='padding:12px 16px;color:#6b7280;font-size:14px;border-bottom:1px solid #f3f4f6;'>Référence / Justificatif</td>
                  <td style='padding:12px 16px;color:#111827;font-size:14px;border-bottom:1px solid #f3f4f6;'>{System.Net.WebUtility.HtmlEncode(justificatif ?? "-")}</td>
                </tr>
                <tr style='background:#fafafa;'>
                  <td style='padding:12px 16px;color:#6b7280;font-size:14px;border-bottom:1px solid #f3f4f6;'>Montant total appel</td>
                  <td style='padding:12px 16px;color:#111827;font-size:14px;border-bottom:1px solid #f3f4f6;'>{fundCallAmount:N2}</td>
                </tr>
                <tr>
                  <td style='padding:12px 16px;color:#6b7280;font-size:14px;border-bottom:1px solid #f3f4f6;'>Total déjà payé</td>
                  <td style='padding:12px 16px;color:#111827;font-size:14px;font-weight:600;border-bottom:1px solid #f3f4f6;'>{totalPaid:N2}</td>
                </tr>
                <tr style='background:{statusBg};'>
                  <td style='padding:12px 16px;color:#374151;font-size:14px;font-weight:600;'>Statut</td>
                  <td style='padding:12px 16px;'>
                    <span style='display:inline-block;padding:4px 12px;background:{statusBg};color:{statusColor};border:1px solid {statusColor};border-radius:20px;font-size:13px;font-weight:700;'>
                      {statusText}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- CTA BUTTON -->
            <table width='100%' cellpadding='0' cellspacing='0' style='margin:28px 0;'>
              <tr>
                <td align='center'>
                  <a href='{fundCallUrl}'
                     target='_blank'
                     style='display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#1e3a8a,#1d4ed8);color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:700;letter-spacing:0.02em;box-shadow:0 4px 12px rgba(29,78,216,0.35);'>
                    Voir les appels de fonds
                  </a>
                </td>
              </tr>
              <tr>
                <td align='center' style='padding-top:10px;'>
                  <p style='color:#9ca3af;font-size:12px;margin:0;'>Ou copiez ce lien : <a href='{fundCallUrl}' style='color:#1d4ed8;word-break:break-all;'>{fundCallUrl}</a></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style='background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;'>
            <p style='color:#9ca3af;font-size:12px;margin:0 0 4px;'>Cet email a été envoyé automatiquement par la plateforme MYB Copropriété.</p>
            <p style='color:#9ca3af;font-size:12px;margin:0;'>Ne pas répondre à cet email. Pour toute question, connectez-vous à votre espace syndic.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body></html>";

                await _emailPublisher.PublishAsync(new EmailMessage
                {
                    To = syndicEmail,
                    Subject = $"[MYB] Paiement reçu — {ownerName} | {coproperty.Name} ({paymentAmount:N2})",
                    HtmlBody = htmlBody,
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
                        message = $"💰 Paiement reçu : {ownerName} a versé {paymentAmount:N2} ({paymentMethod ?? "Virement"}) pour \"{fundCallDescription ?? "Appel de fonds"}\". {statusText}"
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
            Console.Error.WriteLine($"[NotifySyndic] Failed to notify syndic about payment: {ex.GetType().Name}: {ex.Message}\n{ex.StackTrace}");
        }
    }

    public async Task<List<FundCallPayment>> GetPaymentsByOwnerUserIdAsync(Guid ownerUserId)
    {
        using var context = _contextFactory.CreateDbContext();

        var ownerIds = await context.Owners
            .Where(o => o.UserId == ownerUserId)
            .Select(o => o.Id)
            .ToListAsync();

        if (!ownerIds.Any()) return new List<FundCallPayment>();

        return await context.FundCallPayments
            .Include(p => p.FundCall)
                .ThenInclude(f => f.Coproperty)
            .Where(p => p.FundCall != null
                        && p.FundCall.OwnerId.HasValue
                        && ownerIds.Contains(p.FundCall.OwnerId.Value))
            .OrderByDescending(p => p.PaymentDate)
            .ToListAsync();
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

    /// <summary>
    /// Sends a fund call notification email to the owner (fire-and-forget helper).
    /// </summary>
    private async Task SendFundCallEmailToOwner(Guid ownerId, decimal amount, string? description, DateTime dueDate)
    {
        using var context = _contextFactory.CreateDbContext();
        var owner = await context.Owners.FindAsync(ownerId);
        if (owner == null || string.IsNullOrEmpty(owner.Email))
        {
            Console.Error.WriteLine($"[FundCallEmail] Owner {ownerId} not found or has no email.");
            return;
        }

        var fundCallUrl = $"{_frontendUrl}/coproperty/owner/charges";
        await _emailPublisher.PublishAsync(new EmailMessage
        {
            To = owner.Email,
            Subject = $"Nouvel appel de fonds – {description}",
            HtmlBody = $"""
                <html><body style="font-family:Arial,sans-serif;color:#333">
                  <h2 style="color:#2c5282">Nouvel appel de fonds</h2>
                  <p>Bonjour {owner.FirstName} {owner.LastName},</p>
                  <p>Un nouvel appel de fonds a été émis pour votre copropriété.</p>
                  <table style="border-collapse:collapse;margin:16px 0">
                    <tr><td style="padding:4px 12px 4px 0"><strong>Description :</strong></td><td>{description}</td></tr>
                    <tr><td style="padding:4px 12px 4px 0"><strong>Montant :</strong></td><td>{amount:N2} €</td></tr>
                    <tr><td style="padding:4px 12px 4px 0"><strong>Date d'échéance :</strong></td><td>{dueDate:dd/MM/yyyy}</td></tr>
                  </table>
                  <p style="margin:24px 0">
                    <a href="{fundCallUrl}" style="background:#2c5282;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Consulter mes appels de fonds</a>
                  </p>
                  <hr/>
                  <p style="font-size:12px;color:#888">MYB – Gestion de copropriété</p>
                </body></html>
                """,
            Source = "coproperty-service"
        });
    }

    /// <summary>
    /// Allows the syndic to approve or reject an owner's payment submission.
    /// - Approved: fund call status → Paid (if total covered) or back to ToPay (partial).
    /// - Rejected: payment ValidationStatus → Rejected, fund call status → ToPay, owner notified.
    /// </summary>
    public async Task<FundCallPayment> ReviewPaymentAsync(Guid paymentId, bool approved, string? rejectionReason, string userId)
    {
        using var context = _contextFactory.CreateDbContext();

        var payment = await context.FundCallPayments
            .Include(p => p.FundCall)
            .ThenInclude(f => f.Payments)
            .FirstOrDefaultAsync(p => p.Id == paymentId);

        if (payment == null)
            throw new InvalidOperationException($"Payment with ID {paymentId} not found");

        if (approved)
        {
            payment.ValidationStatus = "Approved";
            payment.RejectionReason = null;

            // Calculate total of all approved payments (including this one)
            var approvedTotal = payment.FundCall.Payments
                .Where(p => p.Id == paymentId || p.ValidationStatus == "Approved")
                .Sum(p => p.Amount);

            payment.FundCall.Status = approvedTotal >= payment.FundCall.Amount
                ? FundCallStatus.Paid
                : FundCallStatus.ToPay;
        }
        else
        {
            payment.ValidationStatus = "Rejected";
            payment.RejectionReason = rejectionReason;

            // If the fund call was waiting on this payment, revert to ToPay
            if (payment.FundCall.Status == FundCallStatus.PendingValidation)
                payment.FundCall.Status = FundCallStatus.ToPay;
        }

        payment.FundCall.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();

        // Notify the owner of the review decision (fire-and-forget)
        var snapshotOwnerId = payment.FundCall.OwnerId;
        var snapshotAmount = payment.Amount;
        var snapshotDescription = payment.FundCall.Description;
        var snapshotDueDate = payment.FundCall.DueDate;
        var snapshotApproved = approved;
        var snapshotRejectionReason = rejectionReason;
        _ = Task.Run(async () =>
        {
            try
            {
                await NotifyOwnerPaymentReview(
                    snapshotOwnerId, snapshotAmount, snapshotDescription,
                    snapshotDueDate, snapshotApproved, snapshotRejectionReason);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[ReviewPayment] Notification failed: {ex.GetType().Name}: {ex.Message}");
            }
        });

        return payment;
    }

    /// <summary>
    /// Sends an email to the owner informing them whether their payment was approved or rejected.
    /// </summary>
    private async Task NotifyOwnerPaymentReview(
        Guid? ownerId, decimal amount, string? description,
        DateTime dueDate, bool approved, string? rejectionReason)
    {
        if (!ownerId.HasValue) return;

        using var context = _contextFactory.CreateDbContext();
        var owner = await context.Owners.FindAsync(ownerId.Value);
        if (owner == null || string.IsNullOrEmpty(owner.Email)) return;

        var fundCallUrl = $"{_frontendUrl}/coproperty/owner/charges";
        string subject, statusBanner, bodyContent;

        if (approved)
        {
            subject = $"Paiement validé – {description}";
            statusBanner = """<td style="background:#22c55e;padding:14px 40px;text-align:center;"><p style="color:#fff;margin:0;font-size:18px;font-weight:700;">✅ Votre paiement a été validé</p></td>""";
            bodyContent = $"""<p>Votre paiement de <strong>{amount:N2} €</strong> pour l'appel de fonds <strong>{description}</strong> a été <strong style="color:#16a34a">validé</strong> par le syndic.</p>""";
        }
        else
        {
            subject = $"Paiement refusé – {description}";
            statusBanner = """<td style="background:#ef4444;padding:14px 40px;text-align:center;"><p style="color:#fff;margin:0;font-size:18px;font-weight:700;">❌ Votre paiement a été refusé</p></td>""";
            var reasonHtml = string.IsNullOrEmpty(rejectionReason)
                ? ""
                : $"""<p style="margin:12px 0;padding:12px 16px;background:#fef2f2;border-left:4px solid #ef4444;border-radius:4px;color:#991b1b;"><strong>Motif :</strong> {System.Net.WebUtility.HtmlEncode(rejectionReason)}</p>""";
            bodyContent = $"""
                <p>Votre paiement de <strong>{amount:N2} €</strong> pour l'appel de fonds <strong>{description}</strong> a été <strong style="color:#dc2626">refusé</strong> par le syndic.</p>
                {reasonHtml}
                <p>Veuillez soumettre un nouveau justificatif ou contacter votre syndic pour régulariser la situation.</p>
                """;
        }

        await _emailPublisher.PublishAsync(new EmailMessage
        {
            To = owner.Email,
            Subject = $"[MYB] {subject}",
            HtmlBody = $"""
                <html><body style="font-family:Arial,sans-serif;color:#333;background:#f4f6f9;margin:0;padding:32px 0;">
                  <table width="600" style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.08);">
                    <tr><td style="background:linear-gradient(135deg,#1e3a8a,#1d4ed8);padding:32px 40px;text-align:center;">
                      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">MYB Copropriété</h1>
                    </td></tr>
                    <tr>{statusBanner}</tr>
                    <tr><td style="padding:32px 40px;">
                      <p>Bonjour {owner.FirstName} {owner.LastName},</p>
                      {bodyContent}
                      <p style="margin:24px 0">
                        <a href="{fundCallUrl}" style="background:#2c5282;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Voir mes appels de fonds</a>
                      </p>
                    </td></tr>
                    <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 40px;text-align:center;">
                      <p style="color:#9ca3af;font-size:12px;margin:0;">MYB – Gestion de copropriété</p>
                    </td></tr>
                  </table>
                </body></html>
                """,
            Source = "coproperty-service"
        });
    }
}
