using HotChocolate;
using HotChocolate.Types;
using Microsoft.EntityFrameworkCore;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;
using Myb.Coproperty.Models.Dtos;
using Myb.Coproperty.Services;
using System.Security.Claims;

namespace Myb.Coproperty.GraphQL.Queries;

/// <summary>
/// GraphQL queries for fund call operations
/// </summary>
[ExtendObjectType("Query")]
public class FundCallQueries
{
    /// <summary>Loads an uploaded payment proof only when a syndic requests it.</summary>
    public async Task<PaymentJustificatifPayload> GetFundCallPaymentJustificatif(
        Guid paymentId,
        ClaimsPrincipal? user,
        [Service] IDbContextFactory<CopropertyDbContext> contextFactory,
        [Service] ICopropertyService copropertyService)
    {
        if (!CopropertyAccessControl.IsSyndicOnly(user) &&
            !CopropertyAccessControl.IsAdmin(user))
            throw new InvalidOperationException(
                "Accès refusé : seuls les syndics et administrateurs peuvent consulter un justificatif.");

        await using var context = await contextFactory.CreateDbContextAsync();
        var payment = await context.FundCallPayments
            .AsNoTracking()
            .Include(item => item.FundCall)
            .Include(item => item.JustificatifFile)
            .FirstOrDefaultAsync(item => item.Id == paymentId)
            ?? throw new InvalidOperationException("Versement introuvable.");

        await CopropertyAccessControl.EnsureCopropertyOwnershipAsync(
            user, payment.FundCall.CopropertyId, copropertyService);

        if (payment.JustificatifFile?.FileData == null ||
            string.IsNullOrWhiteSpace(payment.JustificatifFileName))
            throw new InvalidOperationException("Aucun fichier justificatif n'est disponible pour ce versement.");

        return new PaymentJustificatifPayload
        {
            FileName = payment.JustificatifFileName,
            ContentType = payment.JustificatifContentType ?? "application/octet-stream",
            Base64Data = Convert.ToBase64String(payment.JustificatifFile.FileData)
        };
    }

    /// <summary>Get a fund call by ID</summary>
    public async Task<FundCall?> GetFundCall(
        Guid id,
        ClaimsPrincipal? user,
        [Service] IFundCallService fundCallService,
        [Service] ICopropertyService copropertyService)
    {
        var fundCall = await fundCallService.GetByIdAsync(id);
        if (fundCall != null)
            await CopropertyAccessControl.EnsureCopropertyOwnershipAsync(user, fundCall.CopropertyId, copropertyService);
        return fundCall;
    }

    /// <summary>
    /// Get all fund calls for a coproperty, optionally filtered by owner and/or year.
    /// </summary>
    public async Task<List<FundCall>> GetFundCallsByCoproperty(
        Guid copropertyId,
        Guid? ownerId,
        int? year,
        ClaimsPrincipal? user,
        [Service] IFundCallService fundCallService,
        [Service] ICopropertyService copropertyService)
    {
        await CopropertyAccessControl.EnsureCopropertyOwnershipAsync(user, copropertyId, copropertyService);
        return await fundCallService.GetByCopropertyIdAsync(copropertyId, ownerId, year);
    }

    /// <summary>
    /// Get all fund calls across all coproperties (unfiltered; filtering handled client-side).
    /// </summary>
    public async Task<List<FundCall>> GetAllFundCalls(
        ClaimsPrincipal? user,
        [Service] IFundCallService fundCallService,
        [Service] ICopropertyService copropertyService)
    {
        var fundCalls = await fundCallService.GetAllAsync();
        var scopedIds = await CopropertyAccessControl.GetScopedCopropertyIdsAsync(user, copropertyService);
        if (scopedIds == null)
            return fundCalls;

        return fundCalls.Where(fc => scopedIds.Contains(fc.CopropertyId)).ToList();
    }

    /// <summary>
    /// Get all fund calls for a specific owner (across all coproperties).
    /// Used by the owner portal.
    /// </summary>
    public async Task<List<FundCall>> GetFundCallsByOwner(
        Guid ownerId,
        ClaimsPrincipal? user,
        [Service] IFundCallService fundCallService,
        [Service] ICopropertyService copropertyService)
    {
        var fundCalls = await fundCallService.GetByOwnerIdAsync(ownerId);
        var scopedIds = await CopropertyAccessControl.GetScopedCopropertyIdsAsync(user, copropertyService);
        if (scopedIds == null)
            return fundCalls;

        return fundCalls.Where(fc => scopedIds.Contains(fc.CopropertyId)).ToList();
    }

    /// <summary>
    /// Get all fund call payments for a specific owner (by Keycloak user ID).
    /// Used by the owner receipt page ("Mes Reçus").
    /// </summary>
    public async Task<List<FundCallPayment>> GetFundCallPaymentsByOwner(
        Guid ownerUserId,
        ClaimsPrincipal? user,
        [Service] IFundCallService fundCallService,
        [Service] ICopropertyService copropertyService)
    {
        if (CopropertyAccessControl.IsOwner(user) &&
            CopropertyAccessControl.GetUserId(user) != ownerUserId)
            throw new InvalidOperationException(
                "Accès refusé : vous ne pouvez consulter que vos propres reçus.");

        var payments = await fundCallService.GetPaymentsByOwnerUserIdAsync(ownerUserId);
        var scopedIds = await CopropertyAccessControl.GetScopedCopropertyIdsAsync(user, copropertyService);
        if (scopedIds == null)
            return payments;

        return payments
            .Where(p => p.FundCall != null && scopedIds.Contains(p.FundCall.CopropertyId))
            .ToList();
    }

    /// <summary>
    /// Get remaining fund call totals per owner for a coproperty.
    /// Used during repartition to avoid double-charging owners who already have fund calls.
    /// </summary>
    public async Task<List<OwnerFundCallTotal>> GetExistingFundCallTotals(
        Guid copropertyId,
        ClaimsPrincipal? user,
        [Service] IFundCallService fundCallService,
        [Service] ICopropertyService copropertyService)
    {
        await CopropertyAccessControl.EnsureCopropertyOwnershipAsync(user, copropertyId, copropertyService);
        var totals = await fundCallService.GetExistingFundCallTotalsByOwnerAsync(copropertyId);
        return totals.Select(kvp => new OwnerFundCallTotal
        {
            OwnerId = kvp.Key,
            RemainingAmount = kvp.Value
        }).ToList();
    }
}
