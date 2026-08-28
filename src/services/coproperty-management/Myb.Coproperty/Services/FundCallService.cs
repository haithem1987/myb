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
    Task DeleteAsync(Guid id, string userId);
    Task<FundCall> CancelAsync(Guid id, string userId, string? reason);

    /// <summary>
    /// Returns a French human-readable reason if the fund call cannot be
    /// hard-deleted; null if it can. Used both by the GraphQL resolver
    /// (server-side guard) and the UI to render the delete confirmation
    /// modal only when allowed.
    /// </summary>
    string? EvaluateDeleteBlocker(FundCall fundCall);

    /// <summary>
    /// Boolean wrapper around <see cref="EvaluateDeleteBlocker"/>. Exposed
    /// on the GraphQL schema as the `deletable` field of a FundCall.
    /// </summary>
    bool CanDelete(FundCall fundCall);

    Task<FundCall?> GetByIdAsync(Guid id);
    Task<List<FundCall>> GetByCopropertyIdAsync(Guid copropertyId, Guid? ownerId = null, int? year = null);
    Task<List<FundCall>> GetAllAsync();
    Task<List<FundCall>> GetByOwnerIdAsync(Guid ownerId);
    Task<FundCallPayment> AddPaymentAsync(Guid fundCallId, AddFundCallPaymentInput input, string userId);
    Task<FundCallPayment> ReviewPaymentAsync(Guid paymentId, bool approved, string? rejectionReason, string userId);
    Task<List<FundCallPayment>> GetPaymentsByOwnerUserIdAsync(Guid ownerUserId);
    Task<List<CopropertyInvoice>> GenerateInvoicesFromFundCallAsync(Guid fundCallId, string userId);
    Task<Dictionary<Guid, decimal>> GetExistingFundCallTotalsByOwnerAsync(Guid copropertyId);

    /// <summary>List of audit-log entries for a given fund call, newest first.
    /// NOTE: this method is intentionally NOT exposed in the GraphQL schema
    /// (and is therefore not in IFundCallService) because the FundCallAuditLog
    /// entity references a new enum (FundCallAuditAction) that Hot Chocolate 12
    /// cannot resolve in some configurations — surfacing as
    /// "Unable to infer or resolve a schema type from the type reference
    /// IValueNode (Input)" at schema build time. The audit log is kept in the
    /// database for compliance and is queried via a non-GraphQL service
    /// (see AuditLogService) or via direct DB access from admin tooling.
    /// </summary>
}

/// <summary>
/// Separate service for reading the audit log outside the GraphQL pipeline.
/// The audit log is intentionally not part of IFundCallService to keep the
/// GraphQL schema clean of types that Hot Chocolate 12 cannot reliably
/// resolve (see note on GetAuditLogAsync above).
/// </summary>
public interface IFundCallAuditLogService
{
    Task<List<FundCallAuditLog>> GetForFundCallAsync(Guid fundCallId);
}

public class FundCallAuditLogService : IFundCallAuditLogService
{
    private readonly IDbContextFactory<CopropertyDbContext> _contextFactory;
    public FundCallAuditLogService(IDbContextFactory<CopropertyDbContext> contextFactory)
    {
        _contextFactory = contextFactory;
    }

    public async Task<List<FundCallAuditLog>> GetForFundCallAsync(Guid fundCallId)
    {
        using var context = _contextFactory.CreateDbContext();
        return await context.FundCallAuditLogs
            .Where(a => a.FundCallId == fundCallId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();
    }
}

/// <summary>
/// Service implementation for fund call operations
/// </summary>
public class FundCallService : IFundCallService
{
    private const string PaidFundCallReadOnlyMessage =
        "Un appel de fonds réglé est en lecture seule et ne peut plus être modifié.";

    private static void EnsureNotPaid(FundCall fundCall)
    {
        if (fundCall.Status == FundCallStatus.Paid)
            throw new InvalidOperationException(PaidFundCallReadOnlyMessage);
    }

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

    /// <summary>
    /// Grace period (in days) during which a true draft can still be hard-deleted.
    /// After this window the fund call is presumed to have been seen by an owner
    /// and the user is forced into the cancellation workflow (FRS-FCF-LCM-2026-001 §2.1).
    /// </summary>
    private const int DraftDeletionGraceDays = 30;

    /// <summary>
    /// Returns a French human-readable reason if the fund call cannot be
    /// hard-deleted; null if it can. Evaluated server-side AND in the GraphQL
    /// schema to make the rule a single source of truth.
    /// </summary>
    public string? EvaluateDeleteBlocker(FundCall fundCall)
    {
        if (fundCall.Status == FundCallStatus.Cancelled)
            return "Impossible de supprimer un appel de fonds annulé. Il est conservé pour la traçabilité.";

        if (fundCall.Status != FundCallStatus.ToPay)
            return "Impossible de supprimer un appel de fonds publié ou traité. Utilisez l'annulation à la place.";

        if (fundCall.Payments != null && fundCall.Payments.Count > 0)
            return "Impossible de supprimer un appel de fonds ayant des versements. Utilisez l'annulation à la place.";

        if (fundCall.Invoices != null && fundCall.Invoices.Count > 0)
            return "Impossible de supprimer un appel de fonds ayant des factures associées. Utilisez l'annulation à la place.";

        if (fundCall.CreatedAt.HasValue
            && fundCall.CreatedAt.Value < DateTime.UtcNow.AddDays(-DraftDeletionGraceDays))
        {
            return $"Impossible de supprimer un appel de fonds créé il y a plus de {DraftDeletionGraceDays} jours. Utilisez l'annulation à la place.";
        }

        return null;
    }

    /// <summary>
    /// Backwards-compatible boolean wrapper around <see cref="EvaluateDeleteBlocker"/>.
    /// </summary>
    public bool CanDelete(FundCall fundCall) => EvaluateDeleteBlocker(fundCall) == null;

    /// <summary>
    /// Validates whether a fund call can transition to a given status.
    /// Prevents invalid downgrades (e.g., VALIDATED → PAID). A syndic may
    /// reactivate a cancelled fund call from the edit panel when cancellation
    /// was entered by mistake.
    /// </summary>
    public bool CanTransitionTo(FundCall fundCall, FundCallStatus targetStatus)
    {
        // VALIDATED → PAID transition is not allowed (downgrade risk)
        if (fundCall.Status == FundCallStatus.Validated && 
            targetStatus == FundCallStatus.Paid)
        {
            return false;
        }

        return true;
    }

    /// <summary>
    /// Generates a human-readable explanation of why a fund call cannot be deleted.
    /// Used for error messages in the UI.
    /// </summary>
    public string GetPublishReasons(FundCall fundCall)
    {
        var reasons = new List<string>();

        if (fundCall.Status == FundCallStatus.Cancelled)
            reasons.Add("il a déjà été annulé");
        else if (fundCall.Status == FundCallStatus.Paid)
            reasons.Add("le paiement a déjà été encaissé");
        else if (fundCall.Status == FundCallStatus.Validated)
            reasons.Add("l'appel de fonds a été validé");
        else if (fundCall.Status == FundCallStatus.PendingValidation)
            reasons.Add("un versement est en attente de validation");

        if ((fundCall.Payments?.Count ?? 0) > 0)
            reasons.Add("des versements sont associés");

        if (reasons.Count == 0)
            return "L'appel de fonds a été publié.";

        return "Cet appel de fonds ne peut pas être supprimé car " + string.Join(" et ", reasons) + ".";
    }

    public async Task<FundCall> CreateAsync(CreateFundCallInput input, string userId)
    {
        if (!input.CopropertyId.HasValue || input.CopropertyId.Value == Guid.Empty)
            throw new ArgumentException("CopropertyId is required to create a fund call");

        using var context = _contextFactory.CreateDbContext();

        // Verify coproperty exists and capture its name for historical snapshotting
        // (FundCall.CopropertyNameSnapshot survives even if the coproperty is later deleted).
        var coproperty = await context.Coproperties
            .FirstOrDefaultAsync(c => c.Id == input.CopropertyId.Value);

        if (coproperty == null)
            throw new ArgumentException($"Coproperty with ID {input.CopropertyId.Value} not found");

        string? ownerNameSnapshot = null;
        if (input.OwnerId.HasValue)
        {
            var snapshotOwner = await context.Owners.FirstOrDefaultAsync(o => o.Id == input.OwnerId.Value);
            if (snapshotOwner != null)
                ownerNameSnapshot = $"{snapshotOwner.FirstName} {snapshotOwner.LastName}".Trim();
        }

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
            EnsureNotPaid(existingFundCall);
            existingFundCall.Amount = input.Amount;
            existingFundCall.Description = input.Description;
            existingFundCall.Status = input.Status ?? existingFundCall.Status;
            existingFundCall.UpdatedAt = DateTime.UtcNow;
            existingFundCall.CopropertyNameSnapshot = coproperty.Name;
            existingFundCall.CurrencySnapshot = coproperty.Currency;
            if (ownerNameSnapshot != null)
                existingFundCall.OwnerNameSnapshot = ownerNameSnapshot;
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
                    try { await SendFundCallEmailToOwner(snapshotOwnerId, snapshotAmount, snapshotDescription, snapshotDueDate, coproperty.Currency); }
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
            UpdatedAt = DateTime.UtcNow,
            CopropertyNameSnapshot = coproperty.Name,
            OwnerNameSnapshot = ownerNameSnapshot,
            CurrencySnapshot = coproperty.Currency
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
                try { await SendFundCallEmailToOwner(snapshotOwnerId, snapshotAmount, snapshotDescription, snapshotDueDate, coproperty.Currency); }
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

        EnsureNotPaid(fundCall);

        var targetStatus = input.Status ?? fundCall.Status;
        if (!CanTransitionTo(fundCall, targetStatus))
        {
            throw new InvalidOperationException(
                $"La transition de statut de '{fundCall.Status}' vers '{targetStatus}' n'est pas autorisée.");
        }

        if (targetStatus != FundCallStatus.PendingValidation &&
            fundCall.Amount != input.Amount)
        {
            throw new InvalidOperationException(
                "Le montant d'un appel de fonds ne peut être modifié que lorsqu'il est en attente de validation.");
        }

        fundCall.Amount = input.Amount;
        fundCall.DueDate = input.DueDate;
        fundCall.Description = input.Description;
        fundCall.OwnerId = input.OwnerId;
        fundCall.Status = targetStatus;
        fundCall.IsActive = targetStatus != FundCallStatus.Cancelled;
        fundCall.UpdatedAt = DateTime.UtcNow;

        // Refresh historical snapshots so the displayed owner/coproperty name stays
        // accurate even if the related record is later deleted.
        if (input.OwnerId.HasValue)
        {
            var owner = await context.Owners.FirstOrDefaultAsync(o => o.Id == input.OwnerId.Value);
            if (owner != null)
                fundCall.OwnerNameSnapshot = $"{owner.FirstName} {owner.LastName}".Trim();
        }
        else
        {
            fundCall.OwnerNameSnapshot = null;
        }
        var snapshotCoproperty = await context.Coproperties
            .FirstOrDefaultAsync(c => c.Id == fundCall.CopropertyId);
        if (snapshotCoproperty != null)
        {
            fundCall.CopropertyNameSnapshot = snapshotCoproperty.Name;
            fundCall.CurrencySnapshot = snapshotCoproperty.Currency;
        }

        await context.SaveChangesAsync();

        return fundCall;
    }

    public async Task<FundCall> UpdateStatusAsync(Guid id, UpdateFundCallInput input, string userId)
    {
        using var context = _contextFactory.CreateDbContext();

        var fundCall = await context.FundCalls
            .Include(f => f.Payments)
            .FirstOrDefaultAsync(f => f.Id == id);

        if (fundCall == null)
            throw new InvalidOperationException($"FundCall with ID {id} not found");

        EnsureNotPaid(fundCall);

        // Validate the status transition
        if (!CanTransitionTo(fundCall, input.Status))
        {
            throw new InvalidOperationException(
                $"La transition de statut de '{fundCall.Status}' vers '{input.Status}' n'est pas autorisée.");
        }

        fundCall.Status = input.Status;
        fundCall.IsActive = input.Status != FundCallStatus.Cancelled;
        fundCall.UpdatedAt = DateTime.UtcNow;

        await context.SaveChangesAsync();

        return fundCall;
    }

    public async Task DeleteAsync(Guid id, string userId)
    {
        using var context = _contextFactory.CreateDbContext();

        var fundCall = await context.FundCalls
            .Include(f => f.Payments)
            .Include(f => f.Invoices)
            .FirstOrDefaultAsync(f => f.Id == id);

        if (fundCall == null)
            // Silently no-op: deleting a non-existent row is idempotent.
            return;

        // Single source of truth for the delete precondition (FRS-FCF-LCM-2026-001 §2.1).
        // EvaluateDeleteBlocker returns a French reason when the row cannot be deleted
        // so the GraphQL error message is already user-ready.
        var blocker = EvaluateDeleteBlocker(fundCall);
        if (blocker != null)
            throw new InvalidOperationException(blocker);

        var previousStatus = fundCall.Status;
        var actorUserGuid = Guid.TryParse(userId, out var uid) ? uid : Guid.Empty;

        // Write the audit-log entry BEFORE removing the row so the FK is still valid
        // and the deletion itself remains traceable (FRS-FCF-LCM-2026-001 §2.4 / AC-23).
        context.FundCallAuditLogs.Add(new FundCallAuditLog
        {
            Id = Guid.NewGuid(),
            FundCallId = fundCall.Id,
            Action = FundCallAuditAction.Deleted,
            PreviousStatus = previousStatus,
            NewStatus = null,
            Reason = null,
            ActorUserId = actorUserGuid,
            CreatedAt = DateTime.UtcNow
        });

        context.FundCalls.Remove(fundCall);
        await context.SaveChangesAsync();
    }

    public async Task<FundCall> CancelAsync(Guid id, string userId, string? reason)
    {
        // Reason is mandatory for the cancel workflow (FRS-FCF-LCM-2026-001 §2.4).
        // The resolver layer is responsible for surfacing a clear GraphQL error
        // when missing; we still defend in depth here.
        if (string.IsNullOrWhiteSpace(reason) || reason.Trim().Length < 10)
            throw new InvalidOperationException(
                "Un motif d'annulation d'au moins 10 caractères est obligatoire.");

        using var context = _contextFactory.CreateDbContext();

        var fundCall = await context.FundCalls
            .Include(f => f.Payments)
            .Include(f => f.Invoices)
            .FirstOrDefaultAsync(f => f.Id == id);

        if (fundCall == null)
            // Fully qualified to disambiguate from GreenDonut.KeyNotFoundException
            // (re-exported by HotChocolate). System exception is the standard one
            // that ASP.NET surfaces as a 404.
            throw new System.Collections.Generic.KeyNotFoundException($"Appel de fonds {id} introuvable");

        // Idempotent: cancelling an already-cancelled fund call is a no-op
        // (FRS-FCF-LCM-2026-001 AC-06).
        if (fundCall.Status == FundCallStatus.Cancelled)
            return fundCall;

        EnsureNotPaid(fundCall);

        var previousStatus = fundCall.Status;
        var actorUserGuid = Guid.TryParse(userId, out var uid) ? uid : Guid.Empty;

        // Mark as cancelled and inactive so it cannot receive new payments.
        fundCall.Status = FundCallStatus.Cancelled;
        fundCall.IsActive = false;
        fundCall.UpdatedAt = DateTime.UtcNow;

        // Cascade: any invoice that has not been Paid is moved to Cancelled
        // (FRS-FCF-LCM-2026-001 §2.5). Paid invoices keep their status to
        // preserve the financial history.
        if (fundCall.Invoices != null)
        {
            foreach (var invoice in fundCall.Invoices)
            {
                if (invoice.Status != InvoiceStatus.Paid)
                    invoice.Status = InvoiceStatus.Cancelled;
            }
        }

        // Audit-log entry — written in the same SaveChanges so the audit
        // history is consistent with the data state.
        context.FundCallAuditLogs.Add(new FundCallAuditLog
        {
            Id = Guid.NewGuid(),
            FundCallId = fundCall.Id,
            Action = FundCallAuditAction.Cancelled,
            PreviousStatus = previousStatus,
            NewStatus = FundCallStatus.Cancelled,
            Reason = reason.Trim(),
            ActorUserId = actorUserGuid,
            CreatedAt = DateTime.UtcNow
        });

        await context.SaveChangesAsync();

        // Fire-and-forget: notify the affected owner (if any) that the fund
        // call was cancelled. Must never block or fail the mutation.
        _ = Task.Run(async () =>
        {
            try
            {
                await NotifyOwnerOfCancellation(fundCall.Id, reason.Trim());
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[CancelFundCall] Owner notification failed: {ex.GetType().Name}: {ex.Message}");
            }
        });

        return fundCall;
    }

    /// <summary>
    /// Sends a notification to the owner linked to a cancelled fund call.
    /// Best-effort, runs in a fire-and-forget task so the GraphQL response
    /// is never delayed by a flaky email/HTTP call.
    /// </summary>
    private async Task NotifyOwnerOfCancellation(Guid fundCallId, string reason)
    {
        using var context = _contextFactory.CreateDbContext();
        var fundCall = await context.FundCalls
            .Include(f => f.Owner)
            .FirstOrDefaultAsync(f => f.Id == fundCallId);
        if (fundCall == null) return;

        var ownerEmail = fundCall.Owner?.Email;
        if (string.IsNullOrWhiteSpace(ownerEmail)) return;

        var subject = $"Appel de fonds annulé – {fundCall.Description ?? "Appel de fonds"}";
        var body =
            $"Bonjour,\n\n" +
            $"L'appel de fonds « {fundCall.Description ?? "sans description"} » d'un montant de " +
            $"{FormatAmount(fundCall.Amount, fundCall.CurrencySnapshot)} a été annulé par votre syndic.\n\n" +
            $"Motif : {reason}\n\n" +
            $"Toute soumission de paiement en attente n'est plus applicable. Pour toute question, " +
            $"veuillez contacter votre gestionnaire.\n\n" +
            $"— MYB Plateforme";

        try
        {
            await _emailPublisher.PublishAsync(new EmailMessage
            {
                To = ownerEmail,
                Subject = subject,
                HtmlBody = body.Replace("\n", "<br>"),
                Source = "Myb.Coproperty.CancelFundCall"
            });
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[NotifyOwnerOfCancellation] PublishAsync failed: {ex.Message}");
        }
    }

    /// <summary>
    /// Returns the audit-log entries for a given fund call, newest first.
    /// Exposed via the GraphQL schema (FRS-FCF-LCM-2026-001 §2.4 / AC-24).
    /// </summary>
    public async Task<List<FundCallAuditLog>> GetAuditLogAsync(Guid fundCallId)
    {
        using var context = _contextFactory.CreateDbContext();
        return await context.FundCallAuditLogs
            .Where(a => a.FundCallId == fundCallId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();
    }

    public async Task<FundCall?> GetByIdAsync(Guid id)
    {
        using var context = _contextFactory.CreateDbContext();

        return await context.FundCalls
            .IgnoreQueryFilters()
            .Include(f => f.Coproperty)
            .Include(f => f.Owner)
            .Include(f => f.Invoices)
            .Include(f => f.Payments)
            .FirstOrDefaultAsync(f => f.Id == id);
    }

    public async Task<List<FundCall>> GetByCopropertyIdAsync(Guid copropertyId, Guid? ownerId = null, int? year = null)
    {
        using var context = _contextFactory.CreateDbContext();

        try
        {
            var query = context.FundCalls
                .IgnoreQueryFilters()
                .Where(f => f.CopropertyId == copropertyId)
                .AsQueryable();

            if (ownerId.HasValue)
                query = query.Where(f => f.OwnerId == ownerId.Value);

            if (year.HasValue)
                query = query.Where(f => f.DueDate.Year == year.Value);

            return await query
                .Include(f => f.Owner)
                .Include(f => f.Payments)
                .OrderByDescending(f => f.DueDate)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            // Surface a clean GraphQL error instead of letting the worker crash and
            // close the Kestrel connection (which the browser reports as
            // net::ERR_EMPTY_RESPONSE).
            Console.Error.WriteLine($"[GetByCopropertyIdAsync] Failed for coproperty {copropertyId}: {ex.GetType().Name}: {ex.Message}");
            throw new InvalidOperationException(
                "Impossible de charger les appels de fonds pour cette copropriété. Veuillez réessayer.",
                ex);
        }
    }

    public async Task<List<FundCall>> GetAllAsync()
    {
        using var context = _contextFactory.CreateDbContext();

        return await context.FundCalls
            .IgnoreQueryFilters()
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
        var owner = await context.Owners
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(o => o.Id == ownerId);
        if (owner == null) return new List<FundCall>();

        var allOwnerIds = await context.Owners
            .IgnoreQueryFilters()
            .Where(o => o.UserId == owner.UserId)
            .Select(o => o.Id)
            .ToListAsync();

        return await context.FundCalls
            .IgnoreQueryFilters()
            .Where(f =>
                f.OwnerId.HasValue &&
                allOwnerIds.Contains(f.OwnerId.Value) &&
                (f.IsActive || f.Status == FundCallStatus.Cancelled))
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
            var paidTotal = fc.Payments
                .Where(p => p.ValidationStatus != "Rejected")
                .Sum(p => p.Amount);
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
        const int maxJustificatifBytes = 5 * 1024 * 1024;
        var allowedContentTypes = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "application/pdf", "image/jpeg", "image/png", "image/webp"
        };
        byte[]? justificatifFileData = null;

        if (!string.IsNullOrWhiteSpace(input.JustificatifFileBase64))
        {
            if (string.IsNullOrWhiteSpace(input.JustificatifFileName) ||
                string.IsNullOrWhiteSpace(input.JustificatifContentType))
                throw new InvalidOperationException("Le nom et le type du justificatif sont obligatoires.");
            if (!allowedContentTypes.Contains(input.JustificatifContentType))
                throw new InvalidOperationException("Format de justificatif non supporté. Utilisez PDF, JPG, PNG ou WebP.");

            try
            {
                justificatifFileData = Convert.FromBase64String(input.JustificatifFileBase64);
            }
            catch (FormatException)
            {
                throw new InvalidOperationException("Le fichier justificatif transmis est invalide.");
            }

            if (justificatifFileData.Length > maxJustificatifBytes)
                throw new InvalidOperationException("Le justificatif ne doit pas dépasser 5 Mo.");
        }

        using var context = _contextFactory.CreateDbContext();

        var fundCall = await context.FundCalls
            .Include(f => f.Payments)
            .FirstOrDefaultAsync(f => f.Id == fundCallId);
        if (fundCall == null)
            throw new InvalidOperationException($"FundCall with ID {fundCallId} not found");

        EnsureNotPaid(fundCall);

        if (fundCall.Status == FundCallStatus.Cancelled || !fundCall.IsActive)
            throw new InvalidOperationException(
                "Impossible d'ajouter un versement à un appel de fonds annulé. Réactivez-le d'abord.");

        var payingUserGuid = Guid.TryParse(userId, out var userGuidParsed) ? userGuidParsed : Guid.Empty;

        // Calculate remaining amount and prevent overpayment
        var existingTotal = fundCall.Payments
            .Where(p => p.ValidationStatus != "Rejected")
            .Sum(p => p.Amount);
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
            JustificatifFileName = input.JustificatifFileName?.Trim(),
            JustificatifContentType = input.JustificatifContentType?.Trim(),
            PaymentMethod = input.PaymentMethod,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = Guid.TryParse(userId, out var userGuid) ? userGuid : Guid.Empty
        };

        context.FundCallPayments.Add(payment);
        if (justificatifFileData != null)
        {
            payment.JustificatifFile = new FundCallPaymentJustificatifFile
            {
                FundCallPaymentId = payment.Id,
                FileData = justificatifFileData
            };
        }

        // Set status to PendingValidation — the syndic must review and approve the payment
        // before the fund call is marked as Paid.
        fundCall.Status = FundCallStatus.PendingValidation;
        fundCall.UpdatedAt = DateTime.UtcNow;

        // A submitted proof is only a payment claim until the syndic approves it.
        // Do not mutate charge distributions or generate accounting receipts here:
        // those side effects made proof submission fail on unrelated invoice
        // constraints and incorrectly accounted unapproved payments.

        try
        {
            await context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            // Keep database details in server logs while returning a stable,
            // actionable message through GraphQL.
            var inner = ex.InnerException?.Message ?? ex.Message;
            Console.Error.WriteLine($"[AddPaymentAsync] DbUpdateException: {inner}");
            throw new InvalidOperationException(
                "Impossible d'enregistrer le versement. Le paiement n'a pas été créé; veuillez réessayer.",
                ex);
        }

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
                .Where(p => p.FundCallId == fundCallId && p.ValidationStatus != "Rejected")
                .SumAsync(p => p.Amount);
            var remaining = fundCallAmount - totalPaid;
            var isPaidInFull = remaining <= 0;
            var statusText = isPaidInFull
                ? "ENTIÈREMENT RÉGLÉ"
                : $"Reste à payer : {FormatAmount(remaining, coproperty.Currency)}";
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
                  <td style='padding:12px 16px;color:#16a34a;font-size:16px;font-weight:700;border-bottom:1px solid #f3f4f6;'>{FormatAmount(paymentAmount, coproperty.Currency)}</td>
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
                  <td style='padding:12px 16px;color:#111827;font-size:14px;border-bottom:1px solid #f3f4f6;'>{FormatAmount(fundCallAmount, coproperty.Currency)}</td>
                </tr>
                <tr>
                  <td style='padding:12px 16px;color:#6b7280;font-size:14px;border-bottom:1px solid #f3f4f6;'>Total déjà payé</td>
                  <td style='padding:12px 16px;color:#111827;font-size:14px;font-weight:600;border-bottom:1px solid #f3f4f6;'>{FormatAmount(totalPaid, coproperty.Currency)}</td>
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
                    Subject = $"[MYB] Paiement reçu — {ownerName} | {coproperty.Name} ({FormatAmount(paymentAmount, coproperty.Currency)})",
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
                        message = $"💰 Paiement reçu : {ownerName} a versé {FormatAmount(paymentAmount, coproperty.Currency)} ({paymentMethod ?? "Virement"}) pour \"{fundCallDescription ?? "Appel de fonds"}\". {statusText}"
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
            .IgnoreQueryFilters()
            .Where(o => o.UserId == ownerUserId)
            .Select(o => o.Id)
            .ToListAsync();

        return await context.FundCallPayments
            .IgnoreQueryFilters()
            .Include(p => p.FundCall)
                .ThenInclude(f => f.Coproperty)
            .Where(p => p.CreatedBy == ownerUserId
                        || (ownerIds.Count > 0
                            && p.FundCall != null
                            && p.FundCall.OwnerId.HasValue
                            && ownerIds.Contains(p.FundCall.OwnerId.Value)))
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

        EnsureNotPaid(fundCall);

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
                    OwnerNameSnapshot = $"{owner.FirstName} {owner.LastName}".Trim(),
                    CopropertyNameSnapshot = coproperty.Name,
                    UnitNumberSnapshot = unit.UnitNumber,
                    CurrencySnapshot = coproperty.Currency,
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
    private async Task SendFundCallEmailToOwner(
        Guid ownerId, decimal amount, string? description, DateTime dueDate, Currency currency)
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
                    <tr><td style="padding:4px 12px 4px 0"><strong>Montant :</strong></td><td>{FormatAmount(amount, currency)}</td></tr>
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

        EnsureNotPaid(payment.FundCall);

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
        var snapshotCurrency = payment.FundCall.CurrencySnapshot;
        _ = Task.Run(async () =>
        {
            try
            {
                await NotifyOwnerPaymentReview(
                    snapshotOwnerId, snapshotAmount, snapshotDescription,
                    snapshotDueDate, snapshotApproved, snapshotRejectionReason,
                    snapshotCurrency);
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
        DateTime dueDate, bool approved, string? rejectionReason, Currency currency)
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
            bodyContent = $"""<p>Votre paiement de <strong>{FormatAmount(amount, currency)}</strong> pour l'appel de fonds <strong>{description}</strong> a été <strong style="color:#16a34a">validé</strong> par le syndic.</p>""";
        }
        else
        {
            subject = $"Paiement refusé – {description}";
            statusBanner = """<td style="background:#ef4444;padding:14px 40px;text-align:center;"><p style="color:#fff;margin:0;font-size:18px;font-weight:700;">❌ Votre paiement a été refusé</p></td>""";
            var reasonHtml = string.IsNullOrEmpty(rejectionReason)
                ? ""
                : $"""<p style="margin:12px 0;padding:12px 16px;background:#fef2f2;border-left:4px solid #ef4444;border-radius:4px;color:#991b1b;"><strong>Motif :</strong> {System.Net.WebUtility.HtmlEncode(rejectionReason)}</p>""";
            bodyContent = $"""
                <p>Votre paiement de <strong>{FormatAmount(amount, currency)}</strong> pour l'appel de fonds <strong>{description}</strong> a été <strong style="color:#dc2626">refusé</strong> par le syndic.</p>
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

    private static string FormatAmount(decimal amount, Currency currency)
    {
        var unit = currency switch
        {
            Currency.EUR => "€",
            Currency.USD => "$",
            Currency.TND => "DT",
            Currency.GBP => "£",
            Currency.CHF => "CHF",
            Currency.CAD => "CAD",
            Currency.AED => "AED",
            Currency.MAD => "MAD",
            _ => currency.ToString()
        };
        return $"{amount:N2} {unit}";
    }
}
