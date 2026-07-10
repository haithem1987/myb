using Myb.Common.Models;

namespace Myb.Coproperty.Models;

/// <summary>
/// Represents a tenant occupying a unit in a coproperty.
/// </summary>
public class Tenant : IEntity<Guid>
{
    public Guid Id { get; set; }
    public Guid UnitId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public DateTime LeaseStartDate { get; set; } = DateTime.UtcNow;
    public DateTime? LeaseEndDate { get; set; }
    public decimal? MonthlyRent { get; set; }
    public decimal? DepositAmount { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;

    public Unit Unit { get; set; } = null!;
}
