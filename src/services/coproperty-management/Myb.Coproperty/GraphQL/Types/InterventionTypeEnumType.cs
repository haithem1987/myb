using HotChocolate.Types;
using InterventionTypeModel = Myb.Coproperty.Models.InterventionType;

namespace Myb.Coproperty.GraphQL.Types;

public class InterventionTypeEnumType : EnumType<InterventionTypeModel>
{
    protected override void Configure(IEnumTypeDescriptor<InterventionTypeModel> descriptor)
    {
        descriptor.Name("InterventionCategory");
        descriptor.Value(InterventionTypeModel.Plumbing).Name("PLUMBING");
        descriptor.Value(InterventionTypeModel.Electricity).Name("ELECTRICITY");
        descriptor.Value(InterventionTypeModel.Elevator).Name("ELEVATOR");
        descriptor.Value(InterventionTypeModel.Cleaning).Name("CLEANING");
        descriptor.Value(InterventionTypeModel.Painting).Name("PAINTING");
        descriptor.Value(InterventionTypeModel.Locksmith).Name("LOCKSMITH");
        descriptor.Value(InterventionTypeModel.GardenMaintenance).Name("GARDEN_MAINTENANCE");
        descriptor.Value(InterventionTypeModel.PestControl).Name("PEST_CONTROL");
        descriptor.Value(InterventionTypeModel.FireSafety).Name("FIRE_SAFETY");
        descriptor.Value(InterventionTypeModel.RoofRepair).Name("ROOF_REPAIR");
        descriptor.Value(InterventionTypeModel.CommonAreaRepair).Name("COMMON_AREA_REPAIR");
        descriptor.Value(InterventionTypeModel.HeatingCooling).Name("HEATING_COOLING");
        descriptor.Value(InterventionTypeModel.SecuritySystem).Name("SECURITY_SYSTEM");
        descriptor.Value(InterventionTypeModel.WasteManagement).Name("WASTE_MANAGEMENT");
        descriptor.Value(InterventionTypeModel.Other).Name("OTHER");
    }
}
