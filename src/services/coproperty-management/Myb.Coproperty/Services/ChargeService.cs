using Myb.Coproperty.Infrastructure.Repositories;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;
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

        public ChargeService(
            IChargeRepository chargeRepository,
            IUnitRepository unitRepository,
            IGenericRepository<Guid, ChargeDistribution, CopropertyDbContext> chargeDistributionRepository,
            IDbContextFactory<CopropertyDbContext> dbContextFactory,
            IEmailPublisher emailPublisher,
            IHttpClientFactory httpClientFactory)
        {
            _chargeRepository = chargeRepository;
            _unitRepository = unitRepository;
            _chargeDistributionRepository = chargeDistributionRepository;
            _dbContextFactory = dbContextFactory;
            _emailPublisher = emailPublisher;
            _httpClientFactory = httpClientFactory;
        }

        public async Task<Charge> CreateAsync(Charge charge)
        {
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
            var charge = _chargeRepository.GetById(chargeId)!;
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
            var result = await _chargeRepository.UpdateAsync(charge);
            if (result.Errors != null && result.Errors.Any())
            {
                throw new InvalidOperationException($"Failed to update charge: {string.Join(", ", result.Errors)}");
            }
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
                        CreatedAt = DateTime.UtcNow,
                        CreatedBy = owner.UserId
                    };
                    context.FundCallPayments.Add(fundCallPayment);

                    // Update fund call status based on total payments
                    var existingTotal = linkedFundCall.Payments?.Sum(p => p.Amount) ?? 0;
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
                var statusLabel = distribution.PaymentStatus == ChargePaymentStatus.Paid
                    ? "Intégralement payé" : "Paiement partiel";

                // Email to syndic/manager
                if (coproperty.ManagerId.HasValue)
                {
                    // Find manager email - look for an owner or user record
                    var managerEmail = coproperty.ManagerName; // fallback
                    // Try to find a syndic user email from the coproperty
                    // For now, we send to the coproperty's contact info

                    await _emailPublisher.PublishAsync(new EmailMessage
                    {
                        To = managerEmail ?? "",
                        Subject = $"Paiement reçu - {ownerName} - {coproperty.Name}",
                        HtmlBody = $@"<h1>Paiement de charge reçu</h1>
                            <p>Un copropriétaire a effectué un paiement en ligne.</p>
                            <table style='border-collapse:collapse; border:1px solid #ddd;'>
                                <tr><td style='padding:8px;'><strong>Copropriété :</strong></td><td style='padding:8px;'>{coproperty.Name}</td></tr>
                                <tr><td style='padding:8px;'><strong>Copropriétaire :</strong></td><td style='padding:8px;'>{ownerName}</td></tr>
                                <tr><td style='padding:8px;'><strong>Lot :</strong></td><td style='padding:8px;'>{unitNumber}</td></tr>
                                <tr><td style='padding:8px;'><strong>Charge :</strong></td><td style='padding:8px;'>{charge?.Name}</td></tr>
                                <tr><td style='padding:8px;'><strong>Montant payé :</strong></td><td style='padding:8px;'>{paidAmount:N2} €</td></tr>
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

                // 5. Send real-time notification to syndic via notification service
                if (coproperty.ManagerId.HasValue)
                {
                    try
                    {
                        var httpClient = _httpClientFactory.CreateClient("NotificationService");
                        var notificationPayload = new
                        {
                            senderId = owner.UserId.ToString(),
                            receiverId = coproperty.ManagerId.Value.ToString(),
                            message = $"💰 Paiement reçu : {ownerName} a payé {paidAmount:N2} € pour la charge \"{charge?.Name}\" (Lot {unitNumber})"
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
    }
}
