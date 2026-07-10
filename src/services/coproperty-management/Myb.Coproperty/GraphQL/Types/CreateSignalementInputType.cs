using HotChocolate.Types;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.GraphQL.Types;

public class CreateSignalementInputType : InputObjectType<CreateSignalementInput>
{
    protected override void Configure(IInputObjectTypeDescriptor<CreateSignalementInput> descriptor)
    {
        descriptor.Field(f => f.CopropertyId);
        descriptor.Field(f => f.ReportedBy);
        descriptor.Field(f => f.ReporterName);
        descriptor.Field(f => f.Type);
        descriptor.Field(f => f.Zone);
        descriptor.Field(f => f.Description);
        descriptor.Field(f => f.PhotoUrl);
    }
}
