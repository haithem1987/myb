using Myb.Coproperty.Infrastructure.Repositories;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;
using Myb.Common.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Myb.Coproperty.Services
{
    public class ChargeService : IChargeService
    {
        private readonly IChargeRepository _chargeRepository;
        private readonly IUnitRepository _unitRepository;
        private readonly IGenericRepository<Guid, ChargeDistribution, CopropertyDbContext> _chargeDistributionRepository;

        public ChargeService(IChargeRepository chargeRepository, IUnitRepository unitRepository, IGenericRepository<Guid, ChargeDistribution, CopropertyDbContext> chargeDistributionRepository)
        {
            _chargeRepository = chargeRepository;
            _unitRepository = unitRepository;
            _chargeDistributionRepository = chargeDistributionRepository;
        }

        public async Task<Charge> CreateAsync(Charge charge)
        {
            var result = await _chargeRepository.InsertAsync(charge);
            return result.Entity!;
        }

        public async Task DeleteAsync(Guid id)
        {
            await _chargeRepository.DeleteAsync(id);
        }

        public async Task<IEnumerable<ChargeDistribution>> DistributeChargeAsync(Guid chargeId)
        {
            var charge = _chargeRepository.GetById(chargeId)!;
            var units = await _unitRepository.GetByCopropertyIdAsync(charge.CopropertyId);
            var distributions = new List<ChargeDistribution>();

            switch (charge.DistributionMethod)
            {
                case DistributionMethod.ByShares:
                    var totalShares = units.Sum(u => u.Shares);
                    foreach (var unit in units)
                    {
                        distributions.Add(new ChargeDistribution
                        {
                            ChargeId = chargeId,
                            UnitId = unit.Id,
                            Amount = (charge.TotalAmount * unit.Shares) / totalShares
                        });
                    }
                    break;
                case DistributionMethod.ByArea:
                    var totalArea = units.Sum(u => u.Area ?? 0);
                    foreach (var unit in units)
                    {
                        distributions.Add(new ChargeDistribution
                        {
                            ChargeId = chargeId,
                            UnitId = unit.Id,
                            Amount = (charge.TotalAmount * (unit.Area ?? 0)) / totalArea
                        });
                    }
                    break;
                case DistributionMethod.Equal:
                    var amountPerUnit = charge.TotalAmount / units.Count();
                    foreach (var unit in units)
                    {
                        distributions.Add(new ChargeDistribution
                        {
                            ChargeId = chargeId,
                            UnitId = unit.Id,
                            Amount = amountPerUnit
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

            return distributions;
        }

        public async Task<IEnumerable<Charge>> GetActiveChargesAsync(Guid copropertyId)
        {
            return await _chargeRepository.GetActiveChargesAsync(copropertyId);
        }

        public async Task<Charge> GetByIdAsync(Guid id)
        {
            return await Task.FromResult(_chargeRepository.GetById(id)!);
        }

        public async Task<IEnumerable<Charge>> GetChargesByCopropertyIdAsync(Guid copropertyId)
        {
            return await Task.FromResult(_chargeRepository.GetAll().Where(c => c.CopropertyId == copropertyId).ToList());
        }

        public async Task UpdateAsync(Charge charge)
        {
            await _chargeRepository.UpdateAsync(charge);
        }
    }
}
