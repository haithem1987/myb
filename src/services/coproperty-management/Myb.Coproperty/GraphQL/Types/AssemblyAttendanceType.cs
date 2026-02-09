using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.GraphQL.Types;

public class AssemblyAttendanceType : ObjectType<AssemblyAttendance>
{
    protected override void Configure(IObjectTypeDescriptor<AssemblyAttendance> descriptor)
    {
        descriptor.Field(a => a.Id).Type<NonNullType<IdType>>();
        descriptor.Field(a => a.AssemblyId).Type<NonNullType<IdType>>();
        descriptor.Field(a => a.OwnerId).Type<NonNullType<IdType>>();
        descriptor.Field(a => a.IsPresent).Type<NonNullType<BooleanType>>();
        descriptor.Field(a => a.HasProxy).Type<NonNullType<BooleanType>>();
        
        descriptor.Field(a => a.Assembly)
            .ResolveWith<AttendanceResolvers>(r => r.GetAssembly(default!, default!));
    }

    private class AttendanceResolvers
    {
        public Assembly GetAssembly([Parent] AssemblyAttendance attendance, [Service] CopropertyDbContext context)
        {
            return context.Assemblies.FirstOrDefault(a => a.Id == attendance.AssemblyId) ?? new Assembly();
        }
    }
}
