using Myb.Common.Models;

namespace Myb.Coproperty.Models;

/// <summary>
/// Represents a coproperty (condominium) building or complex
/// </summary>
public class Coproperty : IEntity<Guid>
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Country { get; set; } = "France";
    public Currency Currency { get; set; } = Currency.EUR;
    public string? Description { get; set; }
    public int TotalUnits { get; set; }
    public int TotalShares { get; set; }
    public string? CommonAreas { get; set; }
    public string? ManagerName { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public bool IsActive { get; set; } = true;
    
    // Optional Foreign Key (if manager is tracked in system)
    public Guid? ManagerId { get; set; }
    
    // Navigation Properties
    public ICollection<Unit> Units { get; set; } = new List<Unit>();
    public ICollection<Charge> Charges { get; set; } = new List<Charge>();
    public ICollection<MaintenanceRequest> MaintenanceRequests { get; set; } = new List<MaintenanceRequest>();
    public ICollection<Intervention> Interventions { get; set; } = new List<Intervention>();
}
