using HotChocolate.Types;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.GraphQL.Types;

public class SignalementObjectType : ObjectType<Signalement>
{
    protected override void Configure(IObjectTypeDescriptor<Signalement> descriptor)
    {
        descriptor.Field(s => s.Id).Type<NonNullType<IdType>>();
        descriptor.Field(s => s.CopropertyId).Type<NonNullType<IdType>>();
        descriptor.Field(s => s.ReportedBy).Type<NonNullType<IdType>>();
        descriptor.Field(s => s.ReporterName);
        descriptor.Field(s => s.Type).Type<NonNullType<EnumType<SignalementType>>>();
        descriptor.Field(s => s.Zone).Type<NonNullType<EnumType<SignalementZone>>>();
        descriptor.Field(s => s.Description);
        descriptor.Field(s => s.PhotoUrl);
        descriptor.Field(s => s.Status).Type<NonNullType<EnumType<SignalementStatus>>>();
        descriptor.Field(s => s.ViewsCount);
        descriptor.Field(s => s.SyndicComment);
        descriptor.Field(s => s.CreatedAt);
        descriptor.Field(s => s.UpdatedAt);
    }
}
