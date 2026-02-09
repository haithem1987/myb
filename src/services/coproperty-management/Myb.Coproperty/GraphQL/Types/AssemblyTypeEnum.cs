using HotChocolate.Types;
using Myb.Coproperty.Models;
using AssemblyTypeModel = Myb.Coproperty.Models.AssemblyType;

namespace Myb.Coproperty.GraphQL.Types;

public class AssemblyTypeEnumType : EnumType<AssemblyTypeModel>
{
    protected override void Configure(IEnumTypeDescriptor<AssemblyTypeModel> descriptor)
    {
        descriptor.Name("AssemblyType");
        descriptor.Value(AssemblyTypeModel.Ordinary).Name("ORDINARY");
        descriptor.Value(AssemblyTypeModel.Extraordinary).Name("EXTRAORDINARY");
    }
}
