namespace Myb.Coproperty.Models;

/// <summary>
/// Method for distributing charges among units
/// </summary>
public enum DistributionMethod
{
    ByShares,      // Distribution par tantièmes
    ByArea,        // Distribution par surface
    Equal,         // Parts égales
    Custom         // Personnalisé
}
