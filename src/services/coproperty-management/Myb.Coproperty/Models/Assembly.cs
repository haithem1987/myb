using Myb.Common.Models;

namespace Myb.Coproperty.Models;

/// <summary>
/// Represents a general assembly meeting for a coproperty
/// </summary>
public class Assembly : IEntity<Guid>
{
    public Guid Id { get; set; }
    public Guid CopropertyId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime MeetingDate { get; set; }
    public string? Location { get; set; }
    public string? Agenda { get; set; }
    public string? Minutes { get; set; }
    public AssemblyType AssemblyType { get; set; } = AssemblyType.Ordinary;
    public AssemblyStatus Status { get; set; } = AssemblyStatus.Scheduled;
    public bool IsActive { get; set; } = true;
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation Properties
    public Coproperty Coproperty { get; set; } = null!;
    public ICollection<AssemblyAttendance> Attendances { get; set; } = new List<AssemblyAttendance>();
}

public enum AssemblyType
{
    Ordinary,
    Extraordinary
}

public enum AssemblyStatus
{
    Scheduled,
    InProgress,
    Completed,
    Cancelled
}

/// <summary>
/// Represents attendance tracking for assembly meetings
/// </summary>
public class AssemblyAttendance : IEntity<Guid>
{
    public Guid Id { get; set; }
    public Guid AssemblyId { get; set; }
    public Guid OwnerId { get; set; }
    public bool IsPresent { get; set; }
    public bool HasProxy { get; set; }
    public string? ProxyHolderName { get; set; }
    public DateTime? CheckInTime { get; set; }
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation Properties
    public Assembly Assembly { get; set; } = null!;
}
