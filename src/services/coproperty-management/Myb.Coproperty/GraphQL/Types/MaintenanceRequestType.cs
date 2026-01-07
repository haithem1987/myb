using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;
using HotChocolate;
using HotChocolate.Types;

namespace Myb.Coproperty.GraphQL.Types
{
    public class MaintenanceRequestType : ObjectType<MaintenanceRequest>
    {
        protected override void Configure(IObjectTypeDescriptor<MaintenanceRequest> descriptor)
        {
            descriptor.Field(m => m.Id).Type<NonNullType<IdType>>();
            descriptor.Field(m => m.Coproperty).ResolveWith<MaintenanceResolvers>(r => r.GetCoproperty(default!, default!));
            descriptor.Field(m => m.Unit).ResolveWith<MaintenanceResolvers>(r => r.GetUnit(default!, default!));
        }

        private class MaintenanceResolvers
        {
            public Models.Coproperty GetCoproperty([Parent] MaintenanceRequest request, [Service] CopropertyDbContext context)
            {
                return context.Coproperties.FirstOrDefault(c => c.Id == request.CopropertyId);
            }

            public Unit GetUnit([Parent] MaintenanceRequest request, [Service] CopropertyDbContext context)
            {
                return context.Units.FirstOrDefault(u => u.Id == request.UnitId);
            }
        }
    }
}
