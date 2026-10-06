using Myb.Coproperty.Infrastructure.Repositories;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;
using Myb.Coproperty.Models.Dtos;
using Myb.Common.Repositories;
using Myb.Common.Messaging;
using Myb.Common.Messaging.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace Myb.Coproperty.Services
{
    public class ChargeService : IChargeService
    {
        private readonly IChargeRepository _chargeRepository;
        private readonly IUnitRepository _unitRepository;
        private readonly IGenericRepository<Guid, ChargeDistribution, CopropertyDbContext> _chargeDistributionRepository;
        private readonly IDbContextFactory<CopropertyDbContext> _dbContextFactory;
        private readonly IEmailPublisher _emailPublisher;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IKeycloakAdminService _keycloakAdminService;
        private readonly IFundCallService? _fundCallService;

        public ChargeService(
            IChargeRepository chargeRepository,
            IUnitRepository unitRepository,
            IGenericRepository<Guid, ChargeDistribution, CopropertyDbContext> chargeDistributionRepository,
            IDbContextFactory<CopropertyDbContext> dbContextFactory,
            IEmailPublisher emailPublisher,
            IHttpClientFactory httpClientFactory,
            IKeycloakAdminService keycloakAdminService,
            IFundCallService? fundCallService = null)
        {
            _chargeRepository = chargeRepository;
            _unitRepository = unitRepository;
            _chargeDistributionRepository = chargeDistributionRepository;
            _dbContextFactory = dbContextFactory;
            _emailPublisher = emailPublisher;
            _httpClientFactory = httpClientFactory;
            _keycloakAdminService = keycloakAdminService;
            _fundCallService = fundCallService;
        }

        public async Task<Charge> CreateAsync(Charge charge)
        {
            if (charge.EndDate.HasValue && charge.EndDate.Value <= charge.StartDate)
                throw new ArgumentException("La date de fin doit être postérieure à la date de début.");

            using var context = _dbContextFactory.CreateDbContext();
            var copropertyIsActive = await context.Coproperties
                .AnyAsync(c => c.Id == charge.CopropertyId && c.IsActive);
            if (!copropertyIsActive)
                throw new InvalidOperationException("New operations are not allowed for an inactive coproperty.");

            var result = await _chargeRepository.InsertAsync(charge);
            
            if (result.Errors != null && result.Errors.Any())
            {
                throw new InvalidOperationException($"Failed to create charge: {string.Join(", ", result.Errors)}");
            }
            
            if (result.Entity == null)
            {
                throw new InvalidOperationException("Failed to create charge: Entity was not returned");
            }
            
            return result.Entity;
        }

        public async Task DeleteAsync(Guid id)
        {
            var existing = _chargeRepository.GetById(id)
                ?? throw new InvalidOperationException($"Charge with ID {id} not found");
            await EnsureCopropertyIsActiveAsync(existing.CopropertyId);
            var result = await _chargeRepository.DeleteAsync(id);
            if (result.Errors != null && result.Errors.Any())
            {
                throw new InvalidOperationException($"Failed to delete charge: {string.Join(", ", result.Errors)}");
            }
        }

        public async Task<IEnumerable<Charge>> GetAllAsync()
        {
            return await _chargeRepository.GetAllAsync();
        }

        public async Task<IEnumerable<ChargeDistribution>> DistributeChargeAsync(Guid chargeId)
        {
            var charge = _chargeRepository.GetById(chargeId)
                ?? throw new InvalidOperationException($"Charge with ID {chargeId} not found");
            await EnsureCopropertyIsActiveAsync(charge.CopropertyId);
            var units = await _unitRepository.GetByCopropertyIdAsync(charge.CopropertyId);
            var unitsList = units.ToList();

            // Remove existing unpaid distributions for this charge (idempotent re-run)
            using var context = _dbContextFactory.CreateDbContext();
            var existingUnpaid = await context.ChargeDistributions
                .Where(cd => cd.ChargeId == chargeId && cd.PaymentStatus == ChargePaymentStatus.Unpaid)
                .ToListAsync();
            if (existingUnpaid.Any())
            {
                context.ChargeDistributions.RemoveRange(existingUnpaid);
                await context.SaveChangesAsync();
            }

            var distributions = new List<ChargeDistribution>();

            switch (charge.DistributionMethod)
            {
                case DistributionMethod.ByShares:
                    var totalShares = unitsList.Sum(u => u.Shares);
                    foreach (var unit in unitsList)
                    {
                        distributions.Add(new ChargeDistribution
                        {
                            ChargeId = chargeId,
                            UnitId = unit.Id,
                            UnitNumberSnapshot = unit.UnitNumber,
                            Amount = (charge.TotalAmount * unit.Shares) / totalShares,
                        });
                    }
                    break;
                case DistributionMethod.ByArea:
                    var totalArea = unitsList.Sum(u => u.Area ?? 0);
                    foreach (var unit in unitsList)
                    {
                        distributions.Add(new ChargeDistribution
                        {
                            ChargeId = chargeId,
                            UnitId = unit.Id,
                            UnitNumberSnapshot = unit.UnitNumber,
                            Amount = (charge.TotalAmount * (unit.Area ?? 0)) / totalArea,
                        });
                    }
                    break;
                case DistributionMethod.Equal:
                    var amountPerUnit = charge.TotalAmount / unitsList.Count;
                    foreach (var unit in unitsList)
                    {
                        distributions.Add(new ChargeDistribution
                        {
                            ChargeId = chargeId,
                            UnitId = unit.Id,
                            UnitNumberSnapshot = unit.UnitNumber,
                            Amount = amountPerUnit,
                        });
                    }
                    break;
                case DistributionMethod.Custom:
                    // Custom logic to be implemented
                    break;
            }

            foreach (var dist in distributions)
            {
                await _chargeDistributionRepository.InsertAsync(dist);
            }

            // Populate navigation properties for GraphQL resolvers
            var unitsMap = unitsList.ToDictionary(u => u.Id);
            foreach (var dist in distributions)
            {
                if (unitsMap.TryGetValue(dist.UnitId, out var unit))
                    dist.Unit = unit;
                dist.Charge = charge;
            }

            return distributions;
        }

        /// <summary>
        /// Persists the distributions and every related call for funds in one database
        /// transaction. A failure at any point rolls the complete operation back.
        /// Existing calls for funds are accounting records and are never overwritten.
        /// The caller supplies only the outstanding incremental amount for each owner.
        /// </summary>
        public async Task<IReadOnlyList<FundCall>> CreateDistributionAsync(
            CreateDistributionInput input,
            string userId,
            CancellationToken cancellationToken = default)
        {
            if (input.CopropertyId == Guid.Empty)
                throw new ArgumentException("CopropertyId is required.", nameof(input));
            if (input.ChargeIds.Count == 0)
                throw new ArgumentException("At least one charge is required.", nameof(input));
            if (input.FundCalls.Count == 0)
                throw new ArgumentException("At least one call for funds is required.", nameof(input));

            await using var context = await _dbContextFactory.CreateDbContextAsync(cancellationToken);

            // GraphQL mutations are already wrapped by Hot Chocolate's
            // AddDefaultTransactionScopeHandler. Npgsql forbids starting a local
            // transaction while that ambient transaction owns the connection.
            // Only create a local transaction for non-GraphQL callers.
            await using var localTransaction = System.Transactions.Transaction.Current is null
                ? await context.Database.BeginTransactionAsync(cancellationToken)
                : null;

            try
            {
                var coproperty = await context.Coproperties
                    .SingleOrDefaultAsync(c => c.Id == input.CopropertyId, cancellationToken)
                    ?? throw new ArgumentException($"Coproperty with ID {input.CopropertyId} not found.");
                if (!coproperty.IsActive)
                    throw new InvalidOperationException("New operations are not allowed for an inactive coproperty.");

                var chargeIds = input.ChargeIds.Distinct().ToArray();
                var charges = await context.Charges
                    .Where(c => chargeIds.Contains(c.Id) && c.CopropertyId == input.CopropertyId)
                    .ToListAsync(cancellationToken);
                if (charges.Count != chargeIds.Length)
                    throw new ArgumentException("One or more charges do not belong to the selected coproperty.");

                var units = await context.Units
                    .Where(u => u.CopropertyId == input.CopropertyId && !u.IsDeleted)
                    .ToListAsync(cancellationToken);
                if (units.Count == 0)
                    throw new InvalidOperationException("The selected coproperty has no units to distribute.");

                var existingUnpaid = await context.ChargeDistributions
                    .Where(cd => chargeIds.Contains(cd.ChargeId)
                        && cd.PaymentStatus == ChargePaymentStatus.Unpaid)
                    .ToListAsync(cancellationToken);
                context.ChargeDistributions.RemoveRange(existingUnpaid);

                foreach (var charge in charges)
                {
                    context.ChargeDistributions.AddRange(BuildDistributions(charge, units));
                }

                var ownerIds = input.FundCalls
                    .Where(call => call.OwnerId.HasValue)
                    .Select(call => call.OwnerId!.Value)
                    .Distinct()
                    .ToArray();
                var owners = await context.Owners
                    .Where(owner => ownerIds.Contains(owner.Id))
                    .ToDictionaryAsync(owner => owner.Id, cancellationToken);
                if (owners.Count != ownerIds.Length)
                    throw new ArgumentException("One or more owners could not be found.");

                var createdBy = Guid.TryParse(userId, out var userGuid) ? userGuid : Guid.Empty;
                var now = DateTime.UtcNow;
                var result = new List<FundCall>(input.FundCalls.Count);

                foreach (var callInput in input.FundCalls)
                {
                    if (callInput.CopropertyId != input.CopropertyId)
                        throw new ArgumentException("Every call for funds must belong to the selected coproperty.");
                    if (callInput.Amount <= 0)
                        throw new ArgumentException("Every call for funds must have a positive amount.");

                    var ownerName = callInput.OwnerId.HasValue
                        ? $"{owners[callInput.OwnerId.Value].FirstName} {owners[callInput.OwnerId.Value].LastName}".Trim()
                        : null;

                    var fundCall = new FundCall
                    {
                        Id = Guid.NewGuid(),
                        CopropertyId = input.CopropertyId,
                        OwnerId = callInput.OwnerId,
                        CreatedAt = now,
                        CreatedBy = createdBy,
                    };
                    context.FundCalls.Add(fundCall);
                    fundCall.Amount = callInput.Amount;
                    fundCall.DueDate = callInput.DueDate;
                    fundCall.Description = callInput.Description;
                    fundCall.Status = callInput.Status ?? FundCallStatus.ToPay;
                    fundCall.IsActive = true;
                    fundCall.UpdatedAt = now;
                    fundCall.OwnerNameSnapshot = ownerName;
                    fundCall.CopropertyNameSnapshot = coproperty.Name;
                    fundCall.CurrencySnapshot = coproperty.Currency;
                    result.Add(fundCall);
                }

                await context.SaveChangesAsync(cancellationToken);
                if (localTransaction is not null)
                    await localTransaction.CommitAsync(cancellationToken);

                if (_fundCallService is not null)
                {
                    foreach (var fundCall in result)
                        await _fundCallService.NotifyOwnerOfCreatedFundCallAsync(fundCall);
                }
                return result;
            }
            catch
            {
                if (localTransaction is not null)
                    await localTransaction.RollbackAsync(cancellationToken);
                throw;
            }
        }

        private static IEnumerable<ChargeDistribution> BuildDistributions(Charge charge, IReadOnlyList<Unit> units)
        {
            decimal denominator = charge.DistributionMethod switch
            {
                DistributionMethod.ByShares => units.Sum(unit => (decimal)unit.Shares),
                DistributionMethod.ByArea => units.Sum(unit => unit.Area ?? 0m),
                DistributionMethod.Equal => units.Count,
                DistributionMethod.Custom => throw new InvalidOperationException(
                    "Custom distributions must provide explicit per-unit values."),
                _ => throw new ArgumentOutOfRangeException(nameof(charge.DistributionMethod)),
            };

            if (denominator <= 0)
                throw new InvalidOperationException($"Charge '{charge.Name}' cannot be distributed because its basis is zero.");

            return units.Select(unit =>
            {
                var weight = charge.DistributionMethod switch
                {
                    DistributionMethod.ByShares => unit.Shares,
                    DistributionMethod.ByArea => unit.Area ?? 0m,
                    DistributionMethod.Equal => 1m,
                    _ => 0m,
                };
                return new ChargeDistribution
                {
                    Id = Guid.NewGuid(),
                    ChargeId = charge.Id,
                    UnitId = unit.Id,
                    UnitNumberSnapshot = unit.UnitNumber,
                    Amount = charge.TotalAmount * weight / denominator,
                    Percentage = weight * 100m / denominator,
                };
            }).ToArray();
        }

        public async Task<IEnumerable<Charge>> GetActiveChargesAsync(Guid copropertyId)
        {
            return await _chargeRepository.GetActiveChargesAsync(copropertyId);
        }

        public async Task<Charge> GetByIdAsync(Guid id)
        {
            var charge = await _chargeRepository.GetByIdAsync(id);
            if (charge == null)
            {
                throw new InvalidOperationException($"Charge with ID {id} not found");
            }
            return charge;
        }

        public async Task<IEnumerable<Charge>> GetChargesByCopropertyIdAsync(Guid copropertyId)
        {
            return await _chargeRepository.GetWhereAsync(c => c.CopropertyId == copropertyId);
        }

        public async Task UpdateAsync(Charge charge)
        {
            if (charge.EndDate.HasValue && charge.EndDate.Value <= charge.StartDate)
                throw new ArgumentException("La date de fin doit être postérieure à la date de début.");
            await EnsureCopropertyIsActiveAsync(charge.CopropertyId);

            var result = await _chargeRepository.UpdateAsync(charge);
            if (result.Errors != null && result.Errors.Any())
            {
                throw new InvalidOperationException($"Failed to update charge: {string.Join(", ", result.Errors)}");
            }
        }

        private async Task EnsureCopropertyIsActiveAsync(Guid copropertyId)
        {
            using var context = _dbContextFactory.CreateDbContext();
            if (!await context.Coproperties.AnyAsync(c => c.Id == copropertyId && c.IsActive))
                throw new InvalidOperationException("New operations are not allowed for an inactive coproperty.");
        }

        public async Task<IEnumerable<ChargeDistribution>> GetDistributionsByOwnerAsync(Guid ownerId)
        {
            using var context = _dbContextFactory.CreateDbContext();

            // Get all unit IDs owned by this owner
            var unitIds = await context.OwnerUnits
                .Where(ou => ou.OwnerId == ownerId)
                .Select(ou => ou.UnitId)
                .ToListAsync();

            if (!unitIds.Any())
                return Enumerable.Empty<ChargeDistribution>();

            // Get all charge distributions for these units, including Charge and Unit data
            return await context.ChargeDistributions
                .IgnoreQueryFilters()
                .Include(cd => cd.Charge)
                .Include(cd => cd.Unit)
                .Where(cd => unitIds.Contains(cd.UnitId))
                .OrderByDescending(cd => cd.CalculatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<ChargeDistribution>> GetDistributionsByCopropertyAsync(Guid copropertyId)
        {
            using var context = _dbContextFactory.CreateDbContext();

            return await context.ChargeDistributions
                .Include(cd => cd.Charge)
                .Include(cd => cd.Unit)
                    .ThenInclude(u => u.OwnerUnits)
                    .ThenInclude(ou => ou.Owner)
                .Where(cd => cd.Charge.CopropertyId == copropertyId)
                .OrderByDescending(cd => cd.PaidAt ?? cd.CalculatedAt)
                .ToListAsync();
        }

        public async Task<ChargeDistribution?> MarkDistributionPaidAsync(
            Guid distributionId, string transactionId, string paymentMethod, decimal paidAmount)
        {
            using var context = _dbContextFactory.CreateDbContext();

            var distribution = await context.ChargeDistributions
                .Include(cd => cd.Charge)
                    .ThenInclude(c => c.Coproperty)
                .Include(cd => cd.Unit)
                    .ThenInclude(u => u.OwnerUnits)
                    .ThenInclude(ou => ou.Owner)
                .FirstOrDefaultAsync(cd => cd.Id == distributionId);

            if (distribution == null)
                return null;

            // 1. Update payment fields on distribution
            distribution.PaidAmount += paidAmount;
            distribution.PaymentTransactionId = transactionId;
            distribution.PaymentMethod = paymentMethod;
            distribution.PaidAt = DateTime.UtcNow;
            distribution.UpdatedAt = DateTime.UtcNow;

            if (distribution.PaidAmount >= distribution.Amount)
                distribution.PaymentStatus = ChargePaymentStatus.Paid;
            else
                distribution.PaymentStatus = ChargePaymentStatus.PartiallyPaid;

            // 2. Update existing pending invoice OR create a new one as payment receipt
            var owner = distribution.Unit?.OwnerUnits?.FirstOrDefault(ou => ou.EndDate == null)?.Owner;
            var charge = distribution.Charge;
            var coproperty = charge?.Coproperty;

            CopropertyInvoice? invoice = null;
            if (charge != null && owner != null)
            {
                // Look for an existing pending invoice for this unit + owner (from fund call or charge)
                invoice = await context.CopropertyInvoices
                    .FirstOrDefaultAsync(i =>
                        i.CopropertyId == charge.CopropertyId &&
                        i.UnitId == distribution.UnitId &&
                        i.OwnerId == owner.Id &&
                        i.Status != InvoiceStatus.Paid);

                if (invoice != null)
                {
                    // Update existing invoice to reflect payment
                    invoice.Status = distribution.PaymentStatus == ChargePaymentStatus.Paid
                        ? InvoiceStatus.Paid : InvoiceStatus.PartiallyPaid;
                    invoice.PaidDate = DateTime.UtcNow;
                    invoice.PaymentMethod = paymentMethod;
                    invoice.Notes = $"Transaction: {transactionId}";
                    invoice.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    // No existing invoice — create a payment receipt
                    var unitNumber = distribution.Unit?.UnitNumber ?? "";
                    var seq = await context.CopropertyInvoices
                        .CountAsync(i => i.CopropertyId == charge.CopropertyId) + 1;
                    invoice = new CopropertyInvoice
                    {
                        Id = Guid.NewGuid(),
                        CopropertyId = charge.CopropertyId,
                        ChargeId = charge.Id,
                        UnitId = distribution.UnitId,
                        OwnerId = owner.Id,
                        InvoiceNumber = $"PAY-{seq:D4}-{unitNumber}",
                        Amount = paidAmount,
                        TaxAmount = 0,
                        TotalAmount = paidAmount,
                        InvoiceDate = DateTime.UtcNow,
                        DueDate = DateTime.UtcNow,
                        Status = InvoiceStatus.Paid,
                        PaidDate = DateTime.UtcNow,
                        PaymentMethod = paymentMethod,
                        Description = $"Paiement de charge : {charge.Name} - Lot {unitNumber}",
                        OwnerNameSnapshot = $"{owner.FirstName} {owner.LastName}".Trim(),
                        CopropertyNameSnapshot = coproperty?.Name,
                        UnitNumberSnapshot = unitNumber,
                        CurrencySnapshot = coproperty?.Currency ?? Currency.EUR,
                        Notes = $"Transaction: {transactionId}",
                        CreatedAt = DateTime.UtcNow,
                        CreatedBy = owner.UserId
                    };
                    context.CopropertyInvoices.Add(invoice);
                }
            }

            // 3. Auto-update linked fund call if one exists for this owner + coproperty
            if (owner != null && charge != null)
            {
                var linkedFundCall = await context.FundCalls
                    .Include(f => f.Payments)
                    .Where(f => f.CopropertyId == charge.CopropertyId
                        && f.OwnerId == owner.Id
                        && f.Status != FundCallStatus.Paid
                        && f.Status != FundCallStatus.Validated)
                    .OrderBy(f => f.DueDate)
                    .FirstOrDefaultAsync();

                if (linkedFundCall != null)
                {
                    // Add payment record to fund call
                    var fundCallPayment = new FundCallPayment
                    {
                        Id = Guid.NewGuid(),
                        FundCallId = linkedFundCall.Id,
                        Amount = paidAmount,
                        PaymentDate = DateTime.UtcNow,
                        Justificatif = $"Paiement en ligne - {transactionId}",
                        UnitNumberSnapshot = distribution.UnitNumberSnapshot ?? distribution.Unit?.UnitNumber,
                        ValidationStatus = "Approved",
                        CreatedAt = DateTime.UtcNow,
                        CreatedBy = owner.UserId
                    };
                    context.FundCallPayments.Add(fundCallPayment);

                    // Update fund call status based on total payments
                    var existingTotal = linkedFundCall.Payments?
                        .Where(p => p.ValidationStatus != "Rejected")
                        .Sum(p => p.Amount) ?? 0;
                    if (existingTotal + paidAmount >= linkedFundCall.Amount)
                        linkedFundCall.Status = FundCallStatus.Paid;

                    linkedFundCall.UpdatedAt = DateTime.UtcNow;
                }
            }

            await context.SaveChangesAsync();

            // 4. Send email notification to syndic (manager)
            if (owner != null && coproperty != null)
            {
                var ownerName = $"{owner.FirstName} {owner.LastName}";
                var unitNumber = distribution.Unit?.UnitNumber ?? "N/A";
                // Email to syndic/manager
                if (coproperty.ManagerId.HasValue)
                {
                    // Resolve the manager's real email: try the Owners table first, then Keycloak.
                    // ManagerName is a display name, not an address, and must never be used as "To".
                    string? managerEmail = null;
                    var syndicOwner = await context.Owners
                        .FirstOrDefaultAsync(o => o.UserId == coproperty.ManagerId.Value);
                    managerEmail = syndicOwner?.Email;

                    if (string.IsNullOrEmpty(managerEmail))
                    {
                        var keycloakUser = await _keycloakAdminService.GetUserByIdAsync(coproperty.ManagerId.Value.ToString());
                        managerEmail = keycloakUser?.Email;
                    }

                    if (!string.IsNullOrEmpty(managerEmail))
                    {
                        var english = await _keycloakAdminService
                            .GetPreferredLanguageAsync(coproperty.ManagerId.Value.ToString()) == "en";
                        var statusLabel = distribution.PaymentStatus == ChargePaymentStatus.Paid
                            ? (english ? "Paid in full" : "Intégralement payé")
                            : (english ? "Partial payment" : "Paiement partiel");
                        await _emailPublisher.PublishAsync(new EmailMessage
                        {
                            To = managerEmail,
                            Subject = english
                                ? $"Payment received - {ownerName} - {coproperty.Name}"
                                : $"Paiement reçu - {ownerName} - {coproperty.Name}",
                            Language = english ? "en" : "fr",
                            HtmlBody = english ? $@"<h1>Charge payment received</h1>
                            <p>An owner completed an online payment.</p>
                            <table style='border-collapse:collapse; border:1px solid #ddd;'>
                                <tr><td style='padding:8px;'><strong>Coproperty:</strong></td><td style='padding:8px;'>{coproperty.Name}</td></tr>
                                <tr><td style='padding:8px;'><strong>Owner:</strong></td><td style='padding:8px;'>{ownerName}</td></tr>
                                <tr><td style='padding:8px;'><strong>Unit:</strong></td><td style='padding:8px;'>{unitNumber}</td></tr>
                                <tr><td style='padding:8px;'><strong>Charge:</strong></td><td style='padding:8px;'>{charge?.Name}</td></tr>
                                <tr><td style='padding:8px;'><strong>Amount paid:</strong></td><td style='padding:8px;'>{FormatAmount(paidAmount, coproperty.Currency)}</td></tr>
                                <tr><td style='padding:8px;'><strong>Status:</strong></td><td style='padding:8px;'>{statusLabel}</td></tr>
                                <tr><td style='padding:8px;'><strong>Reference:</strong></td><td style='padding:8px;'>{transactionId}</td></tr>
                                <tr><td style='padding:8px;'><strong>Date:</strong></td><td style='padding:8px;'>{DateTime.UtcNow:yyyy-MM-dd HH:mm}</td></tr>
                            </table>
                            <br/>
                            <p>Sign in to your property-manager space to view the details.</p>
                            <p>Regards,<br/>The MYB team</p>" : $@"<h1>Paiement de charge reçu</h1>
                            <p>Un copropriétaire a effectué un paiement en ligne.</p>
                            <table style='border-collapse:collapse; border:1px solid #ddd;'>
                                <tr><td style='padding:8px;'><strong>Copropriété :</strong></td><td style='padding:8px;'>{coproperty.Name}</td></tr>
                                <tr><td style='padding:8px;'><strong>Copropriétaire :</strong></td><td style='padding:8px;'>{ownerName}</td></tr>
                                <tr><td style='padding:8px;'><strong>Lot :</strong></td><td style='padding:8px;'>{unitNumber}</td></tr>
                                <tr><td style='padding:8px;'><strong>Charge :</strong></td><td style='padding:8px;'>{charge?.Name}</td></tr>
                                <tr><td style='padding:8px;'><strong>Montant payé :</strong></td><td style='padding:8px;'>{FormatAmount(paidAmount, coproperty.Currency)}</td></tr>
                                <tr><td style='padding:8px;'><strong>Statut :</strong></td><td style='padding:8px;'>{statusLabel}</td></tr>
                                <tr><td style='padding:8px;'><strong>Référence :</strong></td><td style='padding:8px;'>{transactionId}</td></tr>
                                <tr><td style='padding:8px;'><strong>Date :</strong></td><td style='padding:8px;'>{DateTime.UtcNow:dd/MM/yyyy HH:mm}</td></tr>
                            </table>
                            <br/>
                            <p>Connectez-vous à votre espace syndic pour voir les détails.</p>
                            <p>Cordialement,<br/>L'équipe MYB</p>",
                            Source = "coproperty-service"
                        });
                    }
                }

                // 5. Send real-time notification to syndic via notification service
                if (coproperty.ManagerId.HasValue)
                {
                    try
                    {
                        var httpClient = _httpClientFactory.CreateClient("NotificationService");
                        httpClient.DefaultRequestHeaders.Authorization =
                            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", await _keycloakAdminService.GetServiceAccessTokenAsync());
                        var notificationPayload = new
                        {
                            senderId = owner.UserId.ToString(),
                            receiverId = coproperty.ManagerId.Value.ToString(),
                            copropertyId = coproperty.Id.ToString(),
                            message = $"💰 Paiement reçu : {ownerName} a payé {FormatAmount(paidAmount, coproperty.Currency)} pour la charge \"{charge?.Name}\" (Lot {unitNumber})"
                        };
                        var content = new StringContent(
                            JsonSerializer.Serialize(notificationPayload),
                            Encoding.UTF8,
                            "application/json");
                        await httpClient.PostAsync("/api/Notifications", content);
                    }
                    catch (Exception ex)
                    {
                        // Log but don't fail the payment for notification errors
                        Console.Error.WriteLine($"Failed to send real-time notification: {ex.Message}");
                    }
                }
            }

            return distribution;
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
}
