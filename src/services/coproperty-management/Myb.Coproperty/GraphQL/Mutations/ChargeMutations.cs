using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Models;
using Myb.Coproperty.Services;
using Myb.Coproperty.GraphQL.Types;

namespace Myb.Coproperty.GraphQL.Mutations
{
    [ExtendObjectType("Mutation")]
    public class ChargeMutations
    {
        /// <summary>
        /// Create a new charge with dates as ISO 8601 strings.
        /// Uses CreateChargeInput to avoid DateTime parsing issues.
        /// </summary>
        public async Task<Charge> CreateChargeWithDates(
            CreateChargeInput chargeInput,
            [Service] IChargeService chargeService)
        {
            try
            {
                Console.WriteLine($"CreateChargeWithDates called with: Name={chargeInput.Name}, CopropertyId={chargeInput.CopropertyId}");
                var chargeEntity = chargeInput.ToCharge();
                Console.WriteLine($"Charge entity created: Id={chargeEntity.Id}, CreatedAt={chargeEntity.CreatedAt}, UpdatedAt={chargeEntity.UpdatedAt}");
                var result = await chargeService.CreateAsync(chargeEntity);
                Console.WriteLine($"Charge created successfully: Id={result.Id}");
                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR in CreateChargeWithDates: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                throw;
            }
        }

        /// <summary>
        /// Update an existing charge with dates as ISO 8601 strings.
        /// Uses UpdateChargeInput to avoid DateTime parsing issues.
        /// </summary>
        public async Task<Charge> UpdateChargeWithDates(
            UpdateChargeInput chargeInput,
            [Service] IChargeService chargeService)
        {
            try
            {
                Console.WriteLine($"UpdateChargeWithDates called with: Id={chargeInput.Id}, Name={chargeInput.Name}");
                var chargeEntity = chargeInput.ToCharge();
                Console.WriteLine($"Charge entity updated: Id={chargeEntity.Id}, UpdatedAt={chargeEntity.UpdatedAt}");
                await chargeService.UpdateAsync(chargeEntity);
                var result = await chargeService.GetByIdAsync(chargeEntity.Id);
                Console.WriteLine($"Charge updated successfully: Id={result?.Id}");
                return result!;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR in UpdateChargeWithDates: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                throw;
            }
        }

        [Obsolete("Use UpdateChargeWithDates instead")]
        public async Task<Charge> UpdateCharge(Charge charge, [Service] IChargeService chargeService)
        {
            await chargeService.UpdateAsync(charge);
            return charge;
        }

        public async Task<bool> DeleteCharge(Guid id, [Service] IChargeService chargeService)
        {
            await chargeService.DeleteAsync(id);
            return true;
        }

        public async Task<IEnumerable<ChargeDistribution>> DistributeCharge(Guid chargeId, [Service] IChargeService chargeService) =>
            await chargeService.DistributeChargeAsync(chargeId);

        /// <summary>
        /// Mark a charge distribution as paid after successful payment through the payment service.
        /// </summary>
        public async Task<ChargeDistribution?> MarkChargeDistributionPaid(
            Guid distributionId,
            string transactionId,
            string paymentMethod,
            decimal paidAmount,
            [Service] IChargeService chargeService) =>
            await chargeService.MarkDistributionPaidAsync(distributionId, transactionId, paymentMethod, paidAmount);
    }
}
