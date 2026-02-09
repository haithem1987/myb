using HotChocolate.Types;
using Myb.Coproperty.Models;
using AssemblyStatusModel = Myb.Coproperty.Models.AssemblyStatus;

namespace Myb.Coproperty.GraphQL.Types;

public class AssemblyStatusEnumType : EnumType<AssemblyStatusModel>
{
    protected override void Configure(IEnumTypeDescriptor<AssemblyStatusModel> descriptor)
    {
        descriptor.Name("AssemblyStatus");
        descriptor.Value(AssemblyStatusModel.Scheduled).Name("SCHEDULED");
        descriptor.Value(AssemblyStatusModel.InProgress).Name("IN_PROGRESS");
        descriptor.Value(AssemblyStatusModel.Completed).Name("COMPLETED");
        descriptor.Value(AssemblyStatusModel.Cancelled).Name("CANCELLED");
    }
}
