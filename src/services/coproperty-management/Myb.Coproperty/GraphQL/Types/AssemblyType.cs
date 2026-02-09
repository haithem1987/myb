using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.GraphQL.Types;

public class AssemblyType : ObjectType<Assembly>
{
    protected override void Configure(IObjectTypeDescriptor<Assembly> descriptor)
    {
        descriptor.Field(a => a.Id).Type<NonNullType<IdType>>();
        descriptor.Field(a => a.Title).Type<NonNullType<StringType>>();
        descriptor.Field(a => a.MeetingDate).Type<NonNullType<DateTimeType>>();
        descriptor.Field(a => a.AssemblyType).Type<NonNullType<AssemblyTypeEnumType>>();
        descriptor.Field(a => a.Status).Type<NonNullType<AssemblyStatusEnumType>>();
        
        descriptor.Field(a => a.Coproperty)
            .ResolveWith<AssemblyResolvers>(r => r.GetCoproperty(default!, default!));
        
        descriptor.Field(a => a.Attendances)
            .ResolveWith<AssemblyResolvers>(r => r.GetAttendances(default!, default!));
    }

    private class AssemblyResolvers
    {
        public Models.Coproperty GetCoproperty([Parent] Assembly assembly, [Service] CopropertyDbContext context)
        {
            return context.Coproperties.FirstOrDefault(c => c.Id == assembly.CopropertyId) ?? new Models.Coproperty();
        }

        public IQueryable<AssemblyAttendance> GetAttendances([Parent] Assembly assembly, [Service] CopropertyDbContext context)
        {
            return context.AssemblyAttendances.Where(a => a.AssemblyId == assembly.Id);
        }
    }
}
