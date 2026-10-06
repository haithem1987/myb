using Myb.Coproperty.Models;
using Myb.Coproperty.Models.Dtos;

namespace Myb.Coproperty.Services
{
    public interface IChargeService
    {
        Task<IEnumerable<Charge>> GetAllAsync();
        Task<IEnumerable<Charge>> GetChargesByCopropertyIdAsync(Guid copropertyId);
        Task<Charge> GetByIdAsync(Guid id);
        Task<Charge> CreateAsync(Charge charge);
        Task UpdateAsync(Charge charge);
        Task DeleteAsync(Guid id);
        Task<IEnumerable<Charge>> GetActiveChargesAsync(Guid copropertyId);
        Task<IEnumerable<ChargeDistribution>> DistributeChargeAsync(Guid chargeId);
        Task<IReadOnlyList<FundCall>> CreateDistributionAsync(
            CreateDistributionInput input,
            string userId,
            CancellationToken cancellationToken = default);
        Task<IEnumerable<ChargeDistribution>> GetDistributionsByOwnerAsync(Guid ownerId);
        Task<IEnumerable<ChargeDistribution>> GetDistributionsByCopropertyAsync(Guid copropertyId);
        Task<ChargeDistribution?> MarkDistributionPaidAsync(Guid distributionId, string transactionId, string paymentMethod, decimal paidAmount);
    }
}
