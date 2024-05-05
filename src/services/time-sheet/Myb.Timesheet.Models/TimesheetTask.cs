using Myb.Common.Models;

namespace Myb.Timesheet.Models;

public class TimesheetTask:BaseEntity
{
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string Description { get; set; } = null!;

    // Navigation properties
    public int? EmployeeId { get; set; }
    public int? ProjectId { get; set; }
    public virtual Employee? Employee { get; set; }
    public virtual Project? Project { get; set; }
}