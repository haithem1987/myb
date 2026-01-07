using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Models;
using Myb.Coproperty.Services;

namespace Myb.Coproperty.GraphQL.Queries
{
    [ExtendObjectType("Query")]
    public class CopropertyQueries
    {
        public async Task<IEnumerable<Models.Coproperty>> GetCoproperties([Service] ICopropertyService copropertyService) =>
            await copropertyService.GetAllAsync();

        public async Task<Models.Coproperty> GetCopropertyById(Guid id, [Service] ICopropertyService copropertyService) =>
            await copropertyService.GetByIdAsync(id);

        public async Task<IEnumerable<Models.Coproperty>> GetCopropertiesByManager(Guid managerId, [Service] ICopropertyService copropertyService) =>
            await copropertyService.GetByManagerIdAsync(managerId);
    }
}
